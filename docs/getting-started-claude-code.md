# VisionField VR — Kom i gang med Claude Code

## Forudsætninger

- Node.js >= 20 installeret
- Claude Code installeret: `npm install -g @anthropic-ai/claude-code`
- Claude Pro eller Max abonnement (eller API-nøgle)
- Git installeret
- Docker Desktop (til lokal PostgreSQL)

---

## 1. Klon og setup

```bash
git clone <repo-url> visionfield-vr
cd visionfield-vr

# Installer dependencies
npm install

# Kopiér miljøvariabler
cp backend/.env.example backend/.env.local
# Redigér backend/.env.local med dine værdier

# Start PostgreSQL lokalt
docker run --name visionfield-db \
  -e POSTGRES_USER=visionfield \
  -e POSTGRES_PASSWORD=local-dev-password \
  -e POSTGRES_DB=visionfield_dev \
  -p 5432:5432 -d postgres:15

# Kør database-migrationer
cd backend && npx prisma migrate dev && cd ..

# Start udviklings-server
npm run dev
```

---

## 2. Start Claude Code

```bash
cd visionfield-vr
claude
```

Claude læser automatisk `CLAUDE.md` og kender hele projektkonteksten.

---

## 3. Anbefalede første kommandoer i Claude Code

```
# Se hvad der skal bygges næst
Læs docs/clinical-protocol-v1.md og foreslå hvad der mangler at implementere i backend/

# Start ny feature (brug Plan Mode)
/new-feature
Feature: [beskriv din feature]
Packages: [hvilke packages]
Klinisk kritisk: [ja/nej]

# Klinisk code review
/clinical-review
[indsæt den kode du vil have reviewed]

# Debug en fejl
/debug
Fejl: [beskrivelse]
Stack trace: [indsæt]
```

---

## 4. Parallel workflow (anbefalet)

Kør 2-3 Claude Code-sessioner parallelt med git worktrees:

```bash
# Session 1: Backend API
claude --worktree feature-backend-api

# Session 2: Dashboard UI
claude --worktree feature-dashboard-ui

# Session 3: Shared algoritmer
claude --worktree feature-zest-algorithm
```

---

## 5. Vigtige filer at kende

| Fil | Formål |
|---|---|
| `CLAUDE.md` | Projektinstruktioner til Claude |
| `lessons.md` | Lærte regler — opdateres automatisk |
| `shared/types/index.ts` | Alle TypeScript-typer |
| `shared/types/testGrid.ts` | 24-2 testgrid koordinater |
| `shared/algorithms/zest.ts` | ZEST-algoritmen |
| `backend/prisma/schema.prisma` | Database-schema |
| `docs/clinical-protocol-v1.md` | Klinisk protokol |
| `.claude/commands/` | Custom slash-kommandoer |

---

## 6. Kontekstvindue-strategi

Følg disse regler for at undgå degraderet output:

1. `/clear` ved start af ny opgave
2. Brug subagents til tung research: `"Brug en subagent til at kortlægge alle backend routes"`
3. Start ny session ved ~60% kontekst
4. `claude --continue` for at genoptage seneste session

---

## 7. Hvad Claude Code KAN bygge for dig

- ✅ ZEST-algoritme i C# til Unity
- ✅ Unity stimulus-renderer med præcis timing
- ✅ Eye tracking integration (Meta XR SDK)
- ✅ Backend REST API (Express + Prisma)
- ✅ Database-migrationer
- ✅ React dashboard med synsfeltvisualisering
- ✅ PDF-rapportgenerering
- ✅ Unit tests for alt ovenstående
- ✅ Docker Compose setup
- ✅ GitHub Actions CI/CD pipeline

## Hvad du selv skal gøre

- ❗ Klinisk validering og tolkning af resultater
- ❗ Juridisk/regulatorisk rådgivning (MDR, CE)
- ❗ Headset-kalibrering med photometer
- ❗ Beslutninger om kliniske parametre (tærskelværdier, etc.)
- ❗ Patientrekruttering til studier
