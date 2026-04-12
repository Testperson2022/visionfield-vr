# Lessons — VisionField VR

Denne fil opdateres automatisk af Claude, når fejl opdages og rettes.
Format: dato · hvad gik galt · regel der forhindrer det fremover.

---

## Kliniske regler

**[2025-01]** Stimulusvarighed må aldrig beregnes dynamisk baseret på framerate.
→ REGEL: `STIMULUS_DURATION_MS = 200` er en hardcoded konstant i `CoreConstants.cs`. Aldrig erstatt med variabel.

**[2025-01]** ZEST-algoritmen må ikke stoppe tidligt baseret på "gæt" om at nok punkter er testet.
→ REGEL: Stopkriteriet er udelukkende `posterior_sd < 1.5 dB` per punkt. Aldrig tilføj andre early-stop betingelser uden klinisk godkendelse.

**[2025-01]** Catch trials må ikke placeres forudsigeligt (samme interval).
→ REGEL: Catch trial-timing randomiseres via `UnityEngine.Random` seed fra session-ID. Test: `CatchTrialTests.cs` verificerer distribution.

---

## Backend/sikkerhed

**[2025-01]** Patientdata må ikke inkluderes i fejlmeddelelser returneret til klient.
→ REGEL: Alle `catch`-blokke i API-routes returnerer kun generisk fejlkode + session-ID. Detaljerede fejl logges kun server-side med krypteret patient-reference.

**[2025-01]** Database-queries må ikke bygges med string concatenation.
→ REGEL: Brug altid Prisma ORM eller parameteriserede queries. Ingen `$queryRawUnsafe`.

---

## Unity/VR

**[2025-01]** Eye tracking API returnerer `null` i første 2-3 frames efter headset mount.
→ REGEL: Eye tracking kalibrering starter tidligst 500ms efter `EyeTracking.Start()` kald. Se `EyeTrackingController.cs`.

**[2025-01]** Meta XR SDK opdateringer kan ændre eye tracking koordinatsystem.
→ REGEL: Alle eye tracking koordinater konverteres til lokal headspace via `EyeTrackingUtils.ToLocalSpace()`. Aldrig brug raw API-koordinater direkte i stimuluslogik.

---

## Dashboard

**[2025-01]** PDF-rapporter må ikke genereres client-side (memory og sikkerhed).
→ REGEL: PDF genereres server-side via `/api/reports/:sessionId/pdf` endpoint. Klienten downloader kun den færdige fil.
