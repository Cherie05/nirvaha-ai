# User Research — Vineeth, General Store Owner

## Who

| | |
|---|---|
| **Name** | Vineeth |
| **Location** | Village area near Warangal, Telangana |
| **Business** | General store |
| **Interviewed by** | Arun |
| **Method** | Phone call, August 2026 |

Store observations below are from our own visits to his shop, recorded before
the call and referenced in our Ideation-Phase proposal.

---

## Questions and Vineeth's answers

These are his words, not paraphrases.

### 1. "What kinds of plastic waste do you deal with every day?"

> "Water bottles, plastic covers, and other plastics from shops and restaurants."

### 2. "What do you currently do with it?"

> "Pack it and leave it."

### 3. "Do you know which of that plastic is recyclable?"

> "Water bottles — that's the only one I know."

### 4. "What happens to recyclable plastic that goes in the mixed bag?"

> "They dump it in soil or somewhere. It's harmful to the environment."

### 5. "If there was a way to instantly know which plastic is recyclable, would you sort it?"

> "Yes — but if it takes around 30 minutes, I'll ignore it."

### 6. "What would make this NOT useful for you?"

> "It's not useful for me if I have to check each material using paperwork to
> figure out which is recyclable and which is not. I don't know which is
> recyclable — so I need an app or platform to identify it for me."

### 7. "Would you use something like this on your phone?"

> **Not yet asked.** Open question for our next call with him.

---

## What we observed at the store (firsthand)

- Water bottles stored separately in cardboard boxes — Vineeth knows these are recyclable, so he keeps them aside
- Plastic covers collected separately but thrown out with general waste — he doesn't know if they're recyclable
- No labelling, no bins, no sorting system for anything beyond bottles
- Everything that isn't a water bottle gets packed together and left for general waste collection
- Vineeth pointed to the bottles and covers separately while explaining — he already mentally separates them, but only acts on the bottles because that's the only one he's sure about

---

## Key insight

Vineeth already wants to sort — he keeps water bottles aside because he knows
those are recyclable. **The gap isn't motivation, it's knowledge.** He doesn't
know what else is recyclable, and he won't spend 30 minutes checking paperwork
to find out. He needs a tool that gives him the answer in seconds, the same way
he already identifies bottles by sight. That's exactly what Nirvaha does — but
for every type of plastic, not just bottles.

The tool must say "I'm not sure" when confidence is low, because if Vineeth
sorts based on a wrong answer and the collector rejects it, he'll stop trusting
the app and go back to dumping everything together.

---

## What this changed in the build

The answers above are his; the design responses below are ours.

| What he said | What we built because of it |
|---|---|
| *"if it takes around 30 minutes, I'll ignore it"* (Q5) | One screen, no navigation, no login. Classification fires automatically the moment the photo is taken — he never presses "analyse". |
| *"I need an app or platform to identify it for me"* (Q6) | No lookup tables, no reference chart, no manual material picker. He photographs; the model answers. |
| *"Water bottles — that's the only one I know"* (Q3) | Bottles are his existing baseline, so the app has to be useful on **covers and mixed packaging** to be worth opening at all. That's where we test hardest. |
| The trust argument in Key insight | The amber "Not sure" card below 0.60 confidence, which hides material and volume rather than showing a guess dressed up as a finding. |

**This corrected our own assumption.** Our proposal said Vineeth "just bags it
all together". That turned out to be not quite right — he already separates
water bottles. The real problem is narrower and more solvable than we wrote:
he sorts what he is sure about, and he is only sure about one thing.

---

## What this told us NOT to build

- **No pickup scheduling this weekend.** He has a collection arrangement. Sorting is the gap, not transport.
- **No login.** One person, one phone, one shop.
- **No history or analytics screen.** He is not going to review charts of his own rubbish.
- **The photo does not leave the phone.** Slower on a village connection, and it buys us nothing.

---

## Goal

> Vineeth, the general store owner, can correctly sort 90% of his daily plastic
> waste into recyclable and non-recyclable categories using Nirvaha, reducing
> recyclable plastic sent to landfill.

**We have not measured this.** It is the target, not a result. We have no
labelled set and we do not claim an accuracy number anywhere in this repo.

---

## Still open

- **Q7 unanswered** — whether he would actually use this on his phone during a working day.
- **What phone he has, and whether there is signal at the shop.** Nirvaha needs internet for every classification. If the shop has no reliable data, that is a real problem for us and we do not know the answer.
- **Continuity after the weekend.** How Vineeth keeps using this once the hackathon ends. Our working answer is sideloading a signed APK, but we have not agreed it with him.

---

*The Tesseractis (TEAM-109) · Tech for Good 2026 · GDG Coimbatore*
