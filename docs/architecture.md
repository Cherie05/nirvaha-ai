# Architecture

Two front ends, one API, one database. The interesting decisions are about what
we refused to do.

## Deployed

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
   |   NestJS API — scan · bin · routing · Socket.IO       |
   |   Redis (cache)   S3 bucket (images)   Postgres       |
   +------------------------------------------------------+
                              |
                              v
              [ Gemini — vision, strict JSON schema ]
```

## Local development

Same API, same schema. Managed services become containers, and an ngrok tunnel
puts a real phone in front of them.

```text
  phone / browser  ->  ngrok  ->  docker compose
                                   api · postgres · redis · minio
                                        |
                                        v
                             Ollama on the host (fallback)
```

Storage is the only real difference: MinIO locally, a Railway S3 bucket
deployed. The code is identical — MinIO's client *is* an S3 client, so only the
endpoint and credentials change.

## Decisions, and what they cost

### The API key never ships in the app
An APK can be decompiled, so a key in the client is a key you have published.
Everything goes through our own server. That is the reason a backend exists at
all — the caching and aggregation came after.

### The product is the aggregation, not the classifier
Telling someone their wrapper is LDPE 4 changes nothing if nobody collects it.
One shop's plastic is never worth a scrap dealer's trip. The Digital Bin
accumulates until a neighbourhood is worth driving to, and a vendor claims the
whole zone in one action.

Classification is the demo; aggregation is the product.

### Refusing to answer is a feature
Below 0.60 confidence the app gives no verdict and hides material and weight.
A confident mistake contaminates a recycler's batch or sends recyclable plastic
to landfill. Costing ourselves an answer is cheaper.

### Weight counts only after collection
Lifetime totals move when a **vendor marks it collected**, never when something
is scanned. Otherwise photographing one bottle twice inflates the number and
it means nothing. A scan already in the bin cannot be added again — enforced in
the database, the API and the UI.

### A household waiting outranks a heavier zone
Vendor routes sort by `requestedCount` before weight. Verified: a 2.15 kg zone
with one request sorted above an 8.89 kg zone with none.

### OpenStreetMap, not Google Maps
No billing account, no key to leak, and it works offline in a venue.

### Postgres over anything simpler
Users, scans, bin items, vendor claims and zones are all relational, and the
routing queries are joins. SQLite would not have survived being deployed.

## What we did not build

- Payments to households. The honest incentive is money for sorted plastic; we
  invented no points, badges-for-scanning or fake offers.
- Self-signup with geocoding. Addresses and zones are seeded for the Coimbatore
  pilot.
- Authentication on the bin endpoints. Deliberate for demo speed, documented
  rather than hidden.
- Migrations. `synchronize: true` is a hackathon shortcut.

## Failure behaviour

| If this dies | What happens |
|---|---|
| Object storage | Scan still returns a verdict, `image_url: null`, phone shows its local copy |
| Redis | Cache misses, every scan hits Gemini — slower, still correct |
| All Gemini keys | Locally falls back to Ollama; on Railway the scan fails outright |
| Postgres | Health reports `error`. This is the one that actually breaks it |
| The tunnel | Only affects local development; the deployment is unaffected |

`/api/health` reports `ok` when **Postgres and Redis** are up. Storage being
down does not make it `error` — crying wolf on a degraded component teaches
people to ignore the light.
