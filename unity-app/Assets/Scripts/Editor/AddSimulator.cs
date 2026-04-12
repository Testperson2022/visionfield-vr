#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;

public class AddSimulator
{
    [MenuItem("VisionField/Add Simulator (Play in Editor)", false, 10)]
    public static void Add()
    {
        var existing = Object.FindFirstObjectByType<SimulatorController>();
        if (existing != null)
        {
            Debug.Log("SimulatorController allerede i scenen");
            Selection.activeGameObject = existing.gameObject;
            return;
        }

        var go = new GameObject("VisionField Simulator");
        var sim = go.AddComponent<SimulatorController>();

        // Find og tilknyt StimulusRenderer hvis den findes
        var stim = Object.FindFirstObjectByType<VisionField.Stimuli.StimulusRenderer>();
        if (stim != null)
        {
            var field = typeof(SimulatorController).GetField("_stimulusRenderer",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (field != null) field.SetValue(sim, stim);
        }

        Selection.activeGameObject = go;
        EditorUtility.SetDirty(go);

        Debug.Log("=== SimulatorController tilføjet ===");
        Debug.Log("Tryk Play → ENTER for at starte test");
        Debug.Log("Tip: Sæt 'Auto Respond' til true i Inspector for automatisk test");
    }
}
#endif
