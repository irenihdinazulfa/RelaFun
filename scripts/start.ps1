# Menjalankan RelaFun di Windows.
# Pemakaian:  klik dua kali start.bat   ATAU   powershell -ExecutionPolicy Bypass -File scripts\start.ps1
# Alamat: https://relafun
#   - nama "relafun" ditambahkan ke file hosts Windows sekali (izin Administrator);
#   - sertifikat HTTPS khusus laptop ini dipasang sekali (jendela peringatan sertifikat Windows),
#     sehingga ada gembok aman dan aplikasi bisa dipasang/dipakai luring.
# Bila salah satu izin tidak diberikan atau port 80/443 terpakai, aplikasi tetap jalan
# di http://relafun atau http://localhost:8000.
#   -Port 8000  memakai port tertentu (tanpa https)   -NoAlias  tanpa nama relafun   -NoHttps  tanpa https
param([int]$Port = 0, [switch]$NoBrowser, [switch]$NoAlias, [switch]$NoHttps)

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

# 4. Alamat http://relafun: tambahkan "127.0.0.1 relafun" ke file hosts (sekali saja, perlu izin Administrator)
$HostsFile = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"
function Test-RelafunAlias {
  (Test-Path $HostsFile) -and (Select-String -LiteralPath $HostsFile -Pattern '^\s*127\.0\.0\.1\s+relafun(\s|$)' -Quiet)
}
$alias = Test-RelafunAlias
if (-not $alias -and -not $NoAlias) {
  Write-Host "Membuat alamat http://relafun (sekali saja). Klik 'Ya' pada jendela izin Windows." -ForegroundColor Yellow
  $line = "127.0.0.1 relafun  # RelaFun (dibuat oleh scripts\start.ps1)"
  $script = "Add-Content -LiteralPath '$HostsFile' -Value ([Environment]::NewLine + '$line') -Encoding ASCII; ipconfig /flushdns | Out-Null"
  $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
  try {
    Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList "-NoProfile -EncodedCommand $encoded"
  } catch {
    Write-Host "Izin tidak diberikan ($($_.Exception.Message)). Aplikasi memakai alamat localhost." -ForegroundColor Yellow
  }
  $alias = Test-RelafunAlias
}
# 5. HTTPS: sertifikat lokal untuk https://relafun (kunci induknya dibuang; hanya berlaku untuk nama relafun)
$busy80 = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue
$busy443 = Get-NetTCPConnection -LocalPort 443 -State Listen -ErrorAction SilentlyContinue
$Https = $false
if ($alias -and $Port -eq 0 -and -not $NoHttps -and -not $busy80 -and -not $busy443) {
  Push-Location $Api
  try { $tls = (& $Py -m app.tls) | ConvertFrom-Json } finally { Pop-Location }
  $trusted = Get-ChildItem Cert:\CurrentUser\Root | Where-Object { $_.Thumbprint -eq $tls.ca_thumbprint }
  if (-not $trusted) {
    Write-Host "Memasang sertifikat keamanan khusus laptop ini (sekali saja)." -ForegroundColor Yellow
    Write-Host "Pada jendela 'Security Warning / Peringatan Keamanan', klik 'Yes / Ya'." -ForegroundColor Yellow
    try {
      Import-Certificate -FilePath $tls.ca -CertStoreLocation Cert:\CurrentUser\Root | Out-Null
    } catch {
      Write-Host "Sertifikat tidak dipasang ($($_.Exception.Message)). Aplikasi memakai http." -ForegroundColor Yellow
    }
    $trusted = Get-ChildItem Cert:\CurrentUser\Root | Where-Object { $_.Thumbprint -eq $tls.ca_thumbprint }
  }
  $Https = [bool]$trusted
}
if ($Https) {
  $Port = 443
  $Url = "https://relafun/"
  $Suffix = ""
} else {
  if ($Port -eq 0) { $Port = if ($alias -and -not $busy80) { 80 } else { 8000 } }
  $HostName = if ($alias) { "relafun" } else { "localhost" }
  $Suffix = if ($Port -eq 80) { "" } else { ":$Port" }
  $Url = "http://$HostName$Suffix/"
}

# 6. Alamat untuk HP di jaringan Wi-Fi yang sama (lewat http; port 80 bila https aktif)
$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -ExpandProperty IPAddress
Write-Host ""
Write-Host "Buka di komputer ini : $Url" -ForegroundColor Green
foreach ($ip in $ips) { Write-Host "Buka dari HP (Wi-Fi sama): http://$ip$Suffix" -ForegroundColor Green }
Write-Host "Akun demo  siswa / siswa123   |   guru / guru123   |   kode kelas RF8A26"
Write-Host "Tekan Ctrl+C untuk berhenti."
Write-Host ""

if (-not $NoBrowser) { Start-Job -ScriptBlock { param($u) Start-Sleep 3; Start-Process $u } -ArgumentList $Url | Out-Null }

Push-Location $Api
try {
  if ($Https) {
    & $Py -m app.serve --https-port 443 --http-port 80
  } else {
    & $Py -m uvicorn app.main:app --host 0.0.0.0 --port $Port
  }
} finally {
  Pop-Location
}
