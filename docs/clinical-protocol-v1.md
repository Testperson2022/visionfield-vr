# VisionField VR — Klinisk Testprotokol v1.0

## Status: UDKAST — Til intern review

---

## 1. Formål

Dette dokument beskriver den kliniske testprotokol for VisionField VR v1.0 (24-2 ZEST Screening). Protokollen er grundlaget for:
- Softwareimplementering (se `shared/algorithms/zest.ts`)
- Klinisk validering (Fase 1 og 2)
- CE-mærkning teknisk dokumentation

---

## 2. Testindikationer

**Indiceret til:**
- Screening for glaukom hos patienter > 40 år
- Screening hos patienter med øget glaukomrisiko (familiær disposition, forhøjet IOP, mistænkt papilforandring)
- Opfølgning af kendte synsfeltudfald (triage-screening, IKKE erstatning for Humphrey)
- Neurologisk screening (hemi-/kvadrantanopsi)

**Kontraindiceret:**
- Visus < 1 logMAR (Snellen 6/60) uden korrektion
- Svær nystagmus
- Svær strabisme (squint > 10°)
- Epilepsi eller lysfølsomhed (fotosensitivitet)
- Kognitivt ikke-kooperativ patient (demens, svær angst)
- Børn under 7 år

---

## 3. Patientforberedelse

### Af klinikeren:
1. Verificer at patienten har sin korrektionsglas / kontaktlinser på
2. Spørg til medicin der påvirker pupilrefleks (pilocarpin, etc.)
3. Instruer patienten INDEN testen (se Audio-instruktion nedenfor)
4. Kontroller at headsettet er rengjort (isopropanol-afspritning af face gasket)
5. Sørg for IPD-justering er korrekt (mål pupilafstand med PD-måler)

### Miljø:
- Rumbelysning: Normal indendørs belysning (ingen mørklægning nødvendig)
- Patienten sidder komfortabelt i stol med rygstøtte
- Mobiltelefoner og forstyrrende lyde minimeres

---

## 4. Testprocedure

### Trin 1: Patientregistrering
- Opret eller find patienten i dashboard
- Start ny testsession — vælg øje (begynd altid med højre øje / OD)

### Trin 2: Headset-montering
- Placer headset på patienten
- Juster IPD-skyderen til markeret position
- Eye tracking kalibrering starter automatisk (10-15 sek)
- Verificer grøn fixationsstatus på kliniker-tablet

### Trin 3: Prøvestimuli
- Systemet præsenterer 3 prøvestimuli (høj intensitet)
- Hvis patienten ikke responderer: stop, re-instruer, genstart
- Kliniker overvåger live på tablet

### Trin 4: Test
- Testen kører automatisk (3-5 min per øje)
- Klinikeren overvåger fixationsstatus og fremskridt
- Testen stopper automatisk ved konvergens

### Trin 5: Kvalitetsvurdering
- System viser automatisk: fixationstab%, false positive%, false negative%
- Ugyldig test (rød markering): gentag testen
- Borderline kvalitet (gul): anfør i journalnotat

### Trin 6: Gentag for andet øje
- Kort pause (30 sek) — patienten hviler øjnene
- Gentag procedure for venstre øje / OS

### Trin 7: Resultatvisning og rapport
- Kliniker reviewer resultater i dashboard
- Triage-anbefaling vises automatisk
- PDF-rapport genereres og gemmes i patientjournal

---

## 5. Audio-instruktioner til patient

### Dansk (standard):
> "Vi skal nu teste dit synsfelt. Du vil se en skærm med et rødt punkt i midten. Hold altid blikket på det røde punkt — kig aldrig væk fra det. Du vil opleve lysglimt i synsfeltet. Tryk på knappen, hver gang du ser et glimt — selv hvis det er meget svagt. Det er normalt at gå glip af nogle. Testen tager ca. 4 minutter per øje."

### Engelsk:
> "We're going to test your visual field. You'll see a screen with a red dot in the center. Keep your gaze fixed on the red dot at all times. You'll notice flashes of light in your vision. Press the button every time you see a flash — even if it's very faint. It's normal to miss some. The test takes about 4 minutes per eye."

---

## 6. Stimulusspecifikationer (IEC 62304 krav)

| Parameter | Værdi | Reference |
|---|---|---|
| Størrelse | Goldmann III (0.43°) | ISO 12866 |
| Varighed | 200 ms ± 5 ms | Humphrey standard |
| Baggrundsintensitet | 10 cd/m² | Goldmann |
| Stimulusrange | 0.08 – 3183 cd/m² | 0–51 dB |
| Inter-stimulus interval | 1200–2200 ms (randomiseret) | Anti-anticipation |
| Fixationspunkt | Rødt, 0.3° diameter | Standard |

---

## 7. Kvalitetskriterier

| Metrik | Acceptabel | Ugyldig |
|---|---|---|
| False positive rate | < 20% | ≥ 20% |
| False negative rate | < 33% | ≥ 33% |
| Fixation loss rate | < 20% | ≥ 20% |

---

## 8. Triage-klassifikation

| Klassifikation | Kriterier | Anbefaling |
|---|---|---|
| Normal | MD > -2 dB OG PSD < 2.0 dB | Genscreening 12-24 mdr. |
| Borderline | MD -2 til -6 dB ELLER PSD 2.0–3.0 dB | Fuld Humphrey inden 3 mdr. |
| Unormal | MD < -6 dB ELLER PSD > 3.0 dB | Øjenlæge inden 4 uger |

---

## 9. Begrænsninger og disclaimer

VisionField VR er et **screeningsværktøj** og erstatter IKKE:
- Fuld Humphrey perimetri (SITA Standard)
- Klinisk øjenundersøgelse af øjenlæge
- Diagnostisk udredning

Resultaterne skal altid tolkes af autoriseret sundhedspersonale i klinisk kontekst.

---

*Dokument-version: 1.0 | Dato: 2025-01 | Til intern review*
