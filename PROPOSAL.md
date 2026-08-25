# Architecture Proposal

> Transcribed from our Ideation-Phase submission on the Tech for Good platform,
> which was **validated and locked** after coach review #2 on 30 July 2026. The
> problem, the user and the scope cannot be changed. The organisers have since
> confirmed teams may use any tech stack, so the implementation in §4 and §5 has
> moved on from the locked text. Anything added after locking is marked as such.

- **Team name:** The Tesseractis
- **Team code:** TEAM-109
- **Track:** AI for Sustainable Cities & Climate Action
- **Members:** Arunvpp (@Arunvpp), Kalyan Devoju (@kalyandevoju1919-code)

> **TODO before Saturday:** the platform lists a third GitHub username,
> @Cherie05, but only two members by name. Confirm whether Cherie is building
> with us and fix this line either way — it is the roster the organisers read.

## 1. Problem

Vineeth, who runs a general store in a village area near Warangal, deals with
mixed plastic waste piling up daily with no way to know what's actually
recyclable versus what should go to a recycler versus general collection. He just
bags it all together and hopes it gets picked up, which means recyclable plastic
ends up landfilled and waste sits out longer than it should — attracting pests
and creating a health risk right outside his shop.

**How we know it's real:** We've personally seen this at Vineeth's general store
in a village near Warangal — plastic waste from packaging, bags, and containers
piling up mixed together, with no way for him to tell what's recyclable versus
what just gets tossed with the rest. It's a small daily habit multiplied across
every shop in the area, quietly adding up to a real waste problem in villages
like his.

Notes from talking to him are in [`USER_RESEARCH.md`](./USER_RESEARCH.md).

## 2. Who it helps

Right now: Vineeth, a general store owner in a village near Warangal, who wants a
fast way to know if his plastic waste is recyclable so he can sort it correctly
instead of bagging everything together and hoping for the best. Longer-term, this
extends to other shop owners, waste collection partners, and city/village
administrators — but the weekend build focuses on solving Vineeth's problem
first.

## 3. Proposed solution

For the hackathon, we're building the smallest useful slice: Vineeth snaps a
photo of his shop's plastic waste on the business app, and Gemini AI instantly
classifies it — recyclable or not, and estimated volume — so he knows how to sort
it correctly on the spot. No routing, no partner assignment, no dashboard yet —
just: photo in, clear answer out, in seconds.

> *Added after locking:* the app we are building is named **Nirvaha**. Only the
> name is new; the scope is exactly the slice described above.

## 4. High-level architecture

The locked submission read:

```
Business App (Flutter): Vineeth captures/uploads a photo of his shop's plastic waste
      ↓
Gemini API: classifies the waste as recyclable/non-recyclable + estimated volume
      ↓
Firebase (Firestore): stores the classification result
```

**Scope narrowed after coach review #2**, which told us: *"Your 'Architecture'
section describes a much larger system. Make sure the team stays laser-focused
only on the 'smallest useful slice' for the 24 hours."* What we are building is
exactly this and nothing else:

> **Changed after locking — Saturday 1 PM architecture decision.** The locked
> submission named Firebase (Firestore, Cloud Functions). We have moved to a
> self-hosted, containerised backend. The organisers confirmed teams may use any
> tech stack, so this does not require re-opening the proposal. The problem, the
> user and the scope are unchanged — only the implementation.

```
┌──────────────────────────────────────────────────────┐
│  Nirvaha (Flutter, Android)           src/nirvaha/   │
│                                                      │
│  HomeScreen ── image_picker ──► JPEG (1024px, q85)   │
│       │                                              │
│       ├──► POST /scan  ──────────┐                   │
│       │                          │                   │
│       ├──► confidence < 0.60 ? amber "Not sure"      │
│       │                      : green / red verdict   │
└──────────────────────────────────┼───────────────────┘
                                   ▼
┌──────────────────────────────────────────────────────┐
│  Docker Compose              src/backend/            │
│                                                      │
│   NestJS API (:3000)                                 │
│     ├── Redis     MD5(image) → cached verdict        │
│     ├── MinIO     S3-compatible image store          │
│     ├── Postgres  users, scans, recycler vendors     │
│     └── Gemini 2.5 Flash ── strict JSON schema       │
│           ◄── classification, material, volume,      │
│               advice, confidence                     │
└──────────────────────────────────────────────────────┘
         (Ngrok tunnels :3000 → HTTPS for judging)
```

Deliberately **not** in the weekend build — these are roadmap, and we will not
narrate them as if they exist: pickup requests, admin dashboard, partner app,
warehouse tracking, vendor scheduling, history, maps.

## 5. Tech stack

- **Flutter 3.44** — single Android app, `image_picker`, offline-first local state.
- **NestJS (Node.js)** in Docker — the API. Dependency injection keeps the
  Gemini call, auth and storage separable. JWT via `@nestjs/passport`.
- **PostgreSQL** (Docker) — users, scan history, recycler vendor lists.
- **MinIO** (Docker) — S3-compatible object storage for uploaded images, on
  local disk. No cloud bucket, no vendor account.
- **Redis** (Docker) — caches on the MD5 hash of the incoming image, so a repeat
  scan returns in milliseconds without spending Gemini quota.
- **Gemini 2.5 Flash** — strict JSON schema output.
- **Ngrok** — tunnels local port 3000 to public HTTPS for the Sunday demo.

**Why a server at all.** The Gemini key lives on the backend in a gitignored
`.env`, never in the APK — an Android app can be decompiled, so a client-side
key is a key you have given away. The server is also where caching becomes
possible.

Cloud Functions were listed in the locked submission. We are **not** using them;
NestJS replaces that role entirely.

## 6. Milestones to hackathon day

Tracked live in [`MILESTONES.md`](./MILESTONES.md) — that is the file the
organisers read. Friday's set:

- [x] Nobody on the team is under 18, so no guardian consent form is required
- [x] Every member can open this repo and push to it
- [x] Scaffolding runs on every member's machine — see [`docs/setup.md`](./docs/setup.md)
- [x] Vineeth conversation written up — see [`USER_RESEARCH.md`](./USER_RESEARCH.md)
- [x] Demo sentence agreed by everyone — see [`DEMO.md`](./DEMO.md)

## 7. Open questions / help needed

1. **Continuity for Vineeth (raised by the coach, still unanswered).** *"How
   will this specific photo-classification tool continue to help him after the
   weekend? What's the immediate next step for him to keep using it?"* Our
   working answer is sideloading a signed APK onto his phone, but we have not
   committed to it or asked him. This is 15% of the score and the honest gap.

2. **Are we confident enough to claim accuracy?** We have no labelled set. The
   Saturday midnight milestone asks for the hard part working on twenty real
   records rather than three examples — we need twenty real photos of Vineeth's
   actual waste, not stock images. Worth asking a mentor how to sample fairly.

3. **Is 0.60 the right confidence threshold?** Picked by judgement, not
   measurement. Too high and the app says "not sure" so often it is useless;
   too low and it starts guessing confidently. We would like a mentor's view.

---

*The Tesseractis (TEAM-109) · Tech for Good 2026 · GDG Coimbatore*
