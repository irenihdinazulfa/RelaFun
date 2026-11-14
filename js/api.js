import { session } from "./store.js";
import { ApiError } from "./errors.js";

export { ApiError };

// Mode tanpa server (GitHub Pages): config.js menyetel window.RELAFUN_STATIC = true,
// sehingga semua permintaan /api/* dilayani oleh js/local/backend.js di peramban.
export const STATIC = window.RELAFUN_STATIC === true;
let localBackend = null;
const local = async () => {
  if (!localBackend) localBackend = await import("./local/backend.js");
  return localBackend;
};

function onUnauthorized(token) {
  if (token) {
    session.clear();
    location.hash = "#/masuk";
  }
}

async function request(method, path, body) {
  const token = session.token;
  if (STATIC) {
    try {
      return await (await local()).handle(method, path, body ?? {}, token);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) onUnauthorized(token);
      if (e instanceof ApiError) throw e;
      throw new ApiError(`Terjadi kesalahan: ${e.message || e}`, 500);
    }
  }
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res;
  try {
    res = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server. Periksa koneksi internet.", 0);
  }
  if (res.status === 401) onUnauthorized(token);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.detail;
    if (Array.isArray(msg)) msg = "Isian belum lengkap atau formatnya belum sesuai.";
    throw new ApiError(msg || `Terjadi kesalahan (${res.status}).`, res.status);
  }
  return data;
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b = {}) => request("POST", p, b),
  patch: (p, b = {}) => request("PATCH", p, b),

  /** Unduh berkas (mis. CSV) dengan token. */
  async download(path, filename) {
    if (STATIC) {
      const text = await request("GET", path);
      saveBlob(new Blob([text], { type: "text/csv;charset=utf-8" }), filename);
      return;
    }
    const res = await fetch(path, { headers: { Authorization: `Bearer ${session.token}` } });
    if (!res.ok) throw new ApiError("Gagal mengunduh berkas.", res.status);
    saveBlob(await res.blob(), filename);
  },
};
