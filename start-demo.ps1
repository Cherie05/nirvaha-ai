# Nirvaha — one command to bring the whole demo up.
#
#   .\start-demo.ps1          (or double-click start-demo.bat)
#
# Starts, in order, waiting for each to be genuinely ready before moving on:
#   Docker Desktop  ->  postgres/redis/minio  ->  NestJS API  ->  ngrok tunnel
#   ->  Ollama fallback  ->  vendor dashboard
#
# Written to be run half-asleep before a demo: it never assumes a step worked,
# it says which step failed, and it prints every URL at the end.

$ErrorActionPreference = "Continue"
$root     = $PSScriptRoot
$backend  = Join-Path $root "src\backend"
$vendor   = Join-Path $root "src\vendor-dashboard"
$ollamaEx = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"

function Say($msg)  { Write-Host "  $msg" }
function Ok($msg)   { Write-Host "  [ OK ] $msg"   -ForegroundColor Green }
function Warn($msg) { Write-Host "  [WARN] $msg"   -ForegroundColor Yellow }
function Die($msg)  { Write-Host "  [FAIL] $msg"   -ForegroundColor Red; Write-Host ""; exit 1 }

function Step($n, $title) {
  Write-Host ""
  Write-Host "[$n] $title" -ForegroundColor Cyan
}

# Returns $true as soon as $Test returns $true, or $false after $Seconds.
function WaitFor([scriptblock]$Test, [int]$Seconds, [string]$What) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    try { if (& $Test) { return $true } } catch { }
    Start-Sleep -Seconds 3
    Write-Host "." -NoNewline
  }
  Write-Host ""
  return $false
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  NIRVAHA - starting backend, tunnel and dashboard" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# ── 1. Docker ────────────────────────────────────────────────────────────
Step 1 "Docker Desktop"
docker info *> $null
if ($?) {
  Ok "already running"
} else {
  Say "not running - launching it (this takes 30-60s)"
  $dd = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dd) { Start-Process $dd } else { Die "Docker Desktop not found at $dd" }

  Write-Host "  waiting" -NoNewline
  $up = WaitFor { docker info *> $null; return $? } 180 "docker"
  if (-not $up) { Die "Docker did not come up in 3 minutes. Start it by hand, then re-run." }
  Ok "Docker is up"
}

# ── 2. Backend + tunnel ──────────────────────────────────────────────────
Step 2 "Backend stack + ngrok tunnel"
if (-not (Test-Path (Join-Path $backend ".env"))) {
  Die "src\backend\.env is missing. Copy .env.example and fill it in."
}

Push-Location $backend
# --remove-orphans clears containers left behind by older versions of this
# compose file, so the run does not open with a scary warning at demo time.
# Volumes are untouched by it; the database is safe.
docker compose --profile tunnel up -d --remove-orphans
$composeOk = $?
Pop-Location
if (-not $composeOk) {
  # "Scroll up" is useless advice: the build log above is hundreds of lines and
  # the actual reason is in the API's own log, not in compose's output.
  Write-Host ""
  Write-Host "  The API container did not become healthy. Read its log:" -ForegroundColor Yellow
  Write-Host "      cd `"$backend`"" -ForegroundColor Yellow
  Write-Host "      docker compose logs api --tail 50" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "  Most common cause on a fresh machine: src\backend\.env is" -ForegroundColor Yellow
  Write-Host "  missing or incomplete. Create it with:" -ForegroundColor Yellow
  Write-Host "      copy `"$backend\.env.example`" `"$backend\.env`"" -ForegroundColor Yellow
  Write-Host "  then set GEMINI_API_KEY in it." -ForegroundColor Yellow
  Die "docker compose failed."
}

Write-Host "  waiting for the API to answer" -NoNewline
$apiUp = WaitFor {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -UseBasicParsing
    return ($r.StatusCode -eq 200)
  } catch { return $false }
} 150 "api"
if (-not $apiUp) {
  Die "API never became healthy. Check:  cd src\backend; docker compose logs api --tail 40"
}
Ok "API healthy on http://localhost:3000"

# ── 3. Tunnel URL ────────────────────────────────────────────────────────
Step 3 "Public tunnel"
$expected = ""
$envLine = Select-String -Path (Join-Path $backend ".env") -Pattern "^NGROK_DOMAIN=" -ErrorAction SilentlyContinue
if ($envLine) { $expected = ($envLine.Line -split "=", 2)[1].Trim() }

