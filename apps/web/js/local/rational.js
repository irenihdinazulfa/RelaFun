// Bilangan rasional eksak (BigInt) — padanan sympy.Rational untuk mode tanpa server.

const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

export class Q {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (d === 0n) throw new RangeError("pembagian dengan nol");
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }

  static of(x) {
    if (x instanceof Q) return x;
    if (typeof x === "bigint") return new Q(x);
    if (typeof x === "number") {
      if (!Number.isFinite(x)) throw new RangeError("angka tidak valid");
      if (Number.isInteger(x)) return new Q(BigInt(x));
    }
    return Q.parseDecimal(String(x));
  }

  /** "3.5" → 7/2 ; "-12" → -12 ; juga menangani notasi 1e-7 dari Number. */
  static parseDecimal(s) {
    s = String(s).trim();
    const m = /^([+-]?)(\d*)(?:\.(\d+))?$/.exec(s);
    if (!m || (m[2] === "" && !m[3])) {
      const num = Number(s);
      if (!Number.isFinite(num)) throw new RangeError("bukan angka");
      return Q.parseDecimal(num.toFixed(12).replace(/0+$/, "").replace(/\.$/, ""));
    }
    const [, sign, ip, fp = ""] = m;
    const n = BigInt((ip || "0") + fp) * (sign === "-" ? -1n : 1n);
    return new Q(n, 10n ** BigInt(fp.length));
  }

  add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Q.of(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) {
    o = Q.of(o);
    if (o.n === 0n) throw new RangeError("pembagian dengan nol");
    return new Q(this.n * o.d, this.d * o.n);
  }
  neg() { return new Q(-this.n, this.d); }
  abs() { return this.n < 0n ? this.neg() : this; }
  pow(k) { let r = new Q(1n); for (let i = 0; i < k; i++) r = r.mul(this); return r; }
  cmp(o) { o = Q.of(o); const l = this.n * o.d, r = o.n * this.d; return l < r ? -1 : l > r ? 1 : 0; }
  eq(o) { return this.cmp(o) === 0; }
  lt(o) { return this.cmp(o) < 0; }
  le(o) { return this.cmp(o) <= 0; }
  gt(o) { return this.cmp(o) > 0; }
  ge(o) { return this.cmp(o) >= 0; }
  isZero() { return this.n === 0n; }
  isInt() { return this.d === 1n; }
  isNeg() { return this.n < 0n; }
  toNumber() { return Number(this.n) / Number(this.d); }
  floor() {
    let q = this.n / this.d;
    if (this.n < 0n && q * this.d !== this.n) q -= 1n;
    return new Q(q);
  }
  ceil() {
    let q = this.n / this.d;
    if (this.n > 0n && q * this.d !== this.n) q += 1n;
    return new Q(q);
  }
  /** Penyebut hanya berfaktor 2 dan 5 → desimalnya berhenti. */
  terminates() {
    let d = this.d;
    for (const p of [2n, 5n]) while (d % p === 0n) d /= p;
    return d === 1n;
  }
}

export const ZERO = new Q(0n);
export const ONE = new Q(1n);
