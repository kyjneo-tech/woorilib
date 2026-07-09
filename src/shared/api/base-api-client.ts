/**
 * Base API Client
 * Provides standardized fetch with retry logic, timeout, and error handling.
 */

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export abstract class BaseApiClient {
  protected abstract baseUrl: string;

  protected async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, timeout = 10000, retries = 3 } = options;

    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          console.warn(`[BaseApi] 429 Rate Limited. Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        if (!response.ok) {
          throw new Error(`API Error [${response.status}]: ${response.statusText}`);
        }

        return await response.json() as T;
      } catch (error: any) {
        lastError = error;
        if (error.name === 'AbortError') {
          console.warn(`[BaseApi] Request timeout for ${endpoint}`);
        }
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new Error(`Failed to fetch ${endpoint} after ${retries} retries`);
  }
}
