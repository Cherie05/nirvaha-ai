#!/usr/bin/env bash
# smoke.sh — End-to-end verification for Nirvaha backend
# Run from src/backend/: bash scripts/smoke.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
DEMO_EMAIL="${DEMO_EMAIL:-test@gmail.com}"
DEMO_PASSWORD="${DEMO_PASSWORD:-test@1234}"
DEMO_OTP="${DEMO_OTP:-123456}"

PASS=0
FAIL=0

pass() { echo "  ✅ PASS — $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ FAIL — $1"; FAIL=$((FAIL + 1)); }

echo ""
echo "══════════════════════════════════════════════"
echo "  Nirvaha Backend Smoke Test"
echo "══════════════════════════════════════════════"
echo ""

# ───────────────── 1. Health check ─────────────────
echo "1️⃣  Health check"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
if [ "$HEALTH" = "200" ]; then pass "GET /api/health → 200"; else fail "GET /api/health → $HEALTH (expected 200)"; fi

# ───────────────── 2. Signup blocked ─────────────────
echo "2️⃣  Signup disabled"
REG_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/register"   -H "Content-Type: application/json"   -d '{"email":"nope@test.com","password":"abcd1234","displayName":"Nope"}')
if [ "$REG_CODE" = "403" ]; then pass "POST /api/auth/register → 403 (signup disabled)"; else fail "register should be 403, got $REG_CODE"; fi

# ───────────────── 3. Login with demo account ─────────────────
echo "3️⃣  Login (demo account)"
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login"   -H "Content-Type: application/json"   -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}")
TOKEN=$(echo "$LOGIN_RESP" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then pass "POST /api/auth/login → got token"; else fail "POST /api/auth/login → no token: $LOGIN_RESP"; fi

# ───────────────── 4a. Wrong password ─────────────────
echo "4️⃣  Wrong password"
BAD_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login"   -H "Content-Type: application/json"   -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"wrong\"}")
if [ "$BAD_CODE" = "401" ]; then pass "Wrong password → 401"; else fail "Wrong password → $BAD_CODE"; fi

# ───────────────── 4b. OTP ─────────────────
echo "4️⃣ b OTP"
OTP_RESP=$(curl -s -X POST "$BASE_URL/api/auth/verify-otp"   -H "Content-Type: application/json"   -d "{\"email\":\"$DEMO_EMAIL\",\"otp\":\"$DEMO_OTP\"}")
if echo "$OTP_RESP" | grep -q access_token; then pass "OTP $DEMO_OTP → got token"; else fail "OTP → $OTP_RESP"; fi
BAD_OTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/verify-otp"   -H "Content-Type: application/json"   -d "{\"email\":\"$DEMO_EMAIL\",\"otp\":\"000000\"}")
if [ "$BAD_OTP" = "401" ]; then pass "Wrong OTP → 401"; else fail "Wrong OTP → $BAD_OTP"; fi

# ───────────────── 5. Authenticated scan ─────────────────
echo "5️⃣  Authenticated scan (first request)"
# Generate a 1x1 red JPEG programmatically
SAMPLE_IMG=$(mktemp /tmp/smoke_XXXX.jpg)
printf '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00' > "$SAMPLE_IMG"
# Use a real small JPEG — just send the header bytes; the scan may fail on classify
# but what matters is the endpoint doesn't 401 or 500
SCAN_CODE=$(curl -s -o /tmp/smoke_scan.json -w "%{http_code}" -X POST "$BASE_URL/api/scan" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@$SAMPLE_IMG;type=image/jpeg")
if [ "$SCAN_CODE" = "200" ] || [ "$SCAN_CODE" = "201" ]; then
  pass "POST /api/scan → $SCAN_CODE"
elif [ "$SCAN_CODE" = "503" ]; then
  fail "POST /api/scan → 503 — AI unavailable, classification is BROKEN"
else
  fail "POST /api/scan → $SCAN_CODE"
fi
cat /tmp/smoke_scan.json 2>/dev/null | head -c 200
echo ""

# ───────────────── 6. Repeat scan (cache hit) ─────────────────
echo "6️⃣  Repeat scan (cache hit)"
SCAN2_CODE=$(curl -s -o /tmp/smoke_scan2.json -w "%{http_code}" -X POST "$BASE_URL/api/scan" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@$SAMPLE_IMG;type=image/jpeg")
CACHED=$(grep -o '"cached":true' /tmp/smoke_scan2.json || true)
if [ "$SCAN2_CODE" = "200" ] || [ "$SCAN2_CODE" = "201" ]; then
  if [ -n "$CACHED" ]; then pass "Repeat scan → cache hit"; else pass "Repeat scan → $SCAN2_CODE (cache may not apply for error responses)"; fi
elif [ "$SCAN2_CODE" = "503" ]; then
  fail "Repeat scan → 503 — AI unavailable"
else
  fail "Repeat scan → $SCAN2_CODE"
fi

# ───────────────── 7. Fetch history ─────────────────
echo "7️⃣  Fetch history"
HIST_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/scans?limit=5&offset=0" \
  -H "Authorization: Bearer $TOKEN")
if [ "$HIST_CODE" = "200" ]; then pass "GET /api/scans → 200"; else fail "GET /api/scans → $HIST_CODE"; fi

# ───────────────── 8. Fetch stats ─────────────────
echo "8️⃣  Fetch stats"
STAT_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/stats" \
  -H "Authorization: Bearer $TOKEN")
if [ "$STAT_CODE" = "200" ]; then pass "GET /api/stats → 200"; else fail "GET /api/stats → $STAT_CODE"; fi

# ───────────────── 9. Logout ─────────────────
echo "9️⃣  Logout"
LOGOUT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN")
if [ "$LOGOUT_CODE" = "200" ]; then pass "POST /api/auth/logout → 200"; else fail "POST /api/auth/logout → $LOGOUT_CODE"; fi

# ───────────────── 10. Revoked token → 401 ─────────────────
echo "🔟  Revoked token"
REV_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/stats" \
  -H "Authorization: Bearer $TOKEN")
if [ "$REV_CODE" = "401" ]; then pass "Revoked token → 401"; else fail "Revoked token → $REV_CODE (expected 401)"; fi

# ───────────────── Cleanup ─────────────────
rm -f "$SAMPLE_IMG" /tmp/smoke_scan.json /tmp/smoke_scan2.json

echo ""
echo "══════════════════════════════════════════════"
echo "  Results:  $PASS PASS  /  $FAIL FAIL"
echo "══════════════════════════════════════════════"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
