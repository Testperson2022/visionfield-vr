# VisionField VR — Claude Code Instruktioner

## ⚠️ KRITISK: Medicinsk Software
Dette er et **Klasse IIa medicinsk softwareprodukt** (MDR 2017/745, SaMD).
Alle ændringer skal overholde:
- ISO 13485 (QMS) — dokumentér ændringer
- IEC 62304 (Software lifecycle) — kode skal være testbar og sporbar
- IEC 62366-1 (Usability) — UI-ændringer kræver begrundelse
- ISO 14971 (Risikostyring) — nye features kræver risikovurdering

**Regler der ALDRIG må brydes:**
- Stimulustiming må IKKE ændres uden klinisk godkendelse (200ms ±5ms)
- Luminans-kalibrering må IKKE omgås
- Patientdata må IKKE logges i plain text
- False positive/negative catch trials må IKKE fjernes

---

## Projektstruktur

```
visionfield-vr/
├── unity-app/          # Meta Quest 3 Unity-applikation (C#)
│   ├── Assets/
│   │   ├── Scripts/
│   │   │   ├── Core/           # ZEST-algoritme, kalibreringslogik
│   │   │   ├── UI/             # In-headset UX, onboarding, testvisning
│   │   │   ├── EyeTracking/    # Fixationskontrol, catch trials
│   │   │   ├── Stimuli/        # Stimulus-rendering, timing
│   │   │   └── Network/        # WebSocket til backend
│   │   └── Tests/              # Unity Test Framework tests
├── backend/            # Node.js/Express REST API
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # Forretningslogik
│   │   ├── models/     # Database-modeller (Prisma/PostgreSQL)
│   │   └── utils/      # Kryptering, validering
│   └── tests/          # Jest tests
├── dashboard/          # React web-dashboard (klinikere)
│   ├── src/
│   │   ├── components/ # UI-komponenter
│   │   ├── pages/      # Patientoversigt, testresultater, rapport
│   │   └── utils/      # API-klient, chart-helpers
│   └── tests/          # Vitest/React Testing Library
├── shared/             # Delt TypeScript-typer og konstanter
│   └── types/          # TestSession, Patient, StimulusPoint, etc.
├── calibration/        # Headset-kalibrerings scripts og data
├── docs/               # Teknisk dokumentation, klinisk protokol
└── lessons.md          # Claude's egne lærte regler (auto-opdateres)
```

---

## Tech Stack

### Unity App (VR)
- Unity 2023.3 LTS
- Meta XR SDK / OpenXR
- Meta Eye Tracking SDK
- WebSocket: NativeWebSocket
- Testframework: Unity Test Framework (EditMode + PlayMode)
- Target: Meta Quest 3 (Android ARM64)

### Backend
- Runtime: Node.js 20 LTS
- Framework: Express.js + TypeScript
- Database ORM: Prisma
- Database: PostgreSQL 15
- Auth: JWT + bcrypt
- Kryptering: AES-256-GCM for patientdata
- Tests: Jest + Supertest
- Linter: ESLint + Prettier

### Dashboard
- Framework: React 18 + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui
- Charts: Recharts (synsfeltvisualisering)
- State: Zustand
- API-klient: React Query + Axios
- Tests: Vitest + React Testing Library
- PDF: react-pdf

### DevOps
- Monorepo: npm workspaces
- CI/CD: GitHub Actions
- Cloud: Azure (EU West — GDPR)
- Container: Docker + Docker Compose
- Secrets: Azure Key Vault / .env.local (aldrig committed)

---

## Klinisk Domæneviden

### ZEST-algoritmen (Zippy Estimation by Sequential Testing)
```
- Bayesiansk adaptiv algoritme til tærskelestimering
- Prior: Normative alderskorrigerede data (Heijl et al.)
- Likelihood: Weibull psychometric function
- Stopper når posterior SD < 1.5 dB ELLER max 500 stimuli
- Output per punkt: tærskelværdi i dB + konfidensinterval
```

