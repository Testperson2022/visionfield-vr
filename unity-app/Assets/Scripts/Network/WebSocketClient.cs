using System;
using System.Collections;
using System.Text;
using UnityEngine;
using VisionField.Core;

/// <summary>
/// VisionField VR — WebSocket Client
///
/// Håndterer WebSocket-forbindelse til backend med:
/// - JWT-autentificering via header
/// - Auto-reconnect med exponential backoff
/// - Heartbeat (ping/pong) for forbindelsesmonitorering
/// - Thread-safe beskedhåndtering via Unity main thread dispatch
///
/// SIKKERHED:
/// - Kun WSS (TLS) i produktion — ws:// kun tilladt i development
/// - JWT-token sendes som subprotocol (NativeWebSocket header-limitation)
/// - Ingen patientdata i logs eller fejlbeskeder
///
/// Integration: Bruger NativeWebSocket-biblioteket (Meta Quest 3 kompatibelt).
/// I denne implementation: abstrakt interface, klar til NativeWebSocket-binding.
/// </summary>
namespace VisionField.Network
{
    /// <summary>WebSocket forbindelsestilstand.</summary>
    public enum ConnectionState
    {
        Disconnected,
        Connecting,
        Connected,
        Reconnecting,
        Failed
    }

    public class WebSocketClient : MonoBehaviour
    {
        [Header("Connection")]
        [SerializeField] private string _serverUrl = "wss://localhost:3001";
        [SerializeField] private float _heartbeatIntervalSec = 10f;
        [SerializeField] private int _maxReconnectAttempts = 5;

        // State
        private ConnectionState _state = ConnectionState.Disconnected;
        private string _jwtToken;
        private int _reconnectAttempts;
        private float _lastHeartbeatTime;
        private Coroutine _reconnectCoroutine;

        // Message queue (thread-safe dispatch til main thread)
        private readonly System.Collections.Generic.Queue<string> _incomingMessages =
            new System.Collections.Generic.Queue<string>();
        private readonly object _queueLock = new object();

        // ─── Public properties ───────────────────────────────────────

        public ConnectionState State => _state;
        public bool IsConnected => _state == ConnectionState.Connected;

        // ─── Events ──────────────────────────────────────────────────

        /// <summary>Forbindelse etableret.</summary>
        public event Action OnConnected;

        /// <summary>Forbindelse tabt (med årsag).</summary>
        public event Action<string> OnDisconnected;

        /// <summary>Fejl opstået.</summary>
        public event Action<string> OnError;

        /// <summary>Besked modtaget (rå JSON).</summary>
        public event Action<string> OnRawMessageReceived;

        /// <summary>Parseret besked modtaget.</summary>
        public event Action<WebSocketMessage> OnMessageReceived;

        // ─── Public API ──────────────────────────────────────────────

        /// <summary>
        /// Opret forbindelse til backend WebSocket server.
        /// </summary>
        /// <param name="url">WSS URL (fx "wss://api.visionfield.dk:3001")</param>
        /// <param name="jwtToken">JWT-token til autentificering</param>
        public void Connect(string url, string jwtToken)
        {
            if (_state == ConnectionState.Connected || _state == ConnectionState.Connecting)
            {
                Debug.LogWarning("[WebSocketClient] Allerede forbundet eller forbinder");
                return;
            }

            _serverUrl = url;
            _jwtToken = jwtToken;
            _reconnectAttempts = 0;
            _state = ConnectionState.Connecting;

            // SIKKERHED: Validér at URL bruger WSS i produktion
            #if !UNITY_EDITOR
            if (!url.StartsWith("wss://", StringComparison.OrdinalIgnoreCase))
            {
                Debug.LogError("[WebSocketClient] SIKKERHED: Kun WSS tilladt i produktion");
                _state = ConnectionState.Failed;
                OnError?.Invoke("SECURITY_WSS_REQUIRED");
                return;
            }
            #endif

            ConnectInternal();
        }

        /// <summary>Luk forbindelse.</summary>
        public void Disconnect()
        {
            if (_reconnectCoroutine != null)
            {
                StopCoroutine(_reconnectCoroutine);
                _reconnectCoroutine = null;
            }

            DisconnectInternal();
            _state = ConnectionState.Disconnected;
            _reconnectAttempts = 0;
        }

        /// <summary>
        /// Send en WebSocket-besked til backend.
        /// Serialiserer automatisk til JSON.
        /// </summary>
        public void Send(WebSocketMessage message)
        {
            if (!IsConnected)
            {
                Debug.LogWarning("[WebSocketClient] Kan ikke sende — ikke forbundet");
                return;
            }

            string json = WebSocketSerializer.Serialize(message);
            SendRaw(json);
        }

        /// <summary>Send rå JSON-streng.</summary>
        public void SendRaw(string json)
        {
            if (!IsConnected) return;
            SendInternal(Encoding.UTF8.GetBytes(json));
        }

