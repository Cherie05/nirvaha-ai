# Classification

`src/backend/src/scan/`

One photo in, a resin code, a weight and a confidence score out — or an honest
refusal to answer.

## The seven codes

`PET 1` · `HDPE 2` · `PVC 3` · `LDPE 4` · `PP 5` · `PS 6` · `OTHER 7`

Defined once in `ai-provider.interface.ts` and enforced by the model's response
schema, so a provider cannot invent an eighth.

## Never "mixed"

A photo with several kinds of plastic returns **each item separately**, with its
own code, quantity and weight:

```json
{ "items": [
  { "material_type": "PET 1",  "item_name": "PET water bottles", "quantity": 2 },
  { "material_type": "PP 5",   "item_name": "Bottle caps",       "quantity": 3 }
]}
```

"Mixed" is the answer that makes a shop owner give up. If we cannot separate
them we say we are unsure instead.

## The 0.60 rule

Every result carries `confidence_score`. Below **0.60** the app refuses a
verdict and shows an amber *"Uncertain Material: Manual Sorting Required"*
card, with **material and weight hidden**.

Hiding them is deliberate. Showing details next to "not sure" makes a guess
look researched. A confident wrong answer sends recyclable plastic to landfill
or contaminates a recycler's whole batch — worse than no answer.

`flattenEnvelope()` takes the **minimum** confidence across items, so one
uncertain object makes the whole scan uncertain. Two distinct materials also
force manual sorting regardless of score.

## Providers

**Gemini** (`gemini-3.1-flash-lite`) with a strict `responseSchema`. Keys
rotate: on *any* failure — timeout, quota, model-not-found, rejected key, bad
JSON — the next key is tried within a 45-second shared budget. Free tier is
20 requests/day **per project per model**, so three keys is roughly 3× headroom.

**Ollama** (`qwen2.5vl:3b`) on the host, local only, fallback only.

`AI_PROVIDER` selects: `gemini`, `ollama`, or `auto` (Gemini, falling back).
Railway runs `gemini` — there is no host machine to reach, so the orchestrator
never enters the fallback branch.

### Why Ollama is not demoed

We benchmarked three local vision models against our labelled set. **All three
answered confidently on a blank image.** It exists so the laptop stack degrades
instead of dying, not because we would show it to a user.

## Measured accuracy

22 labelled photos, all seven codes, run against the live classifier:

```
OVERALL: 18/22 exact material match (82%)

  PVC 3     4/4  ████
  OTHER 7   3/3  ███
  PET 1     3/3  ███
  PP 5      3/3  ███
  HDPE 2    2/3  ██·
  PS 6      2/3  ██·
  LDPE 4    1/3  █··
```

PVC and multi-layer pouches — the two hardest for a vision model and the two
that matter most in Indian retail waste — were perfect, including medicine
blister packs and pan masala pouches.

### The four misses, examined individually

| Truth → got | What happened |
|---|---|
| HDPE 2 → LDPE 4 (carry bags) | Carry bags usually *are* LDPE. The folder label is arguably the loose one |
| PS 6 → OTHER 7 (EVA foam) | EVA is ethylene-vinyl acetate, not polystyrene. `OTHER 7` is chemically correct |
| LDPE 4 → OTHER 7 (cling film) | **A real bug** — see below |
| LDPE 4 → PET 1 | No LDPE detected at all. Either a misfiled photo or a genuine miss |

None are counted as passes.

### The flattening bug

On the cling-film photo the model was **right**:

```
LDPE 4   Cling film wrap     conf 0.95
OTHER 7  Vegetables          conf 1.00
```

`flattenEnvelope()` picks the headline by highest confidence, and the
*vegetables* scored higher. So a plastic-sorting app titled the scan
"2 items — Vegetables and 1 more".

**It does not produce a wrong verdict.** Two distinct materials trip
`requires_manual_sorting`, so the app correctly says it is unsure and hides the
material. The damage is a title string.

The proper fix needs the model to mark non-plastic items explicitly — a new
schema field — because `OTHER 7` *is* a valid resin code, so "prefer a valid
code" would not help. Deferred rather than changed hours before a demo.

## Caching

Redis keys on `userId:md5(image)`. A repeat scan of the same photo returns from
cache and spends no quota.

Measured: **2.02 s uncached, 0.01 s cached.**

Keying on user as well as hash prevents one account's image URL leaking into
another's response.

## Cost of a scan, measured

An uncached scan over the public tunnel takes **~4.3 s**; on Railway, **~2.2 s**.
Every other action in the product is ~0.2 s. So of a 4-minute demo, about six
seconds is the machine and the rest is talking.

## Reproducing the benchmark

Labelled images live in `src/assets/Testing_images/`, one folder per code. The
in-app **Batch Evaluator** (Profile → Tools) runs up to 20 images and reports
per-item results.
