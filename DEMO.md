# Demo — Nirvaha

The Tesseractis (TEAM-109) · room 308 · expo 12:45–2:45

Two judges come to the table. Target **4 minutes**, leaving time for questions.
Run it with a timer at least twice before they arrive.

---

## One sentence, said first

> "A shop owner photographs his plastic, we tell him what it is — and then we
> get it collected, because knowing it's recyclable is useless if nobody comes
> for it."

---

## Before judges arrive — pre-flight

- [ ] `start-demo.bat` run, all five steps `[ OK ]`
- [ ] Step 3 said **"matches your reserved domain"**
- [ ] Laptop set to **never sleep**. Plugged in.
- [ ] Vendor dashboard open at `localhost:5173`, **signed in**, on Available Routes
- [ ] Phone: app open on the dashboard, signed in, **screen brightness up**
- [ ] Phone on **mobile data**, not venue wifi
- [ ] **Bin sitting at 1.98 kg of 2.00** so one scan crosses the threshold
- [ ] A physical plastic item on the table — **a bottle or a jug, not a
      wrapper.** It needs to weigh 25 g or more to tip the bin over

If the bin is empty at 0 kg, the pickup flow will not unlock and the demo
stalls at its most important moment. Check this one first.

Check the number on the dashboard before judges arrive. If it is not just
under 2 kg, scan a couple of items into it until it is.

**If a scan doesn't cross the line** — a 10 g wrapper won't — just scan a
second item. Say *"that's realistic, it fills over a few days"* and carry on.
It is not a failure, and pretending otherwise is what makes it look like one.

---

## The demo

### 0:00 — The problem (25s)
*Hold the phone, don't tap yet.*

> "Vineeth runs a general store near Warangal. Bottles he keeps aside — he
> knows those are recyclable. Everything else goes out with the general waste,
> because he can't tell what's what. His words: *'if it takes around 30
> minutes, I'll ignore it.'*
>
> The gap isn't motivation. It's knowledge — and then logistics."

### 0:25 — Scan something real (45s)
*Pick up the item on the table. Photograph it in front of them.*

> "One photo."

**There is a ~4 second wait here. Measured, uncached: 4.3s.** It is the only
wait in the whole demo — every other tap is 0.2s. Do not stand in silence
watching the spinner. Fill it:

> "That's going to our own API, not straight to Google — the key never ships
> inside the app, and we cache on the image hash so a repeat scan costs no
> quota."

*Result screen appears.*

> "PET 1. 0.95 confidence. Estimated weight. Rinse and crush before recycling."

**Do not skip the confidence number.** It sets up the next beat.

### 1:10 — What it does when it isn't sure (25s)
*Open History → "Check by hand" tab, tap an amber result.*

> "Below 0.60 we refuse to give a verdict. We hide the material and the weight,
> because showing details next to 'not sure' makes a guess look researched.
>
> A confident wrong answer sends recyclable plastic to landfill, or
> contaminates a recycler's whole batch. We'd rather say we don't know."

### 1:35 — Knowing isn't enough (50s)
*Tap Add to bin. Return to dashboard.*

> "Here's the part that makes it work. One shop's plastic is never worth a
> scrap dealer's trip — so it goes in the general waste anyway.
>
> Everything he classifies goes into a Digital Bin. At 2 kg — the point a
> collection is worth driving to — this unlocks."

*Tap **Request pickup**. Banner appears.*

> "Requested. He's waiting on a vendor."

### 2:25 — The vendor side, live (50s)
*Turn the laptop toward them. Do not refresh.*

> "That request just arrived here. No refresh — it's a websocket."

*Point at the indigo banner and the zone card.*

> "RS Puram, 2.1 kg, one household asking. Notice it's sorted **above** an
> 8.9 kg zone — a household actually waiting outranks a heavier one nobody
> asked about."

*Click Show map, click the pin.*

> "One pin per door, not per item — the vendor drives to an address. Route from
> their warehouse, on OpenStreetMap."

*Click Claim route.*

> "One click claims the whole neighbourhood. Every household in it is scheduled
> at once — that's what makes the trip economic."

### 3:15 — Close the loop (35s)
*Mark collected on the laptop. Pull to refresh on the phone.*

> "Collected. His bin is empty, the weight is in his lifetime total, and the
> trip is in his history.
>
> And it only counted **after** a collector actually took it. Scanning the same
> bottle twice moves nothing."

### 3:50 — Be honest about accuracy (20s)

> "22 labelled photos, all seven resin codes. 18 exact matches — 82%. The
> misses are in our README with the reasons. Two were multi-item photos where
> detection was right but our summary line picked the wrong headline."

### 4:10 — and it is all live (10s)

*Only if there is time, or if they ask "is this deployed?"*

> "Everything you just saw is hosted. Dashboard on Netlify, the API with
> Postgres, Redis and object storage on Railway — nothing runs on this laptop.
> You can open it on your own phone right now."

  Dashboard  nirvaha-vendor.netlify.app
  API health health-team-109-the-tesseractis-production.up.railway.app/api/health

**Stop here.** Let them ask.

---

## If something breaks

| What breaks | Say this, then do this |
|---|---|
| Phone shows "Can't reach Nirvaha" | *"Tunnel dropped — one second."* Profile → gear → Advanced → paste URL → Save |
| Scan errors / takes >15s | *"That's our Gemini quota — here's one from a moment ago."* Open History and show a stored result |
| Dashboard blank | Reload the tab. Keep talking about the phone while it loads |
| Everything is down | Show the History tab on the phone. Real stored scans, real weights. Then say what you'd fix |

Never say "it usually works". Say what happened and what you'd do about it.
Judges have seen a hundred broken demos; they haven't seen many honest ones.

---

## What we will NOT claim

- **Deployed, but not hardened.** Everything is hosted — dashboard on Netlify,
  API + Postgres + Redis + object storage on Railway, and the APK points at
  Railway. Do NOT say "the backend is on my laptop"; that stopped being true
  on Sunday morning.
  What it is *not*: production-grade. `synchronize: true` still lets TypeORM
  alter the schema on boot, the bin endpoints are unauthenticated, and there is
  no rate limiting. Say that if a judge pushes on it — it is a better answer
  than pretending.
- **Not fine-tuned.** A general-purpose vision model with a strict schema. We
  trained nothing.
- **Not 82% on the real world.** 82% on *our* 22 labelled photos.
- **Not multi-city.** Addresses and zones are seeded for the Coimbatore pilot.
- **The Ollama fallback is not demo-grade.** It exists so the service degrades
  instead of dying. All three local models we tested answered confidently on a
  blank image. Do not run the demo on it.
- **We do not pay households yet.** No points, no coupons, no invented rewards.
  The honest incentive is money for sorted plastic, and it is roadmap.

---

## Likely questions

**"What if the AI is wrong?"**
Below 0.60 we refuse a verdict. Above it we still show the score. The bin is
weighed by a human before collection anyway.

**"Why not just use a barcode / the recycling symbol?"**
Most Indian retail plastic has no legible resin mark — wrappers and covers
especially. That's exactly the plastic Vineeth throws away.

**"How is this different from a plant-ID app?"**
Classification is the easy half. The Digital Bin and zone aggregation are the
half that makes plastic actually move.

**"What's the business model?"**
Vendors pay per kg for clean sorted plastic. Aggregation is what makes a
household route worth driving. We have not built payments.

**"Does it scale?"**
Postgres, Redis and object storage in containers — that part scales. What
doesn't yet is onboarding: addresses and zones are seeded, not self-signup.

---

## Team

Arun & Kalyan — The Tesseractis (TEAM-109)
