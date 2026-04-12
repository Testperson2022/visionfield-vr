/// <summary>
/// Konfiguration for ZEST-algoritmen.
/// Spejler ZestConfig i shared/algorithms/zest.ts.
/// </summary>
namespace VisionField.Core
{
    public readonly struct ZestConfig
    {
        /// <summary>Minimum testintensitet (dB)</summary>
        public readonly float DbMin;

        /// <summary>Maximum testintensitet (dB)</summary>
        public readonly float DbMax;

        /// <summary>Opløsning for posterior distribution (dB)</summary>
        public readonly float DbStep;

        /// <summary>Stopkriterium: SD under denne værdi → konvergeret</summary>
        public readonly float StopSdDb;

        /// <summary>Maksimalt antal stimuli per punkt</summary>
        public readonly int MaxStimuli;

        public ZestConfig(float dbMin, float dbMax, float dbStep, float stopSdDb, int maxStimuli)
        {
            DbMin = dbMin;
            DbMax = dbMax;
            DbStep = dbStep;
            StopSdDb = stopSdDb;
            MaxStimuli = maxStimuli;
        }

        /// <summary>
        /// Klinisk standard-konfiguration.
        /// KRITISK: stop_sd_db = 1.5 dB — må IKKE ændres uden klinisk godkendelse.
        /// </summary>
        public static readonly ZestConfig Default = new ZestConfig(
            dbMin: ClinicalConstants.DB_MIN,
            dbMax: ClinicalConstants.DB_MAX,
            dbStep: ClinicalConstants.ZEST_DB_STEP,
            stopSdDb: ClinicalConstants.ZEST_STOP_SD_DB,
            maxStimuli: ClinicalConstants.ZEST_MAX_STIMULI_PER_POINT
        );
    }
}
