# Backend — NestJS API

`src/backend/` · Node 20 · NestJS 10 · TypeORM · Postgres · Redis · S3 storage

One service owns everything server-side: the AI call, the digital bin, vendor
routing, auth and image storage. It runs in Docker locally and on Railway in
the deployment — the same Dockerfile, different target stage.

## Why a server at all

The Flutter app could call Gemini directly. It must not.

**The API key would ship inside the APK.** An Android package can be
decompiled in minutes, so a key in the client is a key you have published. It
lives in `src/backend/.env`, gitignored, and never leaves the server.

Putting NestJS in front also buys caching: Redis keys on the MD5 of the
incoming image, so re-scanning the same photo returns in ~10 ms and spends no
quota. Measured: 2.02 s uncached, 0.01 s cached.

## Modules

| Module | Path | Responsibility |
|---|---|---|
| `ScanModule` | `src/scan/` | Image upload, AI orchestration, scan history |
| `AggregationModule` | `src/aggregation/` | Digital bin, pickup requests, vendor routing, Socket.IO |
| `AuthModule` | `src/auth/` | JWT issue/verify, login, logout with a denylist |
| `UsersModule` | `src/users/` | User records, addresses, vendor warehouses |
| `StorageModule` | `src/storage/` | S3-compatible image storage (`@Global`) |
| `CacheModule` | `src/cache/` | Redis client (`@Global`) |
| `GeocodingModule` | `src/geocoding/` | Nominatim lookups, Coimbatore zone centroids |
| `HealthModule` | `src/health/` | `/api/health` — dependency probes |
| `SeederModule` | `src/seeder/` | Demo accounts and sample data on boot |

## Data model

### `users`
Household or vendor. `role` is `USER` or `VENDOR`. Households carry
`latitude`, `longitude`, `address`; vendors additionally carry
`warehouseLat`, `warehouseLng`, `warehouseAddress` — the origin routing draws
from.

### `scans`
One row per photo. Holds the flattened verdict (`materialType`,
`estimatedWeightGrams`, `confidenceScore`) plus `items` as `jsonb` — the full
per-item breakdown for multi-object photos. `imageHash` is the MD5 used as the
cache key.

### `digital_bin_items`
One row per item a household set aside. This is the table the whole
aggregation turns on.

| Column | Why it exists |
|---|---|
| `status` | `PENDING` → `SCHEDULED` → `COLLECTED` |
| `scanId` | Stops the same photo being binned twice |
| `requestedAt` | When the **household** asked for collection |
| `scheduledAt` | When a **vendor** claimed it — deliberately separate |
| `collectedAt` | When it was actually collected |
| `latitude`/`longitude`/`address` | Snapshotted at add-time, not joined later |

**The location is a snapshot on purpose.** If a household moves, past
collections must stay on the map where they were actually collected.

**`requestedAt` and `scheduledAt` are different things.** Conflating them is
why the "Schedule pickup" button originally did nothing — the household's ask
had nowhere to be written, so the bin only ever moved when a vendor happened
to claim the zone for unrelated reasons.

## The pickup lifecycle

```
FILLING   bin under 2 kg — pickup locked
   |  household adds classified items
READY     bin >= 2 kg — "Request pickup" unlocks
   |  POST /api/bin/request-pickup   -> stamps requestedAt
REQUESTED zone jumps up the vendor board; Socket.IO pushes it live
   |  POST /api/vendor/claim-route   -> stamps scheduledAt, status SCHEDULED
SCHEDULED household sees "a vendor is on the way"
   |  POST /api/vendor/complete-route -> stamps collectedAt, status COLLECTED
COLLECTED bin empties, weight enters lifetime total, trip enters history
```

Weight counts towards a lifetime total **only after `COLLECTED`**. Scanning the
same bottle twice moves nothing.

Zones are ranked by `requestedCount` before weight, so a household that
actually asked outranks a heavier zone nobody is waiting on. Verified: RS Puram
at 2.15 kg sorted above Saibaba Colony at 8.89 kg.

## Endpoints

Base path `/api`. `@Public()` marks routes that skip the JWT guard.

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Disabled by default (`ALLOW_REGISTRATION=false`) |
| POST | `/auth/login` | Returns `access_token` + user |
| POST | `/auth/verify-otp` | Fixed-OTP path, same token contract |
| POST | `/auth/logout` | Adds the token's `jti` to a Redis denylist — a real logout |
| GET | `/auth/me` | Validates a restored session on cold start |

### Scanning
| Method | Path | Notes |
|---|---|---|
| POST | `/scan` | multipart `image`. Returns verdict + `id` + `image_url` |
| GET | `/scans` | This user's history, newest first |
| GET | `/images/:userId/:filename` | Proxies from storage — the bucket is never public |

### Digital bin (household)
| Method | Path | Notes |
|---|---|---|
| POST | `/bin/add` | Send `scanId` and a second add is refused as a duplicate |
| GET | `/bin/summary/:userId` | Weight, status, breakdown, milestones |
| GET | `/bin/lifetime/:userId` | Collected weight and milestone progress |
| POST | `/bin/request-pickup` | Refused below threshold, idempotent above it |
| GET | `/bin/pickups/:userId` | Collection history, one entry per trip |
| GET | `/bin/scan-ids/:userId` | Which scans are already binned, so the app can grey out "Add" |

### Vendor
| Method | Path | Notes |
|---|---|---|
| GET | `/vendor/routes` | Zones clustered, sorted by requests then weight |
| GET | `/vendor/map/:vendorId` | **One pin per household**, not per item |
| GET | `/vendor/route/:vendorId` | OSRM road path from the warehouse |
| POST | `/vendor/claim-route` | Claims a whole zone at once |
| POST | `/vendor/complete-route` | Marks the zone collected |
| POST | `/vendor/complete-pickup` | One household, scoped to `userId + zone` |
| GET | `/vendor/claimed/:vendorId` | Scheduled routes |
| GET | `/vendor/history/:vendorId` | Collected routes with household breakdown |

### Ops
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Postgres, Redis, storage, AI provider |
| GET | `/stats` | Aggregate counters |

## Realtime

`AggregationGateway` (Socket.IO, CORS open) emits:

- `bin:updated` — a household added plastic
- `pickup:requested` — a household asked for collection (louder; someone is waiting)
- `route:claimed` — a vendor took a zone
- `route:collected` — a zone was collected

The vendor dashboard reorders itself while the household is still holding
their phone.

> `@nestjs/websockets` is pinned to `^10`. Version 11 has a peer conflict with
> NestJS 10 and will not start.

## Health semantics

`status` is `ok` when **Postgres and Redis** are up. Storage being down does
**not** make it `error`: a scan whose upload fails still returns a verdict with
`image_url: null`, and the phone shows its own local copy. Storage failing
degrades history; it does not break the product.

Storage is probed with S3 `bucketExists`, not MinIO's `/minio/health/live` —
that endpoint only exists on a real MinIO server, so any other S3 provider
reported "down" while working perfectly.

Ollama is omitted entirely when `AI_PROVIDER=gemini`, because the orchestrator
never reaches the fallback in that mode.

## Known gaps

- `synchronize: true` — TypeORM alters the schema on boot. Fine for a pilot,
  wrong for production. Needs migrations.
- Bin and vendor endpoints are `@Public()`. A crafted `userId` could read or
  modify another household's bin. Deliberate for demo speed, documented rather
  than hidden.
- No rate limiting.

See [ai.md](./ai.md) for classification, [docker.md](./docker.md) for the
stack, [deployment.md](./deployment.md) for hosting.
