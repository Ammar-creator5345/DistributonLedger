import type { ApiResult } from "@/types";

export class ApiClientError extends Error {
  fieldErrors?: Record<string, string[] | undefined>;
  constructor(message: string, fieldErrors?: Record<string, string[] | undefined>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

/** Thin wrapper around fetch for our own JSON API routes — unwraps {success, data|error}. */
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json()) as ApiResult<T>;
  if (!body.success) {
    throw new ApiClientError(body.error, body.fieldErrors);
  }
  return body.data;
}

export function apiGet<T>(url: string) {
  return apiFetch<T>(url);
}

export function apiPost<T>(url: string, data: unknown) {
  return apiFetch<T>(url, { method: "POST", body: JSON.stringify(data) });
}

export function apiPatch<T>(url: string, data: unknown) {
  return apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(data) });
}

export function apiPut<T>(url: string, data: unknown) {
  return apiFetch<T>(url, { method: "PUT", body: JSON.stringify(data) });
}

export function apiDelete<T>(url: string) {
  return apiFetch<T>(url, { method: "DELETE" });
}
