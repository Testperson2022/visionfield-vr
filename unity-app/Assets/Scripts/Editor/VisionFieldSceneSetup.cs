/**
 * VisionField VR — Automatisk Scene Setup
 *
 * Kør via Unity menu: VisionField → Setup Test Scene
 * Opretter hele scenen med alle nødvendige GameObjects og komponenter.
 *
 * Hvad den gør:
 * 1. Opretter baggrundskugle (10 cd/m² simuleret)
 * 2. Opretter stimulus-objekt (Goldmann III)
 * 3. Opretter fiksationspunkt (rød prik, 0.3°)
 * 4. Opretter XR Origin med kamera
 * 5. Tilføjer alle VisionField-komponenter
 * 6. Forbinder alle references i Inspector
 * 7. Opretter UI Canvas med HUD, instruktioner og resultater
 * 8. Gemmer scenen
 */
#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using VisionField.UI;
using VisionField.Stimuli;
using VisionField.EyeTracking;
using VisionField.Network;

public class VisionFieldSceneSetup
{
    [MenuItem("VisionField/Setup Test Scene", false, 1)]
    public static void SetupScene()
    {
        // Ny scene
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // ─── XR Origin (kamera) ──────────────────────────────────────
        var xrOrigin = new GameObject("XR Origin");
        var cameraOffset = new GameObject("Camera Offset");
        cameraOffset.transform.SetParent(xrOrigin.transform);

        var mainCamera = new GameObject("Main Camera");
        mainCamera.transform.SetParent(cameraOffset.transform);
        mainCamera.tag = "MainCamera";
        var cam = mainCamera.AddComponent<Camera>();
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = Color.black;
        cam.nearClipPlane = 0.01f;
        cam.farClipPlane = 100f;

        // ─── Baggrundskugle ──────────────────────────────────────────
        var background = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        background.name = "Background Sphere";
        background.transform.localScale = Vector3.one * 50f;
        background.transform.position = Vector3.zero;
        // Flip normals (se indefra)
        var bgRenderer = background.GetComponent<MeshRenderer>();
        var bgMat = new Material(Shader.Find("Universal Render Pipeline/Unlit")
            ?? Shader.Find("Unlit/Color")
            ?? Shader.Find("Standard"));
        bgMat.name = "BackgroundMaterial";
        bgMat.color = new Color(0.03f, 0.03f, 0.03f); // ~10 cd/m² simuleret
        bgRenderer.material = bgMat;

        // ─── Stimulus objekt ─────────────────────────────────────────
        var stimulus = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        stimulus.name = "Stimulus";
        stimulus.transform.localScale = Vector3.one * 0.0075f; // Goldmann III ved 1m
        stimulus.transform.position = new Vector3(0, 0, 1);
        stimulus.SetActive(false);
        var stimRenderer = stimulus.GetComponent<MeshRenderer>();
        var stimMat = new Material(Shader.Find("Universal Render Pipeline/Unlit")
            ?? Shader.Find("Unlit/Color")
            ?? Shader.Find("Standard"));
        stimMat.name = "StimulusMaterial";
        stimMat.color = Color.white;
        stimMat.EnableKeyword("_EMISSION");
        stimRenderer.material = stimMat;
        // Fjern collider (ikke nødvendig)
        Object.DestroyImmediate(stimulus.GetComponent<Collider>());

        // ─── Fiksationspunkt (rød prik) ──────────────────────────────
        var fixation = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        fixation.name = "Fixation Point";
        fixation.transform.localScale = Vector3.one * 0.005f; // 0.3° ved 1m
        fixation.transform.position = new Vector3(0, 0, 1);
        var fixRenderer = fixation.GetComponent<MeshRenderer>();
        var fixMat = new Material(Shader.Find("Universal Render Pipeline/Unlit")
            ?? Shader.Find("Unlit/Color")
            ?? Shader.Find("Standard"));
        fixMat.name = "FixationMaterial";
        fixMat.color = Color.red;
        fixRenderer.material = fixMat;
        Object.DestroyImmediate(fixation.GetComponent<Collider>());

        // ─── Controllers container ───────────────────────────────────
        var controllers = new GameObject("VisionField Controllers");

        // StimulusRenderer
        var stimComp = controllers.AddComponent<StimulusRenderer>();
        SetPrivateField(stimComp, "_stimulusObject", stimulus);
        SetPrivateField(stimComp, "_stimulusRenderer", stimRenderer);
        SetPrivateField(stimComp, "_backgroundSphere", bgRenderer);
        SetPrivateField(stimComp, "_fixationPoint", fixation);

        // EyeTrackingController
        var eyeComp = controllers.AddComponent<EyeTrackingController>();
        SetPrivateField(eyeComp, "_headTransform", mainCamera.transform);
        SetPrivateField(eyeComp, "_fixationPointTransform", fixation.transform);

        // WebSocketClient
        var wsComp = controllers.AddComponent<WebSocketClient>();

        // TestSessionSync
        var syncComp = controllers.AddComponent<TestSessionSync>();
        SetPrivateField(syncComp, "_webSocketClient", wsComp);
        SetPrivateField(syncComp, "_stimulusRenderer", stimComp);
        SetPrivateField(syncComp, "_eyeTrackingController", eyeComp);

        // VRInputHandler
        var inputComp = controllers.AddComponent<VRInputHandler>();

        // ─── UI Canvas ───────────────────────────────────────────────
        var canvas = new GameObject("UI Canvas");
        var canvasComp = canvas.AddComponent<Canvas>();
        canvasComp.renderMode = RenderMode.WorldSpace;
        canvas.transform.position = new Vector3(0, 0, 2);
        canvas.transform.localScale = Vector3.one * 0.001f;
        canvas.AddComponent<UnityEngine.UI.CanvasScaler>();

        // Instructions screen
        var instructionsGO = new GameObject("Instructions Screen");
        instructionsGO.transform.SetParent(canvas.transform, false);
        var instrText = new GameObject("InstructionText");
        instrText.transform.SetParent(instructionsGO.transform, false);
        instrText.AddComponent<UnityEngine.UI.Text>();
        var eyeText = new GameObject("EyeIndicator");
        eyeText.transform.SetParent(instructionsGO.transform, false);
        eyeText.AddComponent<UnityEngine.UI.Text>();
        var instrComp = instructionsGO.AddComponent<InstructionsScreen>();
        SetPrivateField(instrComp, "_screenRoot", instructionsGO);
        SetPrivateField(instrComp, "_instructionText", instrText.GetComponent<UnityEngine.UI.Text>());
        SetPrivateField(instrComp, "_eyeIndicatorText", eyeText.GetComponent<UnityEngine.UI.Text>());

        // Test HUD
        var hudGO = new GameObject("Test HUD");
        hudGO.transform.SetParent(canvas.transform, false);
        var progressText = new GameObject("ProgressText");
        progressText.transform.SetParent(hudGO.transform, false);
        progressText.AddComponent<UnityEngine.UI.Text>();
        var timeText = new GameObject("TimeText");
        timeText.transform.SetParent(hudGO.transform, false);
        timeText.AddComponent<UnityEngine.UI.Text>();
        var fixIndicator = new GameObject("FixationIndicator");
        fixIndicator.transform.SetParent(hudGO.transform, false);
        fixIndicator.AddComponent<UnityEngine.UI.Image>();
        var hudComp = hudGO.AddComponent<TestHUD>();
        SetPrivateField(hudComp, "_hudRoot", hudGO);
        SetPrivateField(hudComp, "_progressText", progressText.GetComponent<UnityEngine.UI.Text>());
        SetPrivateField(hudComp, "_timeText", timeText.GetComponent<UnityEngine.UI.Text>());
        SetPrivateField(hudComp, "_fixationIndicator", fixIndicator.GetComponent<UnityEngine.UI.Image>());
        SetPrivateField(hudComp, "_eyeTrackingController", eyeComp);
        hudGO.SetActive(false);

        // Results screen
        var resultsGO = new GameObject("Results Screen");
        resultsGO.transform.SetParent(canvas.transform, false);
        var triageText = new GameObject("TriageText");
        triageText.transform.SetParent(resultsGO.transform, false);
        triageText.AddComponent<UnityEngine.UI.Text>();
        var mdText = new GameObject("MDText");
        mdText.transform.SetParent(resultsGO.transform, false);
        mdText.AddComponent<UnityEngine.UI.Text>();
        var psdText = new GameObject("PSDText");
        psdText.transform.SetParent(resultsGO.transform, false);
        psdText.AddComponent<UnityEngine.UI.Text>();
        var qualText = new GameObject("QualityText");
        qualText.transform.SetParent(resultsGO.transform, false);
        qualText.AddComponent<UnityEngine.UI.Text>();
        var relText = new GameObject("ReliabilityText");
        relText.transform.SetParent(resultsGO.transform, false);
        relText.AddComponent<UnityEngine.UI.Text>();
        var triageIndicator = new GameObject("TriageIndicator");
        triageIndicator.transform.SetParent(resultsGO.transform, false);
        triageIndicator.AddComponent<UnityEngine.UI.Image>();
        var resultsComp = resultsGO.AddComponent<ResultsScreen>();
        SetPrivateField(resultsComp, "_screenRoot", resultsGO);
        SetPrivateField(resultsComp, "_triageText", triageText.GetComponent<UnityEngine.UI.Text>());
        SetPrivateField(resultsComp, "_mdText", mdText.GetComponent<UnityEngine.UI.Text>());
        SetPrivateField(resultsComp, "_psdText", psdText.GetComponent<UnityEngine.UI.Text>());
        SetPrivateField(resultsComp, "_qualityText", qualText.GetComponent<UnityEngine.UI.Text>());
        SetPrivateField(resultsComp, "_reliabilityText", relText.GetComponent<UnityEngine.UI.Text>());
        SetPrivateField(resultsComp, "_triageColorIndicator", triageIndicator.GetComponent<UnityEngine.UI.Image>());
        resultsGO.SetActive(false);

        // ─── Test State Machine ──────────────────────────────────────
        var stateMachine = controllers.AddComponent<TestStateMachine>();
        SetPrivateField(stateMachine, "_stimulusRenderer", stimComp);
        SetPrivateField(stateMachine, "_eyeTrackingController", eyeComp);
        SetPrivateField(stateMachine, "_inputHandler", inputComp);
        SetPrivateField(stateMachine, "_sessionSync", syncComp);
        SetPrivateField(stateMachine, "_instructionsScreen", instrComp);
        SetPrivateField(stateMachine, "_testHUD", hudComp);
        SetPrivateField(stateMachine, "_resultsScreen", resultsComp);

        // ─── Lys ─────────────────────────────────────────────────────
        var light = new GameObject("Directional Light");
        var lightComp = light.AddComponent<Light>();
        lightComp.type = LightType.Directional;
        lightComp.intensity = 0.1f; // Svagt lys (mørk test-miljø)
        light.transform.rotation = Quaternion.Euler(50, -30, 0);

        // ─── Gem scene ───────────────────────────────────────────────
        string scenePath = "Assets/Scenes/VisionFieldTest.unity";
        EditorSceneManager.SaveScene(scene, scenePath);

        Debug.Log("=== VisionField VR Scene Setup Komplet ===");
        Debug.Log("Scene gemt: " + scenePath);
        Debug.Log("Næste skridt:");
        Debug.Log("1. Installér Meta XR SDK (com.meta.xr.sdk.all)");
        Debug.Log("2. Edit → Project Settings → XR → Aktiver OpenXR + Meta Quest");
        Debug.Log("3. Build Settings → Android → Build and Run");

        EditorUtility.DisplayDialog(
            "VisionField VR — Scene Setup Komplet",
            "Scenen er oprettet med alle komponenter.\n\n" +
            "Næste skridt:\n" +
            "1. Project Settings → XR → Aktiver OpenXR + Meta Quest\n" +
            "2. Build Settings → Switch to Android\n" +
            "3. Tilslut Meta Quest 3 → Build and Run",
            "OK"
        );
    }

