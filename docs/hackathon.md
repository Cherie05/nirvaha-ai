# Hackathon record

**Tech for Good 2026** · GDG Coimbatore · Dr. G. R. Damodaran College of Science
**The Tesseractis** (TEAM-109) · room 308
Track: AI for Sustainable Cities & Climate Action

Coding stopped 12:00 noon, Sunday 9 August 2026.

## Milestones

All ticked in [MILESTONES.md](../MILESTONES.md), which organisers read directly.

| When | Milestone |
|---|---|
| Before Sat | Repo access · consent · scaffolding on every machine · one real user interview · one-sentence pitch |
| Sat 13:00 | Architecture decided and in the README |
| Sat 17:00 | Core path works end to end · we can say what it does when unsure |
| Sat 19:00 | Mentor conversation written down, and something dropped |
| Sat 24:00 | The hard part works on twenty real records · everything pushed |
| Sun 06:00 | Feature freeze |
| Sun 09:00 | Deployed · demo script written and timed |
| Sun 11:00 | Rehearsed twice more · README honest about limits |

## What changed along the way

**Firebase → NestJS + Docker.** Saturday's architecture call. Organisers
confirmed any stack was allowed, and a self-hosted API meant the Gemini key
never had to ship inside the APK.

**Classifier → classifier + logistics.** The mentor conversation at 19:00 was
the turning point. Telling Vineeth a wrapper is LDPE 4 changes nothing if
nobody collects it. The Digital Bin and the vendor dashboard came out of that,
and they are now the reason the product works.

**Three examples → twenty-two labelled records.** Sunday morning. All seven
resin codes, 18/22 exact match. Details in [ai.md](./ai.md).

**Laptop tunnel → real deployment.** Sunday, after the organisers made clear a
live URL was scored. The whole stack moved to Railway with two lines of code
changed — password support for managed Redis.

## Things that cost us real time

Recorded because each one has a lesson, and each is now guarded in
[commands.txt](../commands.txt).

**A rebuild without `--dart-define` silently pointed the app at the Android
emulator loopback.** Every call failed on a real phone. It looked exactly like a
broken backend. *Nothing reaching the server at all means the app never called
out — check that before debugging the server.*

**An unpinned ngrok URL changed on restart and bricked the installed APK.**
The address is compiled in at build time. A free reserved domain fixed it
permanently. *Anything compiled into a client must be stable.*

**An anonymous `node_modules` volume shadowed the image's install.** Cost hours
twice, on two different machines, with `package.json` correct the whole time.
*`docker compose up -d -V` after any dependency change.*

**"Schedule pickup" was a button that only refreshed the screen.** It showed a
success toast regardless. The household's request had nowhere to be stored —
there was no `requestedAt` column. *A button that always succeeds is teaching
the user nothing.*

**The vendor map drew one pin per item, not per household.** Pins stacked at
identical coordinates and the popup showed one bottle's weight while the app
showed the household's total. Reported as a data mismatch; it was a
presentation bug.

**Ollama bound to `127.0.0.1`, which Docker cannot reach.** The fallback was
silently absent while `ollama serve` looked healthy.

## What we deliberately did not do

- No invented points, coupons or rewards. The honest incentive is money for
  sorted plastic, and payments are not built.
- No claim of real-world accuracy. 82% is on **our** 22 photos.
- No demoing the local model. All three we benchmarked answered confidently on
  a blank image.
- No fabricated user research. [USER_RESEARCH.md](../USER_RESEARCH.md) is one
  real conversation with one real shop owner, quoted directly.

## Demo

[DEMO.md](../DEMO.md) — a four-minute script, timed, with a pre-flight
checklist and failure fallbacks. Machine time across the whole flow is **six
seconds**; the rest is talking.

The pre-flight step that matters most: the Digital Bin must sit just under
2 kg, so one live scan crosses the threshold and the pickup flow fires. At
0 kg the demo stalls at its most important moment.

## Team

- Arunvpp ([@Arunvpp](https://github.com/Arunvpp))
- Kalyan Devoju ([@kalyandevoju1919-code](https://github.com/kalyandevoju1919-code))
