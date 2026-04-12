/**
 * Operator Live Monitor — Real-time testovervågning
 *
 * Inspireret af Specvis dual-screen setup:
 * - Optikeren ser testprogress i realtid på tablet/PC
 * - Fiksationsstatus (grøn/gul/rød)
 * - Stimulus-log (seneste præsentationer)
 * - Aktuel tærskelestimering per punkt
 * - Patient-respons feedback
 *
 * Forbinder via WebSocket til backend for live data.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../store/authStore";

interface StimulusEvent {
  gridPointId: number;
  intensityDb: number;
  responded: boolean;
  fixationOk: boolean;
  catchTrialType: string | null;
  timestamp: number;
}

interface FixationStatus {
  isOk: boolean;
  deviationDeg: number;
}

export default function OperatorMonitorPage() {
  const token = useAuthStore((s) => s.token);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fixation, setFixation] = useState<FixationStatus>({ isOk: true, deviationDeg: 0 });
  const [stimuli, setStimuli] = useState<StimulusEvent[]>([]);
  const [totalStimuli, setTotalStimuli] = useState(0);
  const [fpCount, setFpCount] = useState({ trials: 0, responses: 0 });
  const [fnCount, setFnCount] = useState({ trials: 0, responses: 0 });
  const [fixLosses, setFixLosses] = useState({ checks: 0, losses: 0 });
  const [testStatus, setTestStatus] = useState<string>("Venter på test...");
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Timer
  useEffect(() => {
    if (!testStartTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - testStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [testStartTime]);

  // WebSocket forbindelse
  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:3001/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setTestStatus("Forbundet — venter på test...");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      setTestStatus("Forbindelse tabt — genopretter...");
      setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      setTestStatus("Forbindelsesfejl");
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => { wsRef.current?.close(); };
  }, [connect]);

  const handleMessage = (msg: any) => {
    switch (msg.type) {
      case "SESSION_START":
        setSessionId(msg.session_id);
        setTestStatus("Test kører...");
        setTestStartTime(Date.now());
        setStimuli([]);
        setTotalStimuli(0);
        setFpCount({ trials: 0, responses: 0 });
        setFnCount({ trials: 0, responses: 0 });
        setFixLosses({ checks: 0, losses: 0 });
        break;

      case "STIMULUS_RESULT":
        const s: StimulusEvent = {
          gridPointId: msg.grid_point_id,
          intensityDb: msg.intensity_db,
          responded: msg.responded,
          fixationOk: msg.fixation_ok,
          catchTrialType: msg.catch_trial_type,
          timestamp: Date.now(),
        };
        setStimuli(prev => [s, ...prev].slice(0, 50));
        setTotalStimuli(prev => prev + 1);

        // Catch trials
        if (msg.catch_trial_type === "false_positive") {
          setFpCount(prev => ({
            trials: prev.trials + 1,
            responses: prev.responses + (msg.responded ? 1 : 0),
          }));
        } else if (msg.catch_trial_type === "false_negative") {
          setFnCount(prev => ({
            trials: prev.trials + 1,
            responses: prev.responses + (msg.responded ? 0 : 1),
          }));
        }

        // Fixation
        setFixLosses(prev => ({
          checks: prev.checks + 1,
          losses: prev.losses + (msg.fixation_ok ? 0 : 1),
        }));
        break;

      case "FIXATION_UPDATE":
        setFixation({ isOk: msg.is_ok, deviationDeg: msg.deviation_deg });
        break;

      case "SESSION_COMPLETE":
        setTestStatus("Test afsluttet");
        setTestStartTime(null);
        break;

      case "SESSION_ABORT":
        setTestStatus(`Test afbrudt: ${msg.reason}`);
        setTestStartTime(null);
        break;
    }
  };

  const fpRate = fpCount.trials > 0 ? fpCount.responses / fpCount.trials : 0;
  const fnRate = fnCount.trials > 0 ? fnCount.responses / fnCount.trials : 0;
  const fixLossRate = fixLosses.checks > 0 ? fixLosses.losses / fixLosses.checks : 0;
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Operator Monitor</h2>
      <p className="text-sm text-gray-500 mb-6">Realtids-overvågning af synsfeltstest</p>

      {/* Status bar */}
      <div className={`rounded-lg p-4 mb-6 flex items-center justify-between ${
        connected ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="font-medium">{testStatus}</span>
          {sessionId && <span className="text-xs text-gray-400">ID: {sessionId.slice(0, 8)}...</span>}
        </div>
        <div className="text-2xl font-mono font-bold text-gray-800">
          {min}:{sec.toString().padStart(2, "0")}
        </div>
      </div>

      {/* Live metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {/* Fiksation */}
        <div className={`rounded-lg border p-4 text-center ${
          fixation.isOk ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}>
          <div className={`text-3xl mb-1 ${fixation.isOk ? "text-green-600" : "text-red-600"}`}>
            {fixation.isOk ? "●" : "✕"}
          </div>
          <div className="text-xs font-medium text-gray-600">Fiksation</div>
          <div className="text-xs text-gray-400">{fixation.deviationDeg.toFixed(1)}°</div>
        </div>

        {/* Stimuli tæller */}
        <div className="rounded-lg border bg-white p-4 text-center">
          <div className="text-3xl font-bold text-gray-800">{totalStimuli}</div>
          <div className="text-xs font-medium text-gray-600">Stimuli</div>
        </div>

        {/* False Positive */}
        <div className={`rounded-lg border p-4 text-center ${fpRate >= 0.33 ? "bg-red-50 border-red-200" : "bg-white"}`}>
          <div className={`text-2xl font-bold ${fpRate >= 0.33 ? "text-red-600" : "text-gray-800"}`}>
            {(fpRate * 100).toFixed(0)}%
          </div>
          <div className="text-xs font-medium text-gray-600">False Pos</div>
          <div className="text-xs text-gray-400">{fpCount.responses}/{fpCount.trials}</div>
        </div>

        {/* False Negative */}
        <div className={`rounded-lg border p-4 text-center ${fnRate >= 0.33 ? "bg-red-50 border-red-200" : "bg-white"}`}>
          <div className={`text-2xl font-bold ${fnRate >= 0.33 ? "text-red-600" : "text-gray-800"}`}>
            {(fnRate * 100).toFixed(0)}%
          </div>
          <div className="text-xs font-medium text-gray-600">False Neg</div>
          <div className="text-xs text-gray-400">{fnCount.responses}/{fnCount.trials}</div>
        </div>

        {/* Fixation Loss */}
        <div className={`rounded-lg border p-4 text-center ${fixLossRate >= 0.20 ? "bg-red-50 border-red-200" : "bg-white"}`}>
          <div className={`text-2xl font-bold ${fixLossRate >= 0.20 ? "text-red-600" : "text-gray-800"}`}>
            {(fixLossRate * 100).toFixed(0)}%
          </div>
          <div className="text-xs font-medium text-gray-600">Fix Loss</div>
          <div className="text-xs text-gray-400">{fixLosses.losses}/{fixLosses.checks}</div>
        </div>
      </div>

      {/* Stimulus log */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">Stimulus Log</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left sticky top-0">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-500">#</th>
                <th className="px-4 py-2 font-medium text-gray-500">Punkt</th>
                <th className="px-4 py-2 font-medium text-gray-500">dB</th>
                <th className="px-4 py-2 font-medium text-gray-500">Respons</th>
                <th className="px-4 py-2 font-medium text-gray-500">Fiksation</th>
                <th className="px-4 py-2 font-medium text-gray-500">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stimuli.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Venter på stimuli...
                  </td>
                </tr>
              ) : (
                stimuli.map((s, i) => (
                  <tr key={i} className={i === 0 ? "bg-blue-50" : "hover:bg-gray-50"}>
                    <td className="px-4 py-2 font-mono text-gray-400">{totalStimuli - i}</td>
                    <td className="px-4 py-2 font-mono">{s.gridPointId}</td>
                    <td className="px-4 py-2 font-mono">{s.intensityDb.toFixed(1)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        s.responded ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {s.responded ? "Ja" : "Nej"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        s.fixationOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {s.fixationOk ? "OK" : "Tabt"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {s.catchTrialType ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                          {s.catchTrialType === "false_positive" ? "FP" : "FN"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
