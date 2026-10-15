export function parseMoney(value: string | number) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = value.replace(/[^\d-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeMoney(value: string | number) {
  return Math.max(0, parseMoney(value));
}

export function toNumber(value: number | string | { toNumber: () => number } | null | undefined) {
  if (value == null) return 0;
  if (typeof value === "object") return value.toNumber();
  return Number(value);
}
