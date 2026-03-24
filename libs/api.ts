import type { ApiErrorPayload, ApiRequestOptions } from "@/libs/type";

const DEFAULT_API_BASE_URL = "https://swiftrev-api-44km.onrender.com";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  DEFAULT_API_BASE_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseJson<TResponse>(response: Response) {
  return (await response.json().catch(() => null)) as
    | TResponse
    | ApiErrorPayload
    | null;
}

function getErrorMessage(payload: ApiErrorPayload | null) {
  return payload?.message ?? payload?.error ?? "Request failed.";
}

export async function postJson<TResponse>(
  endpoint: string,
  body: Record<string, unknown>,
  options?: ApiRequestOptions,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: JSON.stringify(body),
  });

  const payload = await parseJson<TResponse>(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload as ApiErrorPayload | null),
      response.status,
    );
  }

  return (payload ?? {}) as TResponse;
}

export async function getJson<TResponse>(
  endpoint: string,
  options?: ApiRequestOptions,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      ...options?.headers,
    },
  });

  const payload = await parseJson<TResponse>(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload as ApiErrorPayload | null),
      response.status,
    );
  }

  return (payload ?? {}) as TResponse;
}

export { API_BASE_URL };