    /// <summary>Sæt en SerializeField via reflection.</summary>
    private static void SetPrivateField(Component component, string fieldName, object value)
    {
        var field = component.GetType().GetField(fieldName,
            System.Reflection.BindingFlags.NonPublic |
            System.Reflection.BindingFlags.Instance);
        if (field != null)
        {
            field.SetValue(component, value);
            EditorUtility.SetDirty(component);
        }
        else
        {
            Debug.LogWarning($"Felt '{fieldName}' ikke fundet på {component.GetType().Name}");
        }
    }

    [MenuItem("VisionField/Validate Scene", false, 2)]
    public static void ValidateScene()
    {
        int issues = 0;

        var stim = Object.FindObjectOfType<StimulusRenderer>();
        if (stim == null) { Debug.LogError("MANGLER: StimulusRenderer"); issues++; }

        var eye = Object.FindObjectOfType<EyeTrackingController>();
        if (eye == null) { Debug.LogError("MANGLER: EyeTrackingController"); issues++; }

        var ws = Object.FindObjectOfType<WebSocketClient>();
        if (ws == null) { Debug.LogError("MANGLER: WebSocketClient"); issues++; }

        var sync = Object.FindObjectOfType<TestSessionSync>();
        if (sync == null) { Debug.LogError("MANGLER: TestSessionSync"); issues++; }

        var sm = Object.FindObjectOfType<TestStateMachine>();
        if (sm == null) { Debug.LogError("MANGLER: TestStateMachine"); issues++; }

        var input = Object.FindObjectOfType<VRInputHandler>();
        if (input == null) { Debug.LogError("MANGLER: VRInputHandler"); issues++; }

        if (issues == 0)
        {
            Debug.Log("✓ Scene validering: Alle komponenter fundet!");
            EditorUtility.DisplayDialog("Validering OK", "Alle VisionField-komponenter er korrekt opsat.", "OK");
        }
        else
        {
            EditorUtility.DisplayDialog("Validering Fejlet",
                $"{issues} komponenter mangler. Se Console for detaljer.\n\nKør VisionField → Setup Test Scene for at oprette dem.",
                "OK");
        }
    }
}
#endif
