# Menjalankan RelaFun di Windows.
# Pemakaian:  klik dua kali start.bat   ATAU   powershell -ExecutionPolicy Bypass -File scripts\start.ps1
param([int]$Port = 8000, [switch]$NoBrowser)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Api = Join-Path $Root "apps\api"
$Venv = Join-Path $Api ".venv"
$Py = Join-Path $Venv "Scripts\python.exe"

Write-Host "== RelaFun ==" -ForegroundColor Cyan

# 1. Cari Python 3.10+
$base = $null
foreach ($cand in @("py -3", "python", "python3")) {
  try {
    $ver = & cmd /c "$cand -c ""import sys;print('%d.%d'%sys.version_info[:2])""" 2>$null
    if ($LASTEXITCODE -eq 0 -and [version]$ver -ge [version]"3.10") { $base = $cand; break }
  } catch {}
}
if (-not $base) {
  Write-Host "Python 3.10 atau lebih baru belum terpasang." -ForegroundColor Red
  Write-Host "Unduh dari https://www.python.org/downloads/ (centang 'Add python.exe to PATH'), lalu jalankan lagi."
  Read-Host "Tekan Enter untuk keluar"
  exit 1
}

# 2. Lingkungan virtual + paket (hanya dipasang ulang jika requirements.txt berubah)
if (-not (Test-Path $Py)) {
  Write-Host "Menyiapkan lingkungan Python (sekali saja)..."
  & cmd /c "$base -m venv ""$Venv"""
}
$req = Join-Path $Api "requirements.txt"
$stamp = Join-Path $Venv ".req-hash"
$hash = (Get-FileHash $req -Algorithm SHA256).Hash
if (-not (Test-Path $stamp) -or (Get-Content $stamp) -ne $hash) {
  Write-Host "Memasang paket Python (butuh internet, sekali saja)..."
  & $Py -m pip install --disable-pip-version-check -q --upgrade pip
  & $Py -m pip install --disable-pip-version-check -q -r $req
  if ($LASTEXITCODE -ne 0) { Write-Host "Gagal memasang paket. Periksa koneksi internet." -ForegroundColor Red; exit 1 }
  Set-Content -Path $stamp -Value $hash
}

# 3. File .env
$envFile = Join-Path $Root ".env"
if (-not (Test-Path $envFile)) { Copy-Item (Join-Path $Root ".env.example") $envFile }

# 4. Alamat untuk HP di jaringan Wi-Fi yang sama
$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -ExpandProperty IPAddress
Write-Host ""
Write-Host "Buka di komputer ini : http://localhost:$Port" -ForegroundColor Green
foreach ($ip in $ips) { Write-Host "Buka dari HP (Wi-Fi sama): http://${ip}:$Port" -ForegroundColor Green }
Write-Host "Akun demo  siswa / siswa123   |   guru / guru123   |   kode kelas RF8A26"
Write-Host "Tekan Ctrl+C untuk berhenti."
Write-Host ""

if (-not $NoBrowser) { Start-Job -ScriptBlock { param($p) Start-Sleep 3; Start-Process "http://localhost:$p" } -ArgumentList $Port | Out-Null }

Push-Location $Api
try {
  & $Py -m uvicorn app.main:app --host 0.0.0.0 --port $Port
} finally {
  Pop-Location
}
