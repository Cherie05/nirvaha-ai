# Deployment

Everything is hosted. Nothing depends on a laptop being awake.

| Piece | Host | URL |
|---|---|---|
| Vendor dashboard | Netlify | https://nirvaha-vendor.netlify.app |
| API + Postgres + Redis + bucket | Railway | https://health-team-109-the-tesseractis-production.up.railway.app/api/health |
| Android app | GitHub Release | [v1.0-demo](https://github.com/Build-with-AI-Code-for-Communities/health-team-109-the-tesseractis/releases/tag/v1.0-demo) |

```
   APK ──────────┐                ┌────────── Netlify (dashboard)
                 │                │
                 ▼                ▼
        ┌──────────────────────────────────┐
        │             RAILWAY              │
        │  NestJS · Postgres · Redis · S3  │
        └──────────────────────────────────┘
                        │
                        ▼
                   Gemini API
```

## Backend — Railway

Deployed from GitHub. The `production` stage of the existing Dockerfile, no
code written for hosting.

**Service settings**

```
Root Directory      src/backend
Dockerfile Path     Dockerfile
Docker Target       production
```

Root directory matters — building at the repo root fails.

**Plugins:** PostgreSQL and Redis.

**Variables** — Railway's names differ, so map them with reference syntax:

```
POSTGRES_HOST      ${{Postgres.PGHOST}}
POSTGRES_PORT      ${{Postgres.PGPORT}}
POSTGRES_USER      ${{Postgres.PGUSER}}
POSTGRES_PASSWORD  ${{Postgres.PGPASSWORD}}
POSTGRES_DB        ${{Postgres.PGDATABASE}}
REDIS_HOST         ${{Redis.REDISHOST}}
REDIS_PORT         ${{Redis.REDISPORT}}
REDIS_PASSWORD     ${{Redis.REDISPASSWORD}}
GEMINI_API_KEYS    <comma-separated keys>
GEMINI_MODEL       gemini-3.1-flash-lite
AI_PROVIDER        gemini
JWT_SECRET         <long random string>
NODE_ENV           development
PORT               3000
OLLAMA_WARMUP      false
```

Then **Settings → Networking → Generate Domain**.

### Four things that will catch you

**`NODE_ENV=production` disables the seeder.** `seeder.service.ts` returns early
outside development, so there are **no demo accounts at all** and every login
returns 401. We run `development` deliberately; the Docker *target* stays
`production`, so the optimised build is unaffected.

**`AI_PROVIDER` must be `gemini`, not `auto`.** On `auto` the orchestrator
probes Ollama first — which cannot exist on Railway — and every scan burns a
45-second timeout before falling through.

**Redis needs a password.** The client originally passed only host and port, so
every command failed against managed Redis. Two lines fixed it; without them
the API boots and looks healthy while caching silently fails.

**Object storage is optional.** Railway has no MinIO. A Railway bucket works as
a drop-in because the MinIO client is an S3 client — set `MINIO_ENDPOINT` to
the bare hostname, `MINIO_PORT=443`, `MINIO_USE_SSL=true`. Its `setBucketPolicy`
call is rejected (`S3Error: A header you provided implies functionality that is
not implemented`) and that is **harmless** — images are proxied through
`/api/images/...`, so the bucket never needs to be public. Uploads and
downloads both verified working.

Leaving storage unset is also fine: scans return `image_url: null` and the
phone shows its own local copy.

## Frontend — Netlify

`VITE_API_BASE_URL` is compiled in at **build time**, so Netlify environment
variables do nothing for a drag-dropped `dist`.

```bash
cd src/vendor-dashboard
npm run build          # .env already points at Railway
```

Then drop `dist/` on the existing site under **Deploys**. Dropping it on the
main drop page creates a second site on a new URL.

> Verify before deploying — a rebuild once picked up a stale `.env` and shipped
> a bundle calling `localhost:3000`, which loads and shows nothing:
> ```bash
> grep -oE "https?://[a-z0-9.:-]*" dist/assets/*.js | sort -u
> ```

The repo is private and org-owned, which is why Netlify's git integration
demands a paid plan. Drag-drop sidesteps it entirely and is free.

## App — APK

```bash
cd src/nirvaha
flutter build apk --release --dart-define=API_BASE_URL=https://<railway-url>
adb install -r build/app/outputs/flutter-apk/app-release.apk
adb shell pm clear com.nirvaha.nirvaha
```

`pm clear` is not optional when changing the address: a URL saved in the
Advanced screen **overrides** the compiled one and survives reinstalls.

The APK is attached to a GitHub Release rather than committed — it is 51 MB
against a 19 MB repo, and git keeps every version forever.

## Verified

13/13 end-to-end checks against the live deployment: both logins, an uncached
Gemini scan (2.2 s), image stored and read back from the bucket, add to bin,
duplicate refused, request pickup, vendor board, vendor map, claim, collect,
bin empties, history updates. CORS from Netlify and the Socket.IO handshake
both confirmed against Railway.

## Not production

`synchronize: true` lets TypeORM alter the schema on boot. Bin endpoints are
unauthenticated. There is no rate limiting. Fine for a pilot, wrong for public
traffic — see the roadmap in the [root README](../README.md).
