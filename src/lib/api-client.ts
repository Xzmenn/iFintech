export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; details?: unknown }
    | T
    | null;
  if (!response.ok) {
    const error = payload as { error?: string; details?: unknown } | null;
    throw new ApiError(
      error?.error || "Permintaan tidak dapat diproses",
      response.status,
      error?.details,
    );
  }
  return payload as T;
}
