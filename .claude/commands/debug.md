# /debug — Debug workflow

Brug denne kommando når du har en bug.

## Angiv:
- Fejlbeskrivelse
- Stack trace (hvis tilgængeligt)
- Forventet vs. faktisk adfærd
- Reproduceringstrin

## Claude's debug-workflow:

1. **Forstå fejlen** — læs stack trace, identificer fejlkilde
2. **Find rodårsagen** — følg koden baglæns til den egentlige årsag
3. **Lav en hypotese** — beskriv hvad du tror er galt og hvorfor
4. **Verificer hypotesen** — skriv en test der afslører fejlen INDEN du retter den
5. **Ret fejlen minimalt** — rør kun det der er nødvendigt
6. **Kør tests** — bekræft at fejlen er rettet og intet andet er gået i stykker
7. **Opdater lessons.md** med regel der forhindrer fejlen fremover

## Vigtig regel:
Claude retter ALDRIG en klinisk fejl uden at forstå den fuldt ud.
Ved tvivl: skriv en kommentar i koden og spørg.
