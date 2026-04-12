/**
 * VisionField Desktop — Automatisk Scene Setup
 *
 * Kør via: VisionField → Setup Desktop Scene
 * Opretter en 2D-scene til PC/skærm-baseret synsfeltstest.
 */
#if UNITY_EDITOR
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using VisionField.Stimuli;
using VisionField.UI;

public class DesktopSceneSetup
{
    [MenuItem("VisionField/Setup Desktop Scene (PC)", false, 3)]
    public static void SetupDesktopScene()
    {
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // ─── Kamera ──────────────────────────────────────────────
        var camGO = new GameObject("Main Camera");
        camGO.tag = "MainCamera";
        var cam = camGO.AddComponent<Camera>();
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = Color.black;
        cam.orthographic = true;
        cam.orthographicSize = 5;

        // ─── Test Canvas (Screen Space) ──────────────────────────
        var canvasGO = new GameObject("Test Canvas");
        var canvas = canvasGO.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 0;
        canvasGO.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvasGO.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1920, 1080);
        canvasGO.AddComponent<GraphicRaycaster>();

        // ─── Sort baggrund (fuld skærm) ──────────────────────────
        var bgGO = new GameObject("Background");
        bgGO.transform.SetParent(canvasGO.transform, false);
        var bgImage = bgGO.AddComponent<Image>();
        bgImage.color = Color.black;
        var bgRect = bgGO.GetComponent<RectTransform>();
        bgRect.anchorMin = Vector2.zero;
        bgRect.anchorMax = Vector2.one;
        bgRect.sizeDelta = Vector2.zero;

        // ─── Fiksationspunkt (rød prik, center) ──────────────────
        var fixGO = new GameObject("Fixation Point");
        fixGO.transform.SetParent(canvasGO.transform, false);
        var fixImage = fixGO.AddComponent<Image>();
        fixImage.color = Color.red;
        var fixRect = fixGO.GetComponent<RectTransform>();
        fixRect.anchoredPosition = Vector2.zero;
        fixRect.sizeDelta = new Vector2(12, 12);

        // ─── Stimulus (hvid cirkel, starter skjult) ──────────────
        var stimGO = new GameObject("Stimulus");
        stimGO.transform.SetParent(canvasGO.transform, false);
        var stimImage = stimGO.AddComponent<Image>();
        stimImage.color = Color.white;
        var stimRect = stimGO.GetComponent<RectTransform>();
        stimRect.anchoredPosition = Vector2.zero;
        stimRect.sizeDelta = new Vector2(12, 12);
        stimGO.SetActive(false);

        // ─── Desktop Stimulus Renderer ───────────────────────────
        var rendererGO = new GameObject("Desktop Renderer");
        var dsr = rendererGO.AddComponent<DesktopStimulusRenderer>();
        SetField(dsr, "_stimulusRect", stimRect);
        SetField(dsr, "_stimulusImage", stimImage);
        SetField(dsr, "_fixationRect", fixRect);
        SetField(dsr, "_testCanvas", canvas);

        // ─── UI Panels ───────────────────────────────────────────

        // Instructions Panel
        var instrPanel = CreatePanel(canvasGO.transform, "Instructions Panel");
        var instrText = CreateText(instrPanel.transform, "Instructions Text",
            "Synsfeltstest\n\nTryk SPACE for at starte", 24);

        // Test Panel (progress + timer)
        var testPanel = CreatePanel(canvasGO.transform, "Test Panel");
        testPanel.SetActive(false);
        var progressText = CreateText(testPanel.transform, "Progress", "Punkt: 0 / 52", 18,
            TextAnchor.UpperLeft, new Vector2(20, -20));
        var timerText = CreateText(testPanel.transform, "Timer", "00:00", 18,
            TextAnchor.UpperRight, new Vector2(-20, -20));

