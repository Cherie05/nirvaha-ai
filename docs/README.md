# Nirvaha — documentation

Everything that explains how this is built, why it is shaped this way, and how
to run or change it.

Start with the [root README](../README.md) for what the product does and the
live links. These pages are the detail behind it.

| Page | What it covers |
|---|---|
| [setup.md](./setup.md) | Get it running on a fresh machine, from zero |
| [architecture.md](./architecture.md) | How the pieces fit, and the decisions behind them |
| [backend.md](./backend.md) | NestJS API — modules, data model, every endpoint |
| [app.md](./app.md) | Flutter Android client — screens, state, offline behaviour |
| [frontend.md](./frontend.md) | React vendor dashboard — map, realtime, build |
| [docker.md](./docker.md) | The Compose stack, volumes, and the traps in it |
| [deployment.md](./deployment.md) | Railway + Netlify, exactly how it was deployed |
| [ai.md](./ai.md) | Classification: prompt, schema, key rotation, measured accuracy |
| [hackathon.md](./hackathon.md) | Timeline, milestones, what we cut and why |

## The short version

A shop owner photographs plastic. A vision model returns a resin code, a weight
and a confidence score. Below 0.60 confidence the app refuses to give a verdict
rather than guess.

Classified items go into a **Digital Bin**. At 2 kg the household can request a
pickup. That request appears instantly on a vendor's dashboard, where a whole
neighbourhood is claimed in one action — which is what makes the trip worth
driving. When the vendor marks it collected, the household's bin empties and
the weight lands in their lifetime total.

Classification alone does not move plastic. The aggregation is the product.

## Conventions in these docs

- Anything stated as a number was measured, not estimated. Where it was
  measured is named.
- "Built" means running and verified. Anything not built says so.
- Paths are relative to the repository root unless written otherwise.

---

The Tesseractis (TEAM-109) · Tech for Good 2026 · GDG Coimbatore
