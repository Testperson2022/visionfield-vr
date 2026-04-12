/**
 * VisionField VR — Editor Simulator
 *
 * Simulerer hele patientflowet i Unity Editor UDEN VR-headset.
 * Brug: Tilføjes automatisk til scenen. Tryk Play i Editor.
 *
 * Kontroller:
 *   SPACE     = patient-respons (trykker "jeg ser lys")
 *   ENTER     = næste / start test
 *   ESC       = pause/resume
 *   TAB       = skip kalibrering (hurtig test)
 *
 * Simulerer:
 *   - Eye tracking med perfekt fiksation (ingen headset nødvendigt)
 *   - 200ms stimulus-flash som hvid kugle i scenen
 *   - Full ZEST-algoritme over alle 52 testpunkter
 *   - Resultater vises i Console ved afslutning
 */
using UnityEngine;
using VisionField.Core;
using VisionField.Core.Models;
using VisionField.Stimuli;
using VisionField.EyeTracking;
using VisionField.UI;
using System.Collections;

public class SimulatorController : MonoBehaviour
{
    [Header("Auto-assigned")]
    [SerializeField] private TestStateMachine _stateMachine;
    [SerializeField] private StimulusRenderer _stimulusRenderer;
    [SerializeField] private EyeTrackingController _eyeTrackingController;

    private ZestTestRunner _testRunner;
    private bool _waitingForResponse;
    private StimulusRequest _currentStimulus;
    private float _stimulusOnsetTime;
    private int _stimuliPresented;
    private float _testStartTime;
    private bool _testRunning;

    // Simuleret patient-tærskel (justér for at simulere forskellige patienter)
    [Header("Simuleret Patient")]
    [Tooltip("Simuleret tærskel i dB — 30 = normal, 15 = nedsat, 0 = blind")]
    [SerializeField] private float _simulatedThresholdDb = 28f;

    [Tooltip("Auto-respons (ingen manuel input nødvendig)")]
    [SerializeField] private bool _autoRespond = false;

    [Tooltip("Hastighed for auto-test (0.1 = hurtig, 1.0 = realtid)")]
    [SerializeField] private float _testSpeed = 0.3f;

    private void Start()
    {
        Debug.Log("=== VisionField VR Simulator ===");
        Debug.Log("Kontroller:");
        Debug.Log("  ENTER = Start test");
        Debug.Log("  SPACE = Patient-respons (jeg ser lys)");
        Debug.Log("  ESC   = Pause/Resume");
        Debug.Log("  TAB   = Skip kalibrering");
        Debug.Log($"Simuleret tærskel: {_simulatedThresholdDb} dB");
        Debug.Log($"Auto-respons: {(_autoRespond ? "JA" : "NEJ (tryk SPACE)")}");
        Debug.Log("================================");
        Debug.Log("Tryk ENTER for at starte...");
    }

    private void Update()
    {
        // Start test
        if (Input.GetKeyDown(KeyCode.Return) && !_testRunning)
        {
            StartSimulatedTest();
        }

        // Patient-respons (manuelt)
        if (Input.GetKeyDown(KeyCode.Space) && _waitingForResponse)
        {
            float responseTime = (Time.realtimeSinceStartup - _stimulusOnsetTime) * 1000f;
            RegisterResponse(true, responseTime);
        }

        // Pause
        if (Input.GetKeyDown(KeyCode.Escape) && _testRunning)
        {
            _testRunning = !_testRunning;
            Debug.Log(_testRunning ? "▶ RESUMED" : "⏸ PAUSED");
        }

        // Skip kalibrering
        if (Input.GetKeyDown(KeyCode.Tab) && !_testRunning)
        {
            Debug.Log("Kalibrering skippet — starter test direkte");
            StartSimulatedTest();
        }
    }

    private void StartSimulatedTest()
    {
        _testRunner = new ZestTestRunner(Eye.OD, catchTrialFrequencyPer10: 1, seed: 42);
        _testRunning = true;
        _stimuliPresented = 0;
        _testStartTime = Time.realtimeSinceStartup;

        Debug.Log("=== TEST STARTET (OD - Højre øje) ===");
        Debug.Log($"52 testpunkter, ZEST-algoritme, simuleret tærskel: {_simulatedThresholdDb} dB");

        StartCoroutine(TestLoopCoroutine());
    }

