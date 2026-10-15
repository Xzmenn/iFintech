export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (message = "Data tidak ditemukan") =>
  new AppError(404, message, "NOT_FOUND");
export const forbidden = (message = "Anda tidak memiliki akses") =>
  new AppError(403, message, "FORBIDDEN");
export const unauthorized = (message = "Silakan masuk untuk melanjutkan") =>
  new AppError(401, message, "UNAUTHORIZED");
export const badRequest = (message = "Permintaan tidak valid") =>
  new AppError(400, message, "BAD_REQUEST");
export const conflict = (message = "Data sudah digunakan") =>
  new AppError(409, message, "CONFLICT");
