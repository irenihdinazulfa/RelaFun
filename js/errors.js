// Galat API yang dipakai bersama oleh mode server dan mode tanpa server.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
