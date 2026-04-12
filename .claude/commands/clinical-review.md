# /clinical-review — Klinisk kode-review

Brug denne kommando til at review kode med klinisk betydning.

## Hvad Claude checker:

### Stimuluslogik
- [ ] Er `STIMULUS_DURATION_MS = 200` uændret?
- [ ] Er luminans-kalibrering aktiv (ikke bypassed)?
- [ ] Er false positive/negative catch trials intakte?
- [ ] Er ZEST stopkriteriet `posterior_sd < 1.5 dB` uændret?

### Datasikkerhed
- [ ] Er patientdata krypteret inden DB-lagring?
- [ ] Er CPR-numre hashset (bcrypt, ikke MD5/SHA)?
- [ ] Er der audit log entries for dataadgang?
- [ ] Er der ingen patientdata i logs/fejlbeskeder?

### Testdækning
- [ ] Er nye kliniske functions dækket af tests?
- [ ] Passerer alle eksisterende tests stadig?
- [ ] Er edge cases håndteret (tom testgrid, konvergeret punkt, ugyldig kalibrering)?

### MDR-compliance
- [ ] Er ændringen dokumenteret i commit-besked?
- [ ] Kræver ændringen opdatering af risikovurdering?
- [ ] Er IFU-begrænsningerne stadig gældende?

## Output:
Claude returnerer en rapport med fund og anbefalinger.
