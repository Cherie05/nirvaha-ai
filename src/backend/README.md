# Nirvaha Backend

NestJS backend for the Nirvaha Flutter app — built for a 12-hour hackathon. This API processes plastic waste scans, calls Gemini 2.5 Flash for material classification, handles JWT auth, stores data in Postgres, and caches in Redis.

## Stack
- **NestJS 10**
- **PostgreSQL 16** (Database)
- **MinIO** (S3-compatible image store)
- **Redis 7** (Cache & JWT denylist)
- **Docker & Docker Compose**

## Setup & Running

Everything runs via Docker Compose.

### 1. Environment
Copy `.env.example` to `.env` and **fill in the Gemini API key**:

```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY
```

**Note**: The app will crash on boot if `GEMINI_API_KEY` is not provided.

### 2. Start the Stack
Bring up the entire stack with one command:

```bash
docker compose up -d
```

This starts:
- API on `http://localhost:3000`
- Postgres on `localhost:5432`
- Redis on `localhost:6379`
- MinIO API on `http://localhost:9000`
- MinIO Console on `http://localhost:9001`

**Checking health**:
```bash
curl http://localhost:3000/api/health
```

### 3. Demo Access (Ngrok)
To allow the Flutter phone app to reach the laptop during judging, use Ngrok on port 3000.

First, find your LAN IP (e.g., `192.168.1.5`):
- Windows: `ipconfig`
- macOS/Linux: `ifconfig` or `ip a`

Then start Ngrok:
```bash
ngrok http 3000
```
Update the Flutter client to point to the Ngrok HTTPS URL.

### 4. Seed Data
On boot (in development mode), the app automatically seeds:
- A demo user: `vineeth@nirvaha.local` / password: `demo1234`
- 3 sample scans for the demo user (History screen will be populated).

## API Endpoints

### Auth
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Logout (requires Bearer token)
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <TOKEN>"

# Get Me
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

### Scan & Core
```bash
# Upload and Classify a Scan (multipart/form-data, field name 'image')
curl -X POST http://localhost:3000/api/scan \
  -H "Authorization: Bearer <TOKEN>" \
  -F "image=@/path/to/bottle.jpg"

# Get Scan History
curl http://localhost:3000/api/scans?limit=20&offset=0 \
  -H "Authorization: Bearer <TOKEN>"
```

### Stats
```bash
# Get Dashboard Stats
curl http://localhost:3000/api/stats \
  -H "Authorization: Bearer <TOKEN>"
```
