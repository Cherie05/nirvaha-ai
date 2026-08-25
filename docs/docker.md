# Docker — the local stack

`src/backend/docker-compose.yml`

Five containers. One command brings them all up, and the same Dockerfile builds
what runs on Railway.

| Service | Image | Port | Role |
|---|---|---|---|
| `api` | built from `Dockerfile` | 3000 | NestJS |
| `postgres` | `postgres:16-alpine` | 5432 | Data |
| `redis` | `redis:7-alpine` | 6379 | Scan cache + JWT denylist |
| `minio` | `minio/minio` | 9000/9001 | S3-compatible image storage |
| `ngrok` | `ngrok/ngrok` | 4040 | Public tunnel — **profile-gated** |

## Running it

```bash
cd src/backend
cp .env.example .env         # then set GEMINI_API_KEY
docker compose up -d         # the four core services
curl http://localhost:3000/api/health
```

The tunnel is behind a profile, so it never starts unless asked:

```bash
docker compose --profile tunnel up -d
```

Or from the repo root, everything including the dashboard:

```bash
./start-demo.bat             # ~70 seconds cold, safe to re-run
```

## Stopping it

```bash
docker compose --profile tunnel down
```

> **Never add `-v`.** That deletes the named volumes — every scan, every
> pickup, every kilogram of history, and any seeded demo state. Without `-v`
> all of it survives a `down`, a reboot, and a Docker Desktop restart.
> Verified: after a full teardown the demo account still had its lifetime total
> and collection history.

## The Dockerfile

Multi-stage:

| Stage | Used by |
|---|---|
| `base` | node:20-alpine, workdir |
| `dependencies` | `npm ci` |
| `development` | + source, hot reload — what Compose uses locally |
| `build` | compiles to `dist/` |
| `production` | `node dist/main` — what **Railway** uses |

## Three traps that cost us real time

### 1. The `node_modules` volume

```yaml
volumes:
  - .:/usr/src/app            # host source over the container
  - /usr/src/app/node_modules # anonymous volume — persists forever
```

The anonymous volume shadows the image's install and **survives rebuilds**. So
after adding a dependency, `npm install` on the host is not enough and neither
is a plain rebuild — the container keeps the stale volume and you get
`Cannot find module 'x'` at startup.

```bash
docker compose build api
docker compose up -d -V api     # -V = --renew-anon-volumes
```

This is exactly what happened when `socket.io` was added, and again on a second
laptop where the packages were present in `package.json` all along.

### 2. `.env` is required to exist

`env_file: .env` means Compose fails at parse time if the file is missing. It is
gitignored, so a fresh clone must `cp .env.example .env` first. All 38 keys have
working defaults except `GEMINI_API_KEY`.

### 3. `${VAR:?message}` blocks the whole file

Using `${NGROK_DOMAIN:?...}` to force a required variable fails at **parse**
time — even for a service behind a profile that is not being started. It blocked
`docker compose up -d` entirely. Use `${NGROK_DOMAIN:-placeholder}` so only the
tunnel fails, and only when actually used.

## ngrok

Only needed to put a real phone in front of the local stack. **Pin the domain**
or every restart hands out a new random URL, which silently bricks an installed
APK — the address is compiled in at build time.

```
NGROK_DOMAIN=your-domain.ngrok-free.app     # bare hostname, no https://
```

A free ngrok account includes one permanent domain. Verified: destroying and
recreating the tunnel container returns the identical URL, so the installed APK
keeps working with no rebuild.

**Only one machine at a time can hold a reserved domain.** If a second laptop
starts the tunnel, one of you is dropped.

Request inspector: http://localhost:4040 — shows every call the phone makes,
with replay.

## Ollama

Not a container. It runs on the **host**, and the API reaches it at
`host.docker.internal:11434`.

> Ollama binds `127.0.0.1` by default, which Docker cannot reach through
> `host.docker.internal`. Set `OLLAMA_HOST=0.0.0.0:11434` before starting it or
> the fallback is silently absent while `ollama serve` looks perfectly healthy.