$tunnelUrl = ""
$null = WaitFor {
  try {
    $t = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5
    if ($t.tunnels -and $t.tunnels.Count -gt 0) {
      $script:tunnelUrl = $t.tunnels[0].public_url
      return $true
    }
    return $false
  } catch { return $false }
} 60 "tunnel"

if ([string]::IsNullOrWhiteSpace($tunnelUrl)) {
  Warn "tunnel did not report a URL."
  if ([string]::IsNullOrWhiteSpace($expected)) {
    Warn "NGROK_DOMAIN is empty in .env - the tunnel refuses to start without it."
    Warn "Claim your free domain at https://dashboard.ngrok.com/domains"
  } else {
    Warn "Check:  cd src\backend; docker compose logs ngrok --tail 30"
  }
} else {
  Ok "tunnel live at $tunnelUrl"
  $bare = $tunnelUrl -replace "^https?://", ""
  if ($expected -and $bare -ne $expected) {
    Warn "URL is NOT your reserved domain ($expected)."
    Warn "The installed APK points at the reserved one and will NOT connect."
  } elseif ($expected) {
    Ok "matches your reserved domain - the installed app will connect with no rebuild"
  }
}

# ── 4. Ollama fallback ───────────────────────────────────────────────────
Step 4 "Ollama fallback (used only if every Gemini key is exhausted)"
$ollamaListening = $false
try {
  $null = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 4 -UseBasicParsing
  $ollamaListening = $true
} catch { $ollamaListening = $false }

if ($ollamaListening) {
  Ok "already running"
} elseif (Test-Path $ollamaEx) {
  # Must bind 0.0.0.0, not 127.0.0.1 - the API runs in Docker and reaches the
  # host through host.docker.internal, which cannot see a loopback-only port.
  [Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "User")
  $env:OLLAMA_HOST = "0.0.0.0:11434"
  Start-Process -FilePath $ollamaEx -ArgumentList "serve" -WindowStyle Hidden
  Start-Sleep -Seconds 5
  try {
    $null = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -UseBasicParsing
    Ok "started (bound to 0.0.0.0 so Docker can reach it)"
  } catch { Warn "did not start - not fatal, Gemini is the primary path" }
} else {
  Warn "Ollama not installed - not fatal, Gemini is the primary path"
}

# ── 5. Vendor dashboard ──────────────────────────────────────────────────
Step 5 "Vendor dashboard"

# Re-running this script must not pile up duplicate Vite windows, each one
# grabbing the next free port. If 5173 already answers, leave it alone.
$viteAlready = $false
try {
  $null = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 4 -UseBasicParsing
  $viteAlready = $true
} catch { $viteAlready = $false }

if ($viteAlready) {
  Ok "already running on http://localhost:5173"
} else {
  if (-not (Test-Path (Join-Path $vendor "node_modules"))) {
    Say "installing dependencies (first run only, ~1 min)"
    Push-Location $vendor
    npm install
    Pop-Location
  }

  # Its own window: Vite must keep running, and a crash stays readable there.
  Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$vendor'; Write-Host 'Nirvaha vendor dashboard - leave this window open' -ForegroundColor Cyan; npm run dev"
  )
  Say "starting in a separate window"

  $viteUp = WaitFor {
    try {
      $null = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 4 -UseBasicParsing
      return $true
    } catch { return $false }
  } 90 "vite"
  if ($viteUp) { Ok "dashboard on http://localhost:5173" }
  else { Warn "not answering yet - check the new window" }
}

# ── Summary ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  READY" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Vendor dashboard  http://localhost:5173"
Write-Host "  Backend (local)   http://localhost:3000/api/health"
if ($tunnelUrl) {
  Write-Host "  Phone reaches     $tunnelUrl"
}
Write-Host "  Request inspector http://localhost:4040"
Write-Host ""
Write-Host "  Logins            test@gmail.com / test@1234       (household)"
Write-Host "                    vendor@gmail.com / vendor@1234   (vendor)"
Write-Host ""
Write-Host "  Stop everything:  cd src\backend; docker compose --profile tunnel down"
Write-Host "  NEVER add -v to that - it deletes the database."
Write-Host ""
