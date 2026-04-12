# VisionField VR — Unity Setup Guide

## Forudsætninger

- Windows 10/11
- Meta Quest 3 headset
- USB-C kabel
- Unity Hub installeret

---

## Trin 1: Installér Unity

1. Åbn **Unity Hub**
2. Klik **Installs → Install Editor**
3. Vælg **Unity 2023.3 LTS** (eller nyeste 2023.3.x)
4. Markér disse moduler:
   - ✅ **Android Build Support**
   - ✅ **OpenJDK**
   - ✅ **Android SDK & NDK Tools**
5. Klik **Install** (ca. 5 GB)

## Trin 2: Åbn projektet

1. Unity Hub → **Open → Add project from disk**
2. Vælg mappen: `C:\Claude\visionfield-vr\unity-app\`
3. Unity importerer automatisk pakker fra `Packages/manifest.json`
   - Meta XR SDK installeres automatisk
4. Vent til import er færdig (2-5 minutter)

## Trin 3: Opsæt scenen (automatisk)

1. I Unity menubar: **VisionField → Setup Test Scene**
2. Scriptet opretter automatisk:
   - XR Origin med kamera
   - Baggrundskugle (mørk, simulerer 10 cd/m²)
   - Stimulus-objekt (Goldmann III størrelse)
   - Fiksationspunkt (rød prik)
   - Alle VisionField-komponenter (ZEST, EyeTracking, WebSocket, UI)
   - UI Canvas med instruktioner, HUD og resultater
3. Scenen gemmes som `Assets/Scenes/VisionFieldTest.unity`

## Trin 4: Konfigurér XR

1. **Edit → Project Settings → XR Plug-in Management**
   - Klik **Install XR Plugin Management** (hvis ikke installeret)
   - Under **Android** tab: Aktiver ✅ **OpenXR**
   - Under OpenXR: Tilføj **Meta Quest Touch Pro Controller Profile**
2. **Edit → Project Settings → XR Plug-in Management → OpenXR**
   - Tilføj Feature: **Meta Quest Support**
   - Tilføj Feature: **Eye Tracking (Meta)**

## Trin 5: Android Build Settings

1. **File → Build Settings**
2. Klik **Android** → **Switch Platform** (vent 1-2 min)
3. Indstillinger:
   - Texture Compression: **ASTC**
   - Run Device: Vælg din Quest 3
4. **Player Settings** (allerede konfigureret):
   - Package Name: `dk.visionfield.vr`
   - Minimum API Level: 29
   - Scripting Backend: IL2CPP
   - Target Architecture: ARM64

## Trin 6: Forbered Meta Quest 3

1. På headsettet: **Settings → System → Developer**
   - Aktiver **Developer Mode**
   - Aktiver **USB Connection Dialog**
2. Tilslut Quest 3 til PC via USB-C
3. Acceptér **"Allow USB debugging"** i headsettet
4. I Unity: **File → Build Settings → Refresh** — Quest 3 vises som device

## Trin 7: Validér scene

1. **VisionField → Validate Scene** (Unity menu)
2. Tjek at alle 6 komponenter er fundet:
   - ✅ StimulusRenderer
   - ✅ EyeTrackingController
   - ✅ WebSocketClient
   - ✅ TestSessionSync
   - ✅ TestStateMachine
   - ✅ VRInputHandler

## Trin 8: Kør tests

1. **Window → General → Test Runner**
2. Klik **EditMode** tab
3. Klik **Run All**
4. Alle tests skal være grønne

## Trin 9: Build and Run

1. **File → Build and Run**
2. Vælg output-mappe (fx `unity-app/Build/`)
3. Unity bygger APK og installerer på Quest 3
4. Tag headsettet på — appen starter automatisk

## Trin 10: Forbind til backend

Sørg for at backend kører (Docker eller Azure):

```bash
# Lokalt
docker compose up

# Eller Azure
# Backend kører allerede på Azure URL
```

I Unity Inspector på **WebSocketClient** komponenten:
- Sæt **Server URL** til `ws://DIN-PC-IP:3001` (lokalt)
- Eller `wss://ca-visionfield-dev-backend...azurecontainerapps.io` (Azure)

---

## Fejlfinding

### "Meta XR SDK not found"
→ Tjek `Packages/manifest.json` har `com.meta.xr.sdk.all`
→ Window → Package Manager → Opdatér pakker

### "Build fails with IL2CPP errors"
→ Edit → Project Settings → Player → Scripting Backend = IL2CPP
→ Target Architecture = ARM64 only

### "Eye tracking returns null"
→ Forventet i de første 500ms (warmup)
→ Se `ClinicalConstants.EYE_TRACKING_WARMUP_MS`

### "WebSocket connection failed"
→ Tjek at backend kører: `curl http://localhost:3001/health`
→ Tjek at Quest 3 er på samme netværk som PC

### Scene er tom efter åbning
→ Kør **VisionField → Setup Test Scene** igen
→ Kør **VisionField → Validate Scene** for at tjekke

---

## Arkitektur i scenen

```
XR Origin
└── Camera Offset
    └── Main Camera

Background Sphere (50m radius, mørk)
Stimulus (0.75cm, hvid, starter skjult)
Fixation Point (0.5cm, rød, altid synlig under test)

VisionField Controllers
├── StimulusRenderer    → styrer stimulus visning (200ms)
├── EyeTrackingController → gaze tracking + fiksation
├── WebSocketClient     → forbindelse til backend
├── TestSessionSync     → data sync + ZEST orchestration
├── VRInputHandler      → controller input (trigger=respons)
└── TestStateMachine    → state machine (init→cal→run→done)

UI Canvas (World Space)
├── Instructions Screen → onboarding tekst
├── Test HUD           → progress + tid + fiksation
└── Results Screen     → MD, PSD, triage, kvalitet
```
