export type Serialized<T> = T extends { toNumber: () => number }
  ? number
  : T extends Date
    ? Date
    : T extends readonly (infer Value)[]
      ? Serialized<Value>[]
      : T extends object
        ? { [Key in keyof T]: Serialized<T[Key]> }
        : T;

export function serialize<T>(value: T): Serialized<T> {
  if (value === null || value === undefined || typeof value !== "object") {
    return value as Serialized<T>;
  }
  if (value instanceof Date) return value as Serialized<T>;
  if ("toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber() as Serialized<T>;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serialize(item)) as Serialized<T>;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, serialize(item)]),
  ) as Serialized<T>;
}
