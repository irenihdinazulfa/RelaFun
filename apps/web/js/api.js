import { session } from "./store.js";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  const headers = { Accept: "application/json" };
  const token = session.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res;
  try {
    res = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server. Periksa koneksi internet.", 0);
  }
  if (res.status === 401 && token) {
    session.clear();
    location.hash = "#/masuk";
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.detail;
    if (Array.isArray(msg)) msg = "Isian belum lengkap atau formatnya belum sesuai.";
    throw new ApiError(msg || `Terjadi kesalahan (${res.status}).`, res.status);
  }
  return data;
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b = {}) => request("POST", p, b),
  patch: (p, b = {}) => request("PATCH", p, b),

  /** Unduh berkas (mis. CSV) dengan token. */
  async download(path, filename) {
    const res = await fetch(path, { headers: { Authorization: `Bearer ${session.token}` } });
    if (!res.ok) throw new ApiError("Gagal mengunduh berkas.", res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
};
