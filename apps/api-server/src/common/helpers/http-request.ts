export interface HttpRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export interface HttpJsonRequestOptions extends HttpRequestOptions {
  requireOk?: boolean;
  errorContext?: string;
}

export async function httpRequest(
  url: string | URL,
  { timeoutMs, ...init }: HttpRequestOptions = {}
): Promise<Response> {
  if (!timeoutMs || timeoutMs <= 0) {
    return fetch(url, init);
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  try {
    const signal = init.signal
      ? AbortSignal.any([init.signal, timeoutController.signal])
      : timeoutController.signal;

    return await fetch(url, { ...init, signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function httpRequestJson<T = unknown>(
  url: string | URL,
  { requireOk = true, errorContext = 'HTTP', ...init }: HttpJsonRequestOptions = {}
): Promise<T> {
  const res = await httpRequest(url, init);

  if (requireOk && !res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(
      `${errorContext} request failed (${res.status} ${res.statusText})${errorBody ? `: ${errorBody.slice(0, 200)}` : ''}`
    );
  }

  return (await res.json()) as T;
}
