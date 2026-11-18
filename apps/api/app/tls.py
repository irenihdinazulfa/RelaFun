"""Sertifikat HTTPS lokal untuk alamat https://relafun (khusus laptop ini).

Kenapa: browser hanya mengizinkan "pasang aplikasi" (PWA), service worker, dan mode luring di
alamat aman (https atau localhost). Alamat http://relafun ditandai "Tidak aman".

Cara aman yang dipakai:
- Dibuat CA lokal + sertifikat server untuk nama `relafun` (juga `localhost` dan 127.0.0.1).
- CA dibatasi NameConstraints hanya untuk nama-nama itu, dan kunci privat CA TIDAK PERNAH disimpan:
  setelah menandatangani sertifikat server, kunci CA dibuang. Jadi CA ini tidak bisa dipakai untuk
  menandatangani sertifikat situs lain.
- Yang dipasang ke penyimpanan "Trusted Root" pengguna Windows hanya sertifikat CA (bagian publik).
- Semua berkas ada di DATA_DIR/tls (folder data, tidak ikut ke GitHub).

Pemakaian: python -m app.tls  → membuat (bila perlu) dan mencetak lokasi berkas + sidik jari CA (JSON).
"""
from __future__ import annotations

import datetime as dt
import ipaddress
import json
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import ExtendedKeyUsageOID, NameOID

from . import config

HOST = "relafun"
CA_NAME = "RelaFun Local CA (khusus laptop ini)"
VALID_DAYS = 825
RENEW_BEFORE_DAYS = 30


def tls_dir() -> Path:
    return config.DATA_DIR / "tls"


def paths(folder: Path | None = None) -> tuple[Path, Path, Path]:
    d = folder or tls_dir()
    return d / "relafun.crt", d / "relafun.key", d / "relafun-ca.crt"


def _key_usage(**on: bool) -> x509.KeyUsage:
    names = ["digital_signature", "content_commitment", "key_encipherment", "data_encipherment",
             "key_agreement", "key_cert_sign", "crl_sign", "encipher_only", "decipher_only"]
    return x509.KeyUsage(**{n: on.get(n, False) for n in names})


def create(folder: Path | None = None, now: dt.datetime | None = None) -> tuple[Path, Path, Path]:
    """Buat CA lokal (kuncinya dibuang) dan sertifikat server untuk `relafun`."""
    d = folder or tls_dir()
    d.mkdir(parents=True, exist_ok=True)
    now = now or dt.datetime.now(dt.timezone.utc)
    start, end = now - dt.timedelta(days=1), now + dt.timedelta(days=VALID_DAYS)
    loopback = ipaddress.ip_address("127.0.0.1")

    ca_key = ec.generate_private_key(ec.SECP256R1())
    ca_name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, CA_NAME),
                         x509.NameAttribute(NameOID.ORGANIZATION_NAME, "RelaFun")])
    ca = (x509.CertificateBuilder()
          .subject_name(ca_name).issuer_name(ca_name).public_key(ca_key.public_key())
          .serial_number(x509.random_serial_number()).not_valid_before(start).not_valid_after(end)
          .add_extension(x509.BasicConstraints(ca=True, path_length=0), critical=True)
          .add_extension(_key_usage(key_cert_sign=True, crl_sign=True), critical=True)
          .add_extension(x509.NameConstraints(
              permitted_subtrees=[x509.DNSName(HOST), x509.DNSName("localhost"),
                                  x509.IPAddress(ipaddress.ip_network("127.0.0.1/32"))],
              excluded_subtrees=None), critical=True)
          .add_extension(x509.SubjectKeyIdentifier.from_public_key(ca_key.public_key()), critical=False)
          .sign(ca_key, hashes.SHA256()))

    key = ec.generate_private_key(ec.SECP256R1())
    leaf = (x509.CertificateBuilder()
            .subject_name(x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, HOST)]))
            .issuer_name(ca_name).public_key(key.public_key())
            .serial_number(x509.random_serial_number()).not_valid_before(start).not_valid_after(end)
            .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
            .add_extension(_key_usage(digital_signature=True), critical=True)
            .add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.SERVER_AUTH]), critical=False)
            .add_extension(x509.SubjectAlternativeName(
                [x509.DNSName(HOST), x509.DNSName("localhost"), x509.IPAddress(loopback)]), critical=False)
            .add_extension(x509.SubjectKeyIdentifier.from_public_key(key.public_key()), critical=False)
            .add_extension(x509.AuthorityKeyIdentifier.from_issuer_public_key(ca_key.public_key()), critical=False)
            .sign(ca_key, hashes.SHA256()))
    del ca_key  # kunci CA tidak pernah ditulis ke disk

    pem = serialization.Encoding.PEM
    crt, kp, cap = paths(d)
    crt.write_bytes(leaf.public_bytes(pem) + ca.public_bytes(pem))
    kp.write_bytes(key.private_bytes(pem, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    cap.write_bytes(ca.public_bytes(pem))
    return crt, kp, cap


def _usable(crt: Path, kp: Path, cap: Path, now: dt.datetime) -> bool:
    if not (crt.exists() and kp.exists() and cap.exists()):
        return False
    try:
        leaf = x509.load_pem_x509_certificate(crt.read_bytes())
        san = leaf.extensions.get_extension_for_class(x509.SubjectAlternativeName).value
    except (ValueError, x509.ExtensionNotFound):
        return False
    return HOST in san.get_values_for_type(x509.DNSName) and \
        leaf.not_valid_after_utc - now > dt.timedelta(days=RENEW_BEFORE_DAYS)


def ensure(folder: Path | None = None, now: dt.datetime | None = None) -> tuple[Path, Path, Path]:
    """Pakai sertifikat yang ada bila masih berlaku > 30 hari; selain itu buat baru."""
    now = now or dt.datetime.now(dt.timezone.utc)
    crt, kp, cap = paths(folder)
    if _usable(crt, kp, cap, now):
        return crt, kp, cap
    return create(folder, now)


def ca_thumbprint(cap: Path) -> str:
    """Sidik jari SHA-1 (format Windows: heksadesimal huruf besar) untuk memeriksa Cert:\\CurrentUser\\Root."""
    return x509.load_pem_x509_certificate(cap.read_bytes()).fingerprint(hashes.SHA1()).hex().upper()


if __name__ == "__main__":
    crt, kp, cap = ensure()
    print(json.dumps({"cert": str(crt), "key": str(kp), "ca": str(cap), "ca_thumbprint": ca_thumbprint(cap)}))
