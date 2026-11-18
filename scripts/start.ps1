# Menjalankan RelaFun di Windows.
# Pemakaian:  klik dua kali start.bat (atau shortcut RelaFun di Desktop)
#        ATAU powershell -ExecutionPolicy Bypass -File scripts\start.ps1
# Alamat: http://relafun.localhost
#   Browser (Chrome, Edge, Firefox) menganggap *.localhost sebagai alamat aman: tanpa label
#   "Not secure", aplikasi bisa dipasang dan dipakai luring. Tidak perlu izin Administrator
#   atau sertifikat. Alamat lama http://relafun otomatis dialihkan ke alamat ini.
#   -Port 8000  memakai port tertentu
#   -Https      (pilihan) https://relafun: nama di file hosts (izin Administrator) dan
#               sertifikat lokal (peringatan sertifikat Windows), lihat app/tls.py
param([int]$Port = 0, [switch]$NoBrowser, [switch]$Https)

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

# 4. Server RelaFun lama yang masih jalan (jendela lain / percobaan sebelumnya) dihentikan dulu,
#    supaya klik start.bat selalu berarti "nyalakan ulang".
foreach ($p in 80, 443, 8000) {
  foreach ($c in @(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue)) {
    if (-not $c) { continue }
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($c.OwningProcess)" -ErrorAction SilentlyContinue
    if ($proc -and $proc.CommandLine -match 'uvicorn app\.main:app|-m app\.serve') {
      Write-Host "Menghentikan RelaFun lama di port $p..."
      $parent = Get-CimInstance Win32_Process -Filter "ProcessId=$($proc.ParentProcessId)" -ErrorAction SilentlyContinue
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
      if ($parent -and $parent.CommandLine -match 'uvicorn app\.main:app|-m app\.serve') {
        Stop-Process -Id $parent.ProcessId -Force -ErrorAction SilentlyContinue
      }
    }
  }
}
Start-Sleep -Milliseconds 600
$busy80 = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue
$busy443 = Get-NetTCPConnection -LocalPort 443 -State Listen -ErrorAction SilentlyContinue

# 5. (Pilihan -Https) https://relafun dengan nama di file hosts + sertifikat lokal
$UseHttps = $false
if ($Https -and -not $busy80 -and -not $busy443) {
  $HostsFile = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"
  $hasAlias = { (Test-Path $HostsFile) -and (Select-String -LiteralPath $HostsFile -Pattern '^\s*127\.0\.0\.1\s+relafun(\s|$)' -Quiet) }
  if (-not (& $hasAlias)) {
    Write-Host "Membuat nama 'relafun' (sekali saja). Klik 'Ya' pada jendela izin Windows." -ForegroundColor Yellow
    $line = "127.0.0.1 relafun  # RelaFun (dibuat oleh scripts\start.ps1)"
    $script = "Add-Content -LiteralPath '$HostsFile' -Value ([Environment]::NewLine + '$line') -Encoding ASCII; ipconfig /flushdns | Out-Null"
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
    try { Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList "-NoProfile -EncodedCommand $encoded" }
    catch { Write-Host "Izin tidak diberikan ($($_.Exception.Message))." -ForegroundColor Yellow }
  }
  if (& $hasAlias) {
    Push-Location $Api
    try { $tls = (& $Py -m app.tls) | ConvertFrom-Json } finally { Pop-Location }
    $trusted = Get-ChildItem Cert:\CurrentUser\Root | Where-Object { $_.Thumbprint -eq $tls.ca_thumbprint }
    if (-not $trusted) {
      Write-Host "Memasang sertifikat khusus laptop ini (sekali saja). Klik 'Yes / Ya' pada 'Security Warning'." -ForegroundColor Yellow
      try { Import-Certificate -FilePath $tls.ca -CertStoreLocation Cert:\CurrentUser\Root | Out-Null }
      catch { Write-Host "Sertifikat tidak dipasang ($($_.Exception.Message))." -ForegroundColor Yellow }
      $trusted = Get-ChildItem Cert:\CurrentUser\Root | Where-Object { $_.Thumbprint -eq $tls.ca_thumbprint }
    }
    $UseHttps = [bool]$trusted
  }
  if (-not $UseHttps) { Write-Host "https tidak aktif; memakai http://relafun.localhost." -ForegroundColor Yellow }
}

# 6. Alamat
if ($UseHttps) {
  $Url = "https://relafun/"
  $Suffix = ""
} else {
  if ($Port -eq 0) { $Port = if (-not $busy80) { 80 } else { 8000 } }
  $Suffix = if ($Port -eq 80) { "" } else { ":$Port" }
  $Url = "http://relafun.localhost$Suffix/"
}

# 7. Alamat untuk HP di jaringan Wi-Fi yang sama
$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -ExpandProperty IPAddress
Write-Host ""
Write-Host "Buka di komputer ini : $Url" -ForegroundColor Green
foreach ($ip in $ips) { Write-Host "Buka dari HP (Wi-Fi sama): http://$ip$Suffix" -ForegroundColor Green }
Write-Host "Akun demo  siswa / siswa123   |   guru / guru123   |   kode kelas RF8A26"
Write-Host "Jangan tutup jendela ini selama aplikasi dipakai. Tekan Ctrl+C untuk berhenti."
Write-Host ""

if (-not $NoBrowser) { Start-Job -ScriptBlock { param($u) Start-Sleep 3; Start-Process $u } -ArgumentList $Url | Out-Null }

Push-Location $Api
try {
  if ($UseHttps) {
    & $Py -m app.serve --mode https
  } else {
    & $Py -m app.serve --mode localhost --port $Port
  }
} finally {
  Pop-Location
}
