using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Amsler Grid Test — Makulær forvrængningstest
///
/// Viser et regulært grid af linjer. Patienten markerer
/// områder med bølgende/manglende linjer (metamorfopsi).
/// Bruges til AMD og makulopati-screening.
///
/// I VR: Patient ser grid og peger på forvrængede områder.
/// På PC: Patient klikker på forvrængede områder.
/// </summary>
namespace VisionField.Core.Tests
{
    public class AmslerGridTest
    {
        public const int GRID_SIZE = 20; // 20x20 celler
        public const float CELL_SIZE_DEG = 0.5f; // 0.5° per celle = 10° total

        private readonly bool[,] _markedCells;
        private bool _isComplete;

        public bool IsComplete => _isComplete;

        public AmslerGridTest()
        {
            _markedCells = new bool[GRID_SIZE, GRID_SIZE];
        }

        /// <summary>Markér en celle som forvrænget.</summary>
        public void MarkCell(int x, int y)
        {
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE)
                _markedCells[x, y] = true;
        }

        /// <summary>Afslut testen.</summary>
        public void Complete() => _isComplete = true;

        /// <summary>Antal markerede (forvrængede) celler.</summary>
        public int MarkedCount
        {
            get
            {
                int count = 0;
                for (int x = 0; x < GRID_SIZE; x++)
                    for (int y = 0; y < GRID_SIZE; y++)
                        if (_markedCells[x, y]) count++;
                return count;
            }
        }

        /// <summary>Er central fiksation påvirket?</summary>
        public bool CentralInvolved
        {
            get
            {
                int c = GRID_SIZE / 2;
                for (int x = c - 2; x <= c + 2; x++)
                    for (int y = c - 2; y <= c + 2; y++)
                        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && _markedCells[x, y])
                            return true;
                return false;
            }
        }

        /// <summary>Resultat-vurdering.</summary>
        public string GetAssessment()
        {
            if (MarkedCount == 0) return "Normal — ingen forvrængning detekteret";
            if (CentralInvolved) return "ABNORMAL — central forvrængning. Anbefal: Øjenlæge akut (mulig AMD).";
            return "ABNORMAL — perifer forvrængning. Anbefal: Øjenlæge inden for 2 uger.";
        }
    }
}
