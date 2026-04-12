using System;
using UnityEngine;

/// <summary>
/// VisionField VR — WebSocket JSON Serialisering
///
/// Håndterer serialisering/deserialisering af WebSocket-beskeder.
/// Bruger Unity's JsonUtility (ingen extern afhængighed).
///
/// SIKKERHED: Aldrig patientdata i serialiserede beskeder.
/// Fejlbeskeder indeholder kun kode + session_id.
/// </summary>
namespace VisionField.Network
{
    public static class WebSocketSerializer
    {
        /// <summary>
        /// Serialisér en WebSocket-besked til JSON.
        /// </summary>
        public static string Serialize(WebSocketMessage message)
        {
            if (message == null)
                throw new ArgumentNullException(nameof(message));

            return JsonUtility.ToJson(message);
        }

        /// <summary>
        /// Deserialisér JSON til en WebSocket-besked.
        /// Dispatcher baseret på "type"-felt.
        /// </summary>
        public static WebSocketMessage Deserialize(string json)
        {
            if (string.IsNullOrEmpty(json))
                throw new ArgumentException("JSON string er tom eller null");

            // Læs type-felt for at bestemme konkret type
            var baseMsg = JsonUtility.FromJson<WebSocketMessage>(json);
            if (baseMsg == null || string.IsNullOrEmpty(baseMsg.type))
                throw new FormatException("WebSocket-besked mangler 'type' felt");

            switch (baseMsg.type)
            {
                case EventType.SESSION_START:
                    return JsonUtility.FromJson<SessionStartMessage>(json);

                case EventType.STIMULUS_RESULT:
                    return JsonUtility.FromJson<StimulusResultMessage>(json);

                case EventType.FIXATION_UPDATE:
                    return JsonUtility.FromJson<FixationUpdateMessage>(json);

                case EventType.SESSION_COMPLETE:
                    return JsonUtility.FromJson<SessionCompleteMessage>(json);

                case EventType.SESSION_ABORT:
                    return JsonUtility.FromJson<SessionAbortMessage>(json);

                case EventType.CALIBRATION_UPDATE:
                    return JsonUtility.FromJson<CalibrationUpdateMessage>(json);

                case EventType.ERROR:
                    return JsonUtility.FromJson<ErrorMessage>(json);

                default:
                    Debug.LogWarning($"[WebSocketSerializer] Ukendt beskedtype: {baseMsg.type}");
                    return baseMsg;
            }
        }

        /// <summary>
        /// Deserialisér til en specifik beskedtype (type-safe).
        /// Kaster InvalidCastException hvis typen ikke matcher.
        /// </summary>
        public static T Deserialize<T>(string json) where T : WebSocketMessage
        {
            var msg = Deserialize(json);
            if (msg is T typed)
                return typed;

            throw new InvalidCastException(
                $"Forventede {typeof(T).Name}, men modtog {msg.GetType().Name}");
        }
    }
}
