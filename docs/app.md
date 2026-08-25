# Android app — Flutter client

`src/nirvaha/` · Flutter 3.44 · Dart · Provider · Material 3

The household's side. Photograph plastic, get an answer, set it aside, ask for
collection.

## Screens

| Screen | File | Does |
|---|---|---|
| Session gate | `screens/session_gate.dart` | Cold-start decision: restore or log in |
| Login | `screens/login_screen.dart` | Email + password, prefilled for the demo |
| Dashboard | `screens/dashboard_screen.dart` | Greeting, scan CTA, stat tiles, digital bin, status banner |
| Result | `screens/result_screen.dart` | Verdict for one photo, add to bin |
| Milestones | `screens/milestones_screen.dart` | Lifetime kg and unlocked badges |
| History | `screens/history_screen.dart` | Pickups · Scans · Check by hand |
| Profile | `screens/profile_screen.dart` | Account, zone, stats, sign out |
| Advanced | `screens/settings_screen.dart` | Server address — the escape hatch |
| Batch evaluator | `screens/batch_test_screen.dart` | Internal accuracy tool |

Four tabs: **Home · Milestones · History · Profile**.

## State

Two `ChangeNotifier` providers, no other state library.

**`ScanProvider`** — auth token, user identity, scan history, connection
health. `restoreSession()` verifies a saved token against `/api/auth/me`
rather than trusting it; an expired or remotely-revoked token would otherwise
produce a signed-in shell that 401s on every call.

**`BinProvider`** — bin weight, status, breakdown, milestones, pickup history,
and the set of scan ids already binned. `requestPickup()` returns
`(ok, message)` from the server so the UI can never celebrate a request that
was refused.

## Two rules the UI enforces

**Below 0.60 confidence, no verdict.** The result screen shows an amber "Manual
Sorting Required" state and **hides the material and weight** — showing details
next to "not sure" makes a guess look researched.

**One scan, one bin entry.** A scan already binned shows a disabled **"In your
bin"** button. Guarded in three places: `scanId` column, server-side duplicate
refusal, and `bin.containsScan()` client-side so an obviously-binned scan never
round-trips.

## Where the backend URL comes from

Three sources, in priority order:

1. **Saved preference** — set in Advanced, persisted, **overrides everything**
2. **`--dart-define=API_BASE_URL`** — compiled in at build time
3. **Fallback** — `http://10.0.2.2:3000`, the Android *emulator* loopback

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://your-backend
adb install -r build/app/outputs/flutter-apk/app-release.apk
```

> **Omit `--dart-define` and the app silently targets `10.0.2.2`,** which does
> not exist on a real phone. Every call fails and it looks like the backend is
> broken. This cost us a morning. Symptom: nothing ever reaches the server.
>
> A URL saved in Advanced **beats** `--dart-define`, so after changing the
> compiled address run `adb shell pm clear com.nirvaha.nirvaha` or the app will
> keep using the old one.

## Networking

`services/api_service.dart`. Two non-obvious details, both bug fixes:

**A fresh `http.Client` per request, with `Connection: close`.** ngrok drops
idle tunnel sockets; a pooled keep-alive socket that worked a moment ago is
often already dead, surfacing as *"Connection closed before full header was
received"*.

**Explicit `contentType: MediaType('image','jpeg')` on the multipart file.**
Dart's `MultipartFile` otherwise sends `application/octet-stream`, which the
upload filter rejected with a 400.

## Offline behaviour

- Scan history and bin state are pulled from the server but stay on screen if a
  refresh fails — a dropped connection never blanks the UI.
- `ScanImage` prefers the **on-device file** over the stored URL, so results
  render instantly and still work with no network.
- The dashboard shows a "Can't reach Nirvaha" banner only when a health check
  actually fails. A working app says nothing about its own plumbing.

## Design

`widgets/ui_kit.dart` holds the shared language: soft mint wash behind each
header, white cards at 24 px radius on a `#F4F6F5` ground, tight headings
(w800, negative tracking) over airy body text at 1.5 line height. Brand
`#059669`. Plus Jakarta Sans is **bundled as an asset**, not fetched — a demo
must never wait on a font server.

## Verify without a device

```bash
cd src/nirvaha
flutter analyze     # expect: No issues found!
flutter test        # expect: 8 tests passed
```

The tests guard the honesty contract, not the layout: 0.60 threshold, uncertain
path hides material and weight, and an uncertain item is never offered "Add to
bin".
