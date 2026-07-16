import { ApiError } from "./client";

interface RetryOptions {
  delayMs?: number;
  retries?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_DELAY_MS = 450;
const DEFAULT_RETRIES = 2;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function defaultShouldRetry(error: unknown) {
  if (!(error instanceof ApiError)) return true;
  return error.status === 429 || error.status >= 500;
}

export async function retryApiRequest<T>(
  operation: () => Promise<T>,
  {
    delayMs = DEFAULT_RETRY_DELAY_MS,
    retries = DEFAULT_RETRIES,
    shouldRetry = defaultShouldRetry,
  }: RetryOptions = {},
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !shouldRetry(error)) break;
      await wait(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}
