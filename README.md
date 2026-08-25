# Nirvaha

**Plastic sorting and collection for small shop owners** — photo in, sorting
answer out, and the plastic actually gets picked up.

> "Vineeth photographs his plastic waste and Nirvaha tells him in seconds whether it's recyclable, what type, and roughly how much — or says it isn't sure."

> 🚀 **Origin Story:** Nirvaha was built during the 36-hour *Build with AI 2026 Hackathon* (GDG Coimbatore / TiE KovaiCon). We are now taking this MVP forward into pre-incubation to scale circular waste collection across India.

---

## Try it

| | |
|---|---|
| **Landing Page (live)** | https://nirvaha-landing.netlify.app |
| **Vendor dashboard (live)** | https://nirvaha-vendor.netlify.app |
| **Backend API (live)** | https://health-team-109-the-tesseractis-production.up.railway.app/api/health |
| **Android app (APK)** | [v1.0-demo release](https://github.com/Cherie05/nirvaha-ai/releases) |

**Test accounts**

| Role | Email | Password | Where |
|---|---|---|---|
| Household | `test@gmail.com` | `test@1234` | Android app |
| Vendor | `vendor@gmail.com` | `vendor@1234` | Vendor dashboard |

No OTP, no signup — these two accounts are seeded on first boot.

> **All three are hosted — nothing depends on our laptop being awake.**
> The dashboard is on Netlify, the API and its Postgres, Redis and object
> storage are on Railway, and the APK talks to that same Railway API.
>
> Open the health URL above: it should return `"status":"ok"` with postgres,
> redis and storage all `up`. Verified end to end — sign in, scan, bin, request
> pickup, vendor claim, collection — 13/13 checks against the live deployment.

---

## The Problem

Vineeth runs a general store in a village near Warangal, Telangana. Water bottles, plastic covers and packaging pile up daily. He keeps the bottles aside in cardboard boxes — those he knows are recyclable. Everything else gets packed together and left for general waste collection, because bottles are the only plastic he is sure about.

**The gap isn't motivation, it's knowledge.** He already sorts what he knows. Asked whether he'd sort the rest if he could tell what was recyclable, he said yes — *"but if it takes around 30 minutes, I'll ignore it."* So recyclable covers and packaging go out with the general waste, and in his words, *"they dump it in soil or somewhere. It's harmful to the environment."*

This is one store — but it's the same story at every shop in the area. Full interview: [USER_RESEARCH.md](./USER_RESEARCH.md).

## What Nirvaha Does

Vineeth opens the app, photographs his plastic waste, and Nirvaha tells him:

- **Recyclable or not** — clear green/amber answer
- **Material type** — any of the seven resin codes: PET 1, HDPE 2, PVC 3,
  LDPE 4, PP 5, PS 6, OTHER 7
- **Estimated weight** — in grams, so it can be totalled
- **Sorting advice** — one sentence on what to do with it

If the photo contains more than one kind of plastic, each item is returned
**separately with its own code and weight**. It never collapses them into
"mixed", because "mixed" is exactly the answer that makes a shop owner give up.

When Nirvaha isn't confident, it says **"I'm not sure"** instead of guessing. A wrong classification is worse than no answer — a confident mistake means recyclable plastic goes to landfill anyway.

### Knowing isn't enough — the plastic still has to move

Telling Vineeth a wrapper is LDPE 4 changes nothing if nobody collects it. One
shop's sorted plastic is never worth a scrap dealer's trip, so it goes out with
the general waste anyway.

So classification feeds a **Digital Bin**:

1. Vineeth adds each classified item to his bin. It fills up over days.
2. At **2 kg** — the point a collection is worth driving to — **Request pickup**
   unlocks.
3. His request appears **instantly** on the vendor dashboard, and his zone jumps
   above heavier zones that nobody is waiting on.
4. A vendor claims the whole neighbourhood in one action. Every household in it
   is scheduled at once — that is what makes the trip economic.
5. When the vendor marks it collected, Vineeth's bin empties, the weight lands
   in his lifetime total, and the trip appears in his history.

Weight only counts towards his total **after a collector has actually taken
it**. Scanning the same bottle twice moves nothing, and a scan already in the
bin cannot be added again.

Concretely: every result carries a confidence score, and **below 0.60 Nirvaha refuses to give a green or red verdict** and shows an amber "Not sure" card instead. That card deliberately hides the material and volume, because showing details next to "not sure" makes a guess look researched. If the photo isn't clearly plastic waste at all, the model returns `unknown` and lands in the same place.

## Architecture

Flutter client and React console against one containerised NestJS API. The same
Docker Compose stack runs on a laptop for development and on Railway for the
deployment — nothing was rewritten to ship it.

### Deployed (what the links above point at)

```text
   HOUSEHOLD                                  VENDOR
 +------------------+                 +----------------------+
 | Nirvaha (Flutter)|                 | Dashboard (React)    |
 | Android APK      |                 | Netlify              |
 +------------------+                 +----------------------+
          |                                      |
          | HTTPS                        HTTPS + WebSocket
          v                                      v
   +------------------------------------------------------+
   |                      RAILWAY                          |
   |                                                       |
   |   +-----------------------------------------------+   |
   |   |               NestJS API (Docker)             |   |
   |   |   scan · digital bin · routing · Socket.IO    |   |
   |   +-----------------------------------------------+   |
   |        |               |                |             |
   |        v               v                v             |
   |   +---------+   +-------------+   +-----------+       |
   |   |  Redis  |   |   Bucket    |   | Postgres  |       |
   |   |  cache  |   | S3 images   |   |   data    |       |
   |   +---------+   +-------------+   +-----------+       |
   +------------------------------------------------------+
                              |
                              v
              [ Gemini (vision, strict JSON schema) ]
```

### Local development

Identical API and schema; the managed pieces are swapped for containers and an
ngrok tunnel puts a real phone in front of them. `start-demo.bat` brings the
whole thing up in about 70 seconds.

```text
  phone / browser  ->  ngrok (reserved domain)  ->  docker compose
                                                     api · postgres
                                                     redis · minio
                                                          |
                                                          v
                                            Ollama on the host (fallback)
```

Storage is the one genuine difference: MinIO locally, a Railway S3 bucket in
the deployment. The code is the same either way — MinIO's client is an S3
client, so only the endpoint and credentials change.

A household's scan and a vendor's screen are the same system. When Vineeth taps
**Request pickup**, the API writes the request and pushes it over Socket.IO —
the vendor's board reorders itself while he is still holding his phone.

**Why this shape.** The API key lives on the server, never in the APK — anyone can decompile an Android app, so a client-side key is a key you have given away. Putting NestJS in front of Gemini also lets us cache: Redis keys on the MD5 of the incoming image, so a repeat scan of the same bag returns in milliseconds without spending quota.

### Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Client** | Flutter (Dart), `image_picker` | One Android codebase. Offline-first local state so a dropped connection doesn't lose a scan. |
| **API** | NestJS (Node.js) in Docker | Dependency injection and module structure keep the Gemini call, auth and storage separable. JWT via `@nestjs/passport`. |
| **Database** | PostgreSQL — Docker locally, Railway managed in the deploy | Relational: users, scan history, digital bin, vendor claims. |
| **Object storage** | S3 API — MinIO locally, Railway bucket in the deploy | Same client both sides; only the endpoint changes. Images are proxied through the API, so the bucket never has to be public. |
| **Cache** | Redis — Docker locally, Railway managed in the deploy | MD5 image hash → cached verdict. Saves Gemini quota, sub-50ms on duplicates. |
| **Vendor console** | React 18 + Vite + Tailwind, `react-leaflet` | Zone clustering and road routing on OpenStreetMap. No Maps billing account. |
| **Realtime** | Socket.IO gateway | A pickup request reaches the vendor's screen without a refresh. |
| **AI** | Gemini (`gemini-3.1-flash-lite`) | Strict `responseSchema` output for material, weight and confidence. Keys rotate on failure. |
| **AI fallback** | Ollama on the host — local only | Keeps the service degraded-but-alive if every Gemini key is exhausted. Not demo-grade, and not present on Railway — see limitations. |
| **Hosting** | Railway (API + Postgres + Redis + bucket), Netlify (landing page + dashboard) | Same Dockerfile as local, `production` target. Nothing depends on a laptop being awake. |
| **Local dev** | Ngrok, reserved domain | Public HTTPS so a real phone on mobile data can hit the laptop stack. Reserved so the URL survives a restart. |

**No API keys in this repository.** The Gemini key lives in a `.env` file on the machine running Docker, gitignored and never committed.

## Build status

Honest state, so nobody demos something that doesn't exist. Everything below
was verified running on Sunday morning, not asserted from memory.

| Piece | Status |
|---|---|
| Flutter client — capture, result card, "Not sure" path | **Built.** `flutter analyze` clean, 8/8 tests pass. |
| Confidence threshold + amber unsure card | **Built.** Single source of truth in `scan_result.dart`. |
| NestJS API, Postgres, MinIO, Redis, Docker Compose | **Built.** All four healthy; one command brings them up. |
| Client talking to the NestJS API | **Built.** No Firebase anywhere in the client. |
| Seven-code classification, multi-item photos | **Built.** 18/22 exact match on our labelled set (82%), all 7 codes. |
| Digital Bin, 2 kg pickup threshold | **Built.** |
| Pickup request → vendor claims → collected, live on the phone | **Built.** Verified end to end over the public tunnel. |
| Vendor routing dashboard (React) with OpenStreetMap | **Built.** Zone clustering, per-household pins, road routing. |
| Realtime push to the dashboard (Socket.IO) | **Built.** A household's request appears without a refresh. |
| Ngrok tunnel for local development | **Built.** Reserved domain, survives a restart. Superseded by the Railway deploy for judging. |
| **Deployed** — API + Postgres + Redis + object storage on Railway | **Live.** Dashboard on Netlify, APK pointed at Railway. 13/13 end-to-end checks pass against the deployment. |
| Ollama local fallback if every Gemini key is exhausted | **Built,** local only — see limitations. |

## What It Cannot Do

- **Deployed, but not hardened.** It is live on Railway with managed Postgres
  and Redis, and it is not production: `synchronize: true` lets TypeORM alter
  the schema on boot, the bin endpoints are unauthenticated, and there is no
  rate limiting. Fine for a pilot, not for public traffic.
- **Not 100% accurate.** 18/22 on our own test set. Every result carries a
  confidence score, and below 0.60 it refuses to give a verdict at all.
- **Multi-item photos pick one headline material.** All items are detected and
  returned, but the single-material summary line can name the wrong one when a
  photo contains several. The scan is marked "Manual Sorting Required" in that
  case, so it never states a confident wrong answer.
- **No fine-tuning.** A general-purpose vision model with a strict output
  schema. We trained nothing, and it does not know municipality-specific rules.
- **The Ollama fallback is local-only and not trustworthy enough to demo.** We
  benchmarked three local vision models; all of them answered confidently on a
  blank image. It exists so the laptop stack degrades instead of dying. Railway
  has no host machine to reach, so if every Gemini key is exhausted there,
  scans fail outright rather than falling back.
- **One photo at a time.** No bulk scanning outside the internal evaluator.
- **Requires internet** for the classification call.
- **Android only** — that's the phone Vineeth has.
- **Pilot is one zone.** Household addresses and vendor warehouse are seeded
  for Coimbatore; the app does not yet onboard a household anywhere else.

## Who It's For

**Two people, and the product only works because it serves both.**

**The household or shop owner** — Vineeth, who already sorts the bottles he
recognises and throws the rest away because he cannot tell what it is. He gets
an answer in seconds, and somewhere for the plastic to actually go.

**The collection vendor** — the scrap dealer who will not drive to one shop for
200 grams. He gets a neighbourhood clustered into one trip, sees which
households are actually waiting, and claims the whole zone in a click. Both
sides are built and in this repo.

Serving only the first is what makes recycling apps fail: you tell someone
their wrapper is LDPE 4, and it still goes in the bin because nobody comes for
it.

Next, not built: other shop owners beyond the Coimbatore pilot, and local
administrators who want ward-level numbers on what is actually being diverted.

## How to Run

**You do not have to run anything** — it is deployed. The dashboard, the API
and the APK are all live; the links are at the top of this file.

What follows is for running it yourself, on your own machine.

**Everything at once** (Windows) — backend, tunnel and vendor dashboard:

```bash
./start-demo.bat        # ~70 seconds from cold, safe to re-run
```

**Or by hand:**

```bash
cd src/backend
cp .env.example .env            # add GEMINI_API_KEY, NGROK_AUTHTOKEN, NGROK_DOMAIN
docker compose up -d            # NestJS + Postgres + MinIO + Redis
docker compose --profile tunnel up -d   # + public HTTPS tunnel
curl http://localhost:3000/api/health   # must return status: ok
```

**Vendor dashboard:**

```bash
cd src/vendor-dashboard
npm install && npm run dev      # http://localhost:5173
```

**Client:**

```bash
cd src/nirvaha
flutter pub get
flutter build apk --release --dart-define=API_BASE_URL=https://<your-tunnel-domain>
adb install -r build/app/outputs/flutter-apk/app-release.apk
```

The address is compiled in at build time. Omit `--dart-define` and the app
falls back to the Android *emulator* loopback, which does not exist on a real
phone — every call then fails and it looks like the backend is broken.

Verify without a device or backend:

```bash
flutter analyze     # expect: No issues found!
flutter test        # expect: 8 tests passed
```

Test accounts: `test@gmail.com` / `test@1234` (household),
`vendor@gmail.com` / `vendor@1234` (vendor). Full runbook: [`commands.txt`](./commands.txt)

Full setup notes: [`docs/setup.md`](./docs/setup.md)

## Roadmap (post-hackathon)

Built this weekend, having originally been on this list: role-based accounts,
the pickup request flow, the vendor dashboard with map routing, warehouse
origin for routes, and deploying the backend off the laptop. What is genuinely
still ahead:

1. **Harden the deployment** — turn off `synchronize`, add migrations,
   authenticate the bin endpoints, add rate limiting
2. **Onboard a household anywhere** — addresses and zones are seeded for the
   Coimbatore pilot; self-signup with geocoding is not built
3. **Fix the multi-item headline** — detection is right, the single-material
   summary line is not. It needs the model to mark non-plastic items explicitly
4. **Expand beyond shops** — restaurants and households, same mixed plastic,
   same lack of guidance
5. **Recycler vendor handoff** — monthly scheduling and price per kg
6. **Payments to households** — the honest incentive is money for sorted
   plastic, and we deliberately invented no points or offers this weekend

## Evidence This Problem Is Real

See [USER_RESEARCH.md](./USER_RESEARCH.md) for our documented conversation with Vineeth.

## Team

**The Tesseractis** (TEAM-109)
Tech for Good 2026 · GDG Coimbatore · AI for Sustainable Cities & Climate Action

- Arunvpp ([@Arunvpp](https://github.com/Arunvpp))
- Kalyan Devoju ([@kalyandevoju1919-code](https://github.com/kalyandevoju1919-code))