### Testgrid — 24-2 (Humphrey-kompatibelt)
```
- 54 testpunkter + 2 blind spot-punkter (Heijl-Krakau)
- Spacing: 6° x 6°
- Dækker 24° nasalt, 30° temporalt fra fiksation
- Koordinater i shared/types/testGrid.ts
```

### Stimulusspecifikationer (MDR-kritiske)
```
- Størrelse: Goldmann III (0.43° diameter)
- Varighed: 200ms ±5ms (KRAV — må ikke ændres)
- Baggrundsluminans: 10 cd/m² (kalibreret)
- Stimulusluminans range: 0.08 – 3183 cd/m² (0–51 dB)
- Inter-stimulus interval: 1200–2200ms (randomiseret)
```

### Catch Trials
```
- False positive: Stimulus ved blind spot (forventer ingen respons)
- False negative: Stimulus over estimeret tærskel (forventer respons)
- Mål: <20% false positives, <33% false negatives = valid test
- Ugyldig test → advarsel til kliniker, anbefal gentest
```

### Triage-klassifikation
```
Normal:     MD > -2 dB OG PSD < 2.0 dB OG GHT = "Within normal limits"
Borderline: MD -2 til -6 dB ELLER GHT = "Borderline"
Unormal:    MD < -6 dB ELLER PSD > 3.0 dB ELLER GHT = "Outside normal limits"
```

---

## Kode-standarder

### Navngivning
- Kliniske variable: snake_case med enheder (fx `threshold_db`, `duration_ms`)
- UI-komponenter: PascalCase (fx `TestProgressBar`)
- API endpoints: kebab-case (fx `/api/test-sessions`)
- Database-tabeller: snake_case plural (fx `test_sessions`)

### Fejlhåndtering
```typescript
// ALTID eksplicit fejltype, ALDRIG silent catch
try {
  await runTest();
} catch (error) {
  if (error instanceof CalibrationError) {
    await logClinicalError(error); // audit trail
    throw error; // aldrig swallow kliniske fejl
  }
  throw new UnexpectedError(error);
}
```

### Sikkerhed
- Patientdata krypteres AES-256-GCM INDEN de skrives til DB
- CPR-numre hashses med bcrypt (cost factor 12) til søgning
- JWT-tokens udløber efter 8 timer
- Al API-kommunikation er HTTPS — ingen undtagelser
- Ingen patientdata i logs — brug anonymiserede session-IDs

### Tests — krav
```
Unity:    >80% line coverage på Core/ og Stimuli/ moduler
Backend:  >85% line coverage på services/
Dashboard: >70% line coverage på utils/ og kritiske komponenter
```

Kør altid tests efter ændringer:
```bash
# Backend
cd backend && npm test

# Dashboard  
cd dashboard && npm test

# Unity (via CLI)
Unity -runTests -testPlatform EditMode -projectPath unity-app/
```

---

## Arbejdsregler for Claude

1. **Plan Mode altid** — ved nye features: plan først, kode bagefter
2. **Minimal ændringer** — rør kun det der er nødvendigt
3. **Rodårsager** — ingen midlertidige fixes, find den egentlige fejl
4. **Test efter hver ændring** — kør relevante tests og bekræft de passerer
5. **Dokumentér kliniske beslutninger** — i kode-kommentarer med rationale
6. **Commit granulært** — ét logisk skridt per commit med beskrivende besked
7. **Opdater lessons.md** — når du retter en fejl, skriv en regel der forhindrer den igen
8. **Spørg ved tvivl om klinisk logik** — gæt ALDRIG på medicinsk korrekthed

---

## Kommandoer

```bash
# Start hele stacken lokalt
npm run dev

# Kun backend
cd backend && npm run dev

# Kun dashboard
cd dashboard && npm run dev

# Database migration
cd backend && npx prisma migrate dev

# Generer typer fra Prisma schema
cd backend && npx prisma generate

# Lint alle packages
npm run lint

# Test alle packages
npm run test

# Build til produktion
npm run build
```

---

## Miljøvariabler

Se `.env.example` i hvert package. Kopier til `.env.local` og udfyld.
Brug ALDRIG rigtige værdier i eksempelfiler.
Brug ALDRIG `.env` (committed) til secrets — kun `.env.local` (gitignored).