    private IEnumerator TestLoopCoroutine()
    {
        int maxTotalStimuli = 3000; // Safety limit
        while (_testRunning && !_testRunner.IsComplete && _stimuliPresented < maxTotalStimuli)
        {
            // Hent næste stimulus
            _currentStimulus = _testRunner.GetNextStimulus();
            if (_currentStimulus == null) break;

            _stimuliPresented++;

            // Vis stimulus info
            ShowStimulus(_currentStimulus);
            _stimulusOnsetTime = Time.realtimeSinceStartup;

            // Kort pause mellem stimuli (hurtigere end realtid)
            yield return null; // Ét frame
            HideStimulus();

            if (_autoRespond)
            {
                // Automatisk respons baseret på simuleret tærskel
                bool seen = _currentStimulus.IntensityDb <= _simulatedThresholdDb;
                // Tilføj lidt støj
                if (Random.value < 0.05f) seen = !seen; // 5% fejlrate

                if (seen)
                {
                    float responseTime = Random.Range(150f, 500f);
                    RegisterResponse(true, responseTime);
                }
                else
                {
                    RegisterResponse(false, -1f);
                }
            }
            else
            {
                // Vent på manuel respons (SPACE) eller timeout
                _waitingForResponse = true;
                float timeout = 1.5f * _testSpeed;
                float waitStart = Time.realtimeSinceStartup;

                while (_waitingForResponse &&
                       Time.realtimeSinceStartup - waitStart < timeout)
                {
                    yield return null;
                }

                if (_waitingForResponse)
                {
                    // Timeout — ingen respons
                    RegisterResponse(false, -1f);
                }
            }

            // Progress log hvert 10. stimulus
            if (_stimuliPresented % 10 == 0)
            {
                Debug.Log($"  Progress: {_stimuliPresented} stimuli præsenteret...");
            }
        }

        if (_testRunner.IsComplete)
        {
            CompleteTest();
        }
    }

    private void RegisterResponse(bool responded, float responseTimeMs)
    {
        _waitingForResponse = false;

        var catchType = _currentStimulus.CatchTrialType;
        _testRunner.RecordResponse(
            _currentStimulus.GridPointId,
            responded,
            _currentStimulus.IntensityDb,
            fixationOk: true, // Simuleret perfekt fiksation
            catchTrialType: catchType
        );

        if (catchType != CatchTrialType.None)
        {
            string type = catchType == CatchTrialType.FalsePositive ? "FP" : "FN";
            Debug.Log($"  Catch trial ({type}): responded={responded}");
        }
    }

    private void CompleteTest()
    {
        _testRunning = false;
        float duration = Time.realtimeSinceStartup - _testStartTime;

        var results = _testRunner.ComputeResults();
        var quality = _testRunner.ComputeQualityMetrics(duration);

        Debug.Log("============================================");
        Debug.Log("=== TEST AFSLUTTET — RESULTATER ===");
        Debug.Log("============================================");
        Debug.Log($"Øje: OD (Højre)");
        Debug.Log($"Varighed: {duration:F0} sekunder");
        Debug.Log($"Stimuli præsenteret: {_stimuliPresented}");
        Debug.Log("--------------------------------------------");
        Debug.Log($"Mean Deviation (MD): {results.MeanDeviationDb:F1} dB");
        Debug.Log($"Pattern SD (PSD):    {results.PatternSdDb:F1} dB");
        Debug.Log($"GHT:                 {results.GHT}");
        Debug.Log("--------------------------------------------");
        Debug.Log($"TRIAGE: {results.TriageClassification.ToString().ToUpper()}");
        Debug.Log($"  → {results.TriageRecommendation}");
        Debug.Log("--------------------------------------------");
        Debug.Log($"False Positive Rate: {quality.FalsePositiveRate:P0}");
        Debug.Log($"False Negative Rate: {quality.FalseNegativeRate:P0}");
        Debug.Log($"Fixation Loss Rate:  {quality.FixationLossRate:P0}");
        Debug.Log($"Pålidelig:           {(quality.IsReliable ? "JA" : "NEJ")}");
        Debug.Log("============================================");

        if (results.PointResults != null)
        {
            Debug.Log($"Punkt-resultater ({results.PointResults.Length} punkter):");
            foreach (var pr in results.PointResults)
            {
                Debug.Log($"  Punkt {pr.GridPointId:D2}: " +
                    $"tærskel={pr.ThresholdDb:F1} dB, " +
                    $"afvigelse={pr.TotalDeviationDb:F1} dB, " +
                    $"stimuli={pr.NumStimuli}");
            }
        }
    }

    private void ShowStimulus(StimulusRequest request)
    {
        // I simulator: skip StimulusRenderer (undgår timing-konflikter)
        // Log hver 50. stimulus for at undgå Console-spam
        if (_stimuliPresented % 50 == 1)
        {
            string catchInfo = request.CatchTrialType != CatchTrialType.None
                ? $" [CATCH:{request.CatchTrialType}]"
                : "";
            Debug.Log($"  Stimulus #{_stimuliPresented}: " +
                $"punkt={request.GridPointId}, " +
                $"dB={request.IntensityDb:F1}" +
                catchInfo);
        }
    }

    private void HideStimulus()
    {
        // Ingen visuel stimulus i simulator-mode
    }
}
