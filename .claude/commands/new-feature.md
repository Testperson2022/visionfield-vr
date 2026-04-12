# /new-feature — Opret ny feature med Plan Mode workflow

Brug denne kommando når du starter en ny feature.

## Hvad du skal angive:
- Hvad featuren skal gøre (brugerperspektiv)
- Hvilke packages den berører (unity-app / backend / dashboard / shared)
- Om den er klinisk kritisk (ja/nej)

## Claude's workflow for denne kommando:

1. **Gå i Plan Mode** — læs relevante filer, forstå konteksten
2. **Identificer risici** — er der kliniske implikationer? Datasikkerhed? MDR-relevans?
3. **Lav implementeringsplan** med:
   - Hvilke filer oprettes/ændres
   - Database-migrationer (hvis nødvendigt)
   - API-endpoints (hvis nødvendigt)
   - Tests der skal skrives
   - Rækkefølge af ændringer
4. **Vent på godkendelse** af plan før du skriver kode
5. **Implementer** fase for fase, kør tests efter hvert trin
6. **Opdater lessons.md** hvis du støder på uventede problemer

## Eksempel:
```
/new-feature
Feature: Kliniker skal kunne tilføje en fritekst-note til en testsession
Packages: backend, dashboard
Klinisk kritisk: Nej (det er en annotation, ikke klinisk data)
```