        // Results Panel
        var resultsPanel = CreatePanel(canvasGO.transform, "Results Panel");
        resultsPanel.SetActive(false);
        var resultsText = CreateText(resultsPanel.transform, "Results Text",
            "Resultater vises her", 20);

        // ─── Desktop Test Controller (starter skjult — test menu vælger) ─
        var controllerGO = new GameObject("Desktop Controller");
        controllerGO.SetActive(false);
        var dtc = controllerGO.AddComponent<DesktopTestController>();
        SetField(dtc, "_stimulusRenderer", dsr);
        SetField(dtc, "_instructionsPanel", instrPanel);
        SetField(dtc, "_instructionsText", instrText.GetComponent<Text>());
        SetField(dtc, "_testPanel", testPanel);
        SetField(dtc, "_progressText", progressText.GetComponent<Text>());
        SetField(dtc, "_timerText", timerText.GetComponent<Text>());
        SetField(dtc, "_resultsPanel", resultsPanel);
        SetField(dtc, "_resultsText", resultsText.GetComponent<Text>());

        // ─── Test Selection Menu (hovedmenu ved start) ───────────
        var menuPanel = CreatePanel(canvasGO.transform, "Test Menu");
        var menuText = CreateText(menuPanel.transform, "Menu Text", "Indlæser...", 16);

        // Simple Test Runner (for ikke-perimetri tests)
        var simpleRunnerGO = new GameObject("Simple Test Runner");
        var str = simpleRunnerGO.AddComponent<SimpleTestRunner>();
        SetField(str, "_testPanel", testPanel);
        SetField(str, "_instructionText", instrText.GetComponent<Text>());
        SetField(str, "_stimulusText", progressText.GetComponent<Text>()); // Genbruger til stimulus
        SetField(str, "_resultText", resultsText.GetComponent<Text>());
        SetField(str, "_resultPanel", resultsPanel);

        // Test Selection Menu
        var menuGO = new GameObject("Test Menu Controller");
        var tsm = menuGO.AddComponent<TestSelectionMenu>();
        SetField(tsm, "_menuRoot", menuPanel);
        SetField(tsm, "_titleText", menuText.GetComponent<Text>());
        SetField(tsm, "_perimetryController", dtc);
        SetField(tsm, "_simpleTestRunner", str);

        // ─── Gem scene ───────────────────────────────────────────
        string path = "Assets/Scenes/VisionFieldDesktop.unity";
        EditorSceneManager.SaveScene(scene, path);

        Debug.Log("=== Desktop Scene Setup Komplet ===");
        Debug.Log("Scene gemt: " + path);
        Debug.Log("Tryk Play → SPACE for at starte test");
        Debug.Log("Patient: hold blikket på rød prik, tryk SPACE ved lysglimt");

        EditorUtility.DisplayDialog(
            "VisionField Desktop — Scene Klar",
            "Desktop-scenen er oprettet.\n\n" +
            "Tryk Play for at teste.\n" +
            "Patient trykker SPACE når de ser lysglimt.\n\n" +
            "Build: File → Build Settings → PC → Build and Run",
            "OK"
        );
    }

    private static GameObject CreatePanel(Transform parent, string name)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rect = go.AddComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.sizeDelta = Vector2.zero;
        return go;
    }

    private static GameObject CreateText(Transform parent, string name, string content,
        int fontSize, TextAnchor anchor = TextAnchor.MiddleCenter, Vector2? position = null)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var text = go.AddComponent<Text>();
        text.text = content;
        text.fontSize = fontSize;
        text.color = Color.white;
        text.alignment = anchor;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        var rect = go.GetComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.sizeDelta = Vector2.zero;
        if (position.HasValue)
            rect.anchoredPosition = position.Value;
        return go;
    }

    private static void SetField(Component comp, string name, object value)
    {
        var field = comp.GetType().GetField(name,
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        if (field != null)
        {
            field.SetValue(comp, value);
            EditorUtility.SetDirty(comp);
        }
    }
}
#endif
