using UnityEngine;
using UnityEngine.UI;
using VisionField.Core.Models;

/// <summary>
/// Test Selection Menu — Vælg test fra PC/Desktop
///
/// Viser en menu med alle tilgængelige tests.
/// Starter den valgte test via DesktopTestController eller dedikeret controller.
/// </summary>
namespace VisionField.UI
{
    public class TestSelectionMenu : MonoBehaviour
    {
        [Header("UI")]
        [SerializeField] private GameObject _menuRoot;
        [SerializeField] private Text _titleText;
        [SerializeField] private Text _descriptionText;

        [Header("Controllers")]
        [SerializeField] private DesktopTestController _perimetryController;
        [SerializeField] private SimpleTestRunner _simpleTestRunner;

        public enum TestType
        {
            Perimetry24_2,
            Perimetry30_2,
            Perimetry10_2,
            Esterman,
            FDT,
            Kinetic,
            ContrastSensitivity,
            ColorVision,
            AmslerGrid,
            Stereopsis,
            VisualAcuity,
            Pupillometry,
        }

        private TestType _selectedTest = TestType.Perimetry24_2;

        private static readonly (TestType type, string name, string desc, string key)[] TESTS = {
            (TestType.Perimetry24_2, "24-2 Synsfelt (ZEST)", "Standard glaukom-screening. 52 punkter, ~4 min/øje.", "1"),
            (TestType.Perimetry30_2, "30-2 Synsfelt (ZEST)", "Udvidet felt. 76 punkter. Neuro-oftalmologi.", "2"),
            (TestType.Perimetry10_2, "10-2 Macula (ZEST)", "Central 10°. 68 punkter. AMD/makulopati.", "3"),
            (TestType.Esterman, "Esterman Binokulær", "Kørekort-vurdering. 120 punkter, begge øjne.", "4"),
            (TestType.FDT, "Flicker (FDT)", "Tidligt glaukom. 17 punkter, flimrende stimuli.", "5"),
            (TestType.Kinetic, "Kinetisk Perimetri", "Goldmann-stil. Bevægende stimulus. Hemianopsi.", "6"),
            (TestType.ContrastSensitivity, "Kontrastsensitivitet", "Pelli-Robson. LogCS måling. Katarakt/MS.", "7"),
            (TestType.ColorVision, "Farvesyn (Ishihara)", "Farveblindhed-screening. 12 tavler.", "8"),
            (TestType.AmslerGrid, "Amsler Grid", "Makulær forvrængning. AMD-screening.", "9"),
            (TestType.Stereopsis, "Stereopsis (Dybdesyn)", "TNO/Titmus-stil. Amblyopi/strabismus.", "0"),
            (TestType.VisualAcuity, "Synsstyrke (LogMAR)", "ETDRS bogstaver. Snellen-ækvivalent.", "-"),
            (TestType.Pupillometry, "Pupillometri (RAPD)", "Swinging flashlight. Optikusneuropati.", "="),
        };

        private void Start()
        {
            ShowMenu();
        }

        private void Update()
        {
            if (_menuRoot == null || !_menuRoot.activeSelf) return;

            // Tastatur-genveje
            foreach (var test in TESTS)
            {
                if (Input.GetKeyDown(test.key))
                {
                    _selectedTest = test.type;
                    StartSelectedTest();
                    return;
                }
            }
        }

        public void ShowMenu()
        {
            if (_menuRoot != null) _menuRoot.SetActive(true);
            if (_titleText != null)
            {
                string menu = "VÆLG TEST\n\n";
                foreach (var t in TESTS)
                {
                    menu += $"[{t.key}]  {t.name}\n";
                    menu += $"     {t.desc}\n\n";
                }
                menu += "Tryk tasten for at starte";
                _titleText.text = menu;
            }
        }

        public void StartSelectedTest()
        {
            if (_menuRoot != null) _menuRoot.SetActive(false);

            switch (_selectedTest)
            {
                case TestType.Perimetry24_2:
                case TestType.Perimetry30_2:
                case TestType.Perimetry10_2:
                    // Brug DesktopTestController for perimetri
                    if (_perimetryController != null)
                    {
                        // TODO: konfigurér grid baseret på valgt type
                        _perimetryController.gameObject.SetActive(true);
                    }
                    break;

                default:
                    // Brug SimpleTestRunner for andre tests
                    if (_simpleTestRunner != null)
                    {
                        _simpleTestRunner.StartTest(_selectedTest);
                    }
                    break;
            }
        }
    }
}
