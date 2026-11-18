"""Sertifikat lokal https://relafun dan pengalihan http → https (app/tls.py, app/serve.py)."""
import asyncio
import datetime as dt

from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

from app import tls
from app.serve import redirect_host_to_https


def _load(path):
    return x509.load_pem_x509_certificates(path.read_bytes())


def test_certificate_for_relafun_signed_by_constrained_ca(tmp_path):
    crt, key, ca_path = tls.create(tmp_path)
    leaf, chain_ca = _load(crt)
    (ca,) = _load(ca_path)
    assert chain_ca == ca
    san = leaf.extensions.get_extension_for_class(x509.SubjectAlternativeName).value
    assert "relafun" in san.get_values_for_type(x509.DNSName)
    assert leaf.issuer == ca.subject
    ca.public_key().verify(leaf.signature, leaf.tbs_certificate_bytes, ec.ECDSA(leaf.signature_hash_algorithm))
    eku = leaf.extensions.get_extension_for_class(x509.ExtendedKeyUsage).value
    assert x509.oid.ExtendedKeyUsageOID.SERVER_AUTH in eku
    assert leaf.extensions.get_extension_for_class(x509.BasicConstraints).value.ca is False
    # CA hanya boleh untuk relafun/localhost/127.0.0.1 dan tidak bisa membuat CA turunan
    bc = ca.extensions.get_extension_for_class(x509.BasicConstraints).value
    assert bc.ca is True and bc.path_length == 0
    nc = ca.extensions.get_extension_for_class(x509.NameConstraints)
    assert nc.critical is True
    permitted = {getattr(n, "value", None) for n in nc.value.permitted_subtrees}
    assert "relafun" in permitted and "localhost" in permitted
    # kunci server cocok dengan sertifikatnya
    pk = serialization.load_pem_private_key(key.read_bytes(), password=None)
    assert pk.public_key().public_numbers() == leaf.public_key().public_numbers()


def test_ca_private_key_is_never_written(tmp_path):
    tls.create(tmp_path)
    assert sorted(p.name for p in tmp_path.iterdir()) == ["relafun-ca.crt", "relafun.crt", "relafun.key"]
    assert b"PRIVATE KEY" not in (tmp_path / "relafun-ca.crt").read_bytes()
    assert b"PRIVATE KEY" not in (tmp_path / "relafun.crt").read_bytes()
    assert (tmp_path / "relafun.key").read_bytes().count(b"BEGIN PRIVATE KEY") == 1


def test_ensure_reuses_valid_and_renews_expiring(tmp_path):
    first = tls.ensure(tmp_path)
    thumb = tls.ca_thumbprint(first[2])
    assert tls.ca_thumbprint(tls.ensure(tmp_path)[2]) == thumb          # masih berlaku → dipakai lagi
    later = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=tls.VALID_DAYS - 10)
    assert tls.ca_thumbprint(tls.ensure(tmp_path, now=later)[2]) != thumb  # hampir habis → dibuat baru
    assert len(thumb) == 40 and thumb == thumb.upper()


def _call(asgi, host, path="/api/health", qs=b""):
    sent, seen = [], []

    async def inner(scope, receive, send):
        seen.append(scope["path"])
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b"ok"})

    async def send(msg):
        sent.append(msg)

    async def receive():
        return {"type": "http.request", "body": b""}

    wrapped = asgi(inner)
    scope = {"type": "http", "path": path, "raw_path": path.encode(), "query_string": qs,
             "headers": [(b"host", host.encode())]}
    asyncio.run(wrapped(scope, receive, send))
    return sent, seen


def test_http_relafun_redirects_to_https():
    sent, seen = _call(redirect_host_to_https, "relafun", "/api/health", b"a=1")
    assert sent[0]["status"] == 308 and not seen
    assert dict(sent[0]["headers"])[b"location"] == b"https://relafun/api/health?a=1"
    sent, _ = _call(redirect_host_to_https, "RelaFun:80", "/")
    assert dict(sent[0]["headers"])[b"location"] == b"https://relafun/"


def test_other_hosts_are_served_over_http():
    # HP di Wi-Fi yang sama membuka lewat IP laptop → tidak dialihkan
    sent, seen = _call(redirect_host_to_https, "192.168.1.33", "/api/health")
    assert sent[0]["status"] == 200 and seen == ["/api/health"]