        // ─── Unity lifecycle ─────────────────────────────────────────

        private void Update()
        {
            // Dispatch indgående beskeder på main thread
            DispatchMessages();

            // Heartbeat
            if (IsConnected && Time.realtimeSinceStartup - _lastHeartbeatTime > _heartbeatIntervalSec)
            {
                SendHeartbeat();
                _lastHeartbeatTime = Time.realtimeSinceStartup;
            }
        }

        private void OnDestroy()
        {
            Disconnect();
        }

        // ─── Message dispatch (main thread) ──────────────────────────

        private void DispatchMessages()
        {
            lock (_queueLock)
            {
                while (_incomingMessages.Count > 0)
                {
                    string json = _incomingMessages.Dequeue();
                    ProcessMessage(json);
                }
            }
        }

        /// <summary>Tilføj besked til dispatch-kø (kan kaldes fra enhver tråd).</summary>
        protected void EnqueueMessage(string json)
        {
            lock (_queueLock)
            {
                _incomingMessages.Enqueue(json);
            }
        }

        private void ProcessMessage(string json)
        {
            OnRawMessageReceived?.Invoke(json);

            try
            {
                var message = WebSocketSerializer.Deserialize(json);
                OnMessageReceived?.Invoke(message);
            }
            catch (Exception ex)
            {
                // SIKKERHED: Log kun beskedtype, ALDRIG indhold (kan indeholde session-data)
                Debug.LogWarning($"[WebSocketClient] Fejl ved parsing af besked: {ex.Message}");
                OnError?.Invoke("PARSE_ERROR");
            }
        }

        // ─── Reconnect med exponential backoff ───────────────────────

        protected void HandleDisconnect(string reason)
        {
            if (_state == ConnectionState.Disconnected)
                return; // Intentional disconnect

            _state = ConnectionState.Reconnecting;
            OnDisconnected?.Invoke(reason);

            if (_reconnectAttempts < _maxReconnectAttempts)
            {
                _reconnectCoroutine = StartCoroutine(ReconnectCoroutine());
            }
            else
            {
                _state = ConnectionState.Failed;
                OnError?.Invoke("MAX_RECONNECT_ATTEMPTS");
                Debug.LogError("[WebSocketClient] Max reconnect-forsøg nået");
            }
        }

        private IEnumerator ReconnectCoroutine()
        {
            _reconnectAttempts++;
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            float delay = (float)Math.Pow(2, _reconnectAttempts - 1);
            Debug.Log($"[WebSocketClient] Reconnect forsøg {_reconnectAttempts}/{_maxReconnectAttempts} om {delay}s");

            float startTime = Time.realtimeSinceStartup;
            while (Time.realtimeSinceStartup - startTime < delay)
                yield return null;

            _state = ConnectionState.Connecting;
            ConnectInternal();
        }

        protected void HandleConnected()
        {
            _state = ConnectionState.Connected;
            _reconnectAttempts = 0;
            _lastHeartbeatTime = Time.realtimeSinceStartup;
            OnConnected?.Invoke();
        }

        protected void HandleError(string error)
        {
            // SIKKERHED: Aldrig log detaljeret fejlinformation
            OnError?.Invoke(error);
        }

        // ─── NativeWebSocket integration stubs ───────────────────────
        // Overrides i produktion med NativeWebSocket-binding.

        /// <summary>Etablér WebSocket-forbindelse. Override med NativeWebSocket.</summary>
        protected virtual void ConnectInternal()
        {
            // Stub — i produktion:
            // var ws = new NativeWebSocket.WebSocket(_serverUrl, new Dictionary<string, string> {
            //     { "Authorization", $"Bearer {_jwtToken}" }
            // });
            // ws.OnOpen += () => HandleConnected();
            // ws.OnMessage += (bytes) => EnqueueMessage(Encoding.UTF8.GetString(bytes));
            // ws.OnClose += (code) => HandleDisconnect(code.ToString());
            // ws.OnError += (error) => HandleError(error);
            // ws.Connect();

            HandleConnected(); // Stub: simulér forbindelse
        }

        /// <summary>Luk WebSocket-forbindelse. Override med NativeWebSocket.</summary>
        protected virtual void DisconnectInternal()
        {
            // Stub — i produktion: ws.Close();
        }

        /// <summary>Send bytes via WebSocket. Override med NativeWebSocket.</summary>
        protected virtual void SendInternal(byte[] data)
        {
            // Stub — i produktion: ws.Send(data);
        }

        /// <summary>Send heartbeat ping. Override om nødvendigt.</summary>
        protected virtual void SendHeartbeat()
        {
            // NativeWebSocket håndterer ping/pong automatisk
            // Alternativt: send custom ping-besked
        }
    }
}
