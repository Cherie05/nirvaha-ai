# Get Nirvaha running on your machine

> Every member has to do this **before Saturday**. It is the `pre-scaffold`
> milestone, and the recovery line for it is brutal: *"If it does not run on
> everyone's machine, drop to the simplest stack somebody on the team already
> knows. Saturday morning is the worst possible time to learn a framework."*
>
> So find out on Friday, not at 9 AM Saturday.

Budget 30–40 minutes, most of it downloads.

## 1. Install the toolchain

| Tool | Version we verified on | Get it |
|---|---|---|
| Flutter | 3.44.1 (stable) | https://docs.flutter.dev/get-started/install |
| Android SDK | 36.1.0 | Comes with Android Studio |
| JDK | 17 | Bundled with Android Studio, or Temurin 17 |

Then:

```bash
flutter doctor
```

You need green ticks on **Flutter** and **Android toolchain**, including
*"All Android licenses accepted"*. If licenses are not accepted:

```bash
flutter doctor --android-licenses
```

Chrome / Visual Studio ticks do not matter — we ship Android only.

## 2. Clone and build

```bash
git clone https://github.com/Build-with-AI-Code-for-Communities/health-team-109-the-tesseractis.git
cd health-team-109-the-tesseractis/src/nirvaha

flutter pub get
flutter analyze
flutter test
```

**You are done when you see:**

```
Analyzing nirvaha...
No issues found!

00:00 +12: All tests passed!
```

That is the hello-world for this milestone — it proves the repo, the framework
and the dependency tree all work on your machine. It needs no backend, no API
key and no device.

**Steps 1–3 are the whole `pre-scaffold` milestone.** Step 4 is build-day work,
not a prerequisite for ticking your name at the bottom.

## 3. Prove it builds an APK

```bash
flutter build apk --debug
```

Expect `√ Built build\app\outputs\flutter-apk\app-debug.apk`. First run takes
2–3 minutes while Gradle downloads; after that it is ~10 seconds.

If you have an Android phone plugged in with USB debugging on, `flutter run`
will install it. It will open with an amber "not configured" banner until the
backend is wired up — that is expected and correct, not a failure.

## 4. The backend

Built, and deployed. The client talks to a NestJS API in Docker which owns the
Gemini call, the cache and storage. See
[the README](../README.md#architecture) for both topologies — deployed and
local.

**You may not need to run it at all.** The API is live on Railway and the
dashboard on Netlify; the URLs are at the top of the README. Run it locally
only if you are changing it.

What you need installed to work on it:

| Tool | Get it |
|---|---|
| Docker Desktop | https://docs.docker.com/desktop/ |
| Node.js 20 LTS | https://nodejs.org |
| Ngrok | https://ngrok.com/download (only to put a real phone on the local stack) |

Run everything with one command from the repo root:

```bash
./start-demo.bat          # Windows: backend + tunnel + dashboard, ~70s
```

Or by hand:

```bash
cd src/backend
cp .env.example .env      # add GEMINI_API_KEY
docker compose up -d      # NestJS :3000 + Postgres + MinIO + Redis
curl http://localhost:3000/api/health     # note: /api/health
```

Then point the client at it:

```bash
cd ../nirvaha
flutter build apk --release --dart-define=API_BASE_URL=http://<your-laptop-ip>:3000
adb install -r build/app/outputs/flutter-apk/app-release.apk
```

Use your **LAN IP**, not `localhost` — the phone is a different machine. If you
are not on the same wifi, use the ngrok tunnel URL instead (see
[`commands.txt`](../commands.txt) section 2).

The address is compiled in at build time. Omit `--dart-define` and the app
falls back to the Android *emulator* loopback, which does not exist on a real
phone — every call fails and it looks like the backend is broken.

**The Gemini API key goes in `src/backend/.env` only.** Never in the Flutter
app, never committed. An APK can be decompiled, so a key shipped in the client
is a key you have published.

> ⚠️ **Current state:** the client has not been migrated yet. It still carries
> its original Firebase integration, so `flutter run` will not reach the NestJS
> API until that work is done. The [README build-status table](../README.md#build-status)
> tracks what is real.

## Known gotchas

**`flutter pub add` drops the `^` in PowerShell.** Constraints get pinned to an
exact version and resolution fails with a confusing "X is forbidden". Edit
`pubspec.yaml` by hand and run `flutter pub get` instead.

**`minSdk` keeps reverting to `flutter.minSdkVersion`.** Not your machine —
Flutter 3.44's `MinSdkVersionMigration` rewrites any hardcoded value of 16–23 on
every build, because the engine now requires 24. We build against 24, which
still clears Firebase's floor of 23. Leave it alone.

**Gradle fails on JDK 21+ with a Kotlin jvmTarget mismatch.** Point Flutter at
JDK 17: `flutter config --jdk-dir="C:\Program Files\Eclipse Adoptium\jdk-17..."`.

## Report back

When `flutter test` passes on your machine, say so in the team chat and tick
your name here:

- [x] Arunvpp — verified 7 Aug 2026: `flutter analyze` clean, 12/12 tests pass,
      debug APK built (Flutter 3.44.1, Android SDK 36.1, Windows 11)
- [ ] Kalyan Devoju
- [ ] Cherie05 *(remove this line if not building with us)*

Once every name is ticked, tick `pre-scaffold` in
[`MILESTONES.md`](../MILESTONES.md).

---

*The Tesseractis (TEAM-109) · Tech for Good 2026 · GDG Coimbatore*
