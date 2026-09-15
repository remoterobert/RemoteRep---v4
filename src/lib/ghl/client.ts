import {
  GHL_API_BASE,
  GHL_API_VERSION,
  isDryRun,
  type PipelineConfig,
} from "./config";

/**
 * Thin HTTP client for the GoHighLevel v2 API.
 *
 * Deliberately different from v3's version in three ways:
 *   1. Errors are thrown, not swallowed. v3 wrapped everything in
 *      `catch { console.error }`, so a failed sync looked identical to a
 *      successful one. Callers here record the failure against the user.
 *   2. Rate limits are respected. GHL allows ~500 requests per 10s per
 *      sub-account and returns 429 with a Retry-After header.
 *   3. Dry run short-circuits the actual fetch, so the whole code path can
 *      be exercised outside production.
 */

export class GhlError extends Error {
  readonly status: number;
  readonly body: string;
  constructor(status: number, body: string, context: string) {
    super(`GHL ${context} failed: HTTP ${status} ${body.slice(0, 300)}`);
    this.name = "GhlError";
    this.status = status;
    this.body = body;
  }
}

const MAX_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry on rate limits and transient server errors; fail fast on 4xx. */
function isRetryable(status: number): boolean {
  return status === 429 || status === 408 || status >= 500;
}

/**
 * How long to wait before retrying. Prefers the server's Retry-After
 * header, falling back to exponential backoff.
 */
function retryDelayMs(res: Response, attempt: number): number {
  const header = res.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (!Number.isNaN(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 10_000);
    }
  }
  return Math.min(500 * 2 ** (attempt - 1), 8_000);
}

export type GhlRequest = {
  config: PipelineConfig;
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Human-readable description used in error messages and dry-run logs. */
  context: string;
  /**
   * What to return instead of calling GHL during a dry run. Without this a
   * dry run stops at the first step that needs an id back, which would hide
   * the rest of the flow — including the opportunity payload carrying the
   * pipeline and stage ids, the part most worth eyeballing before go-live.
   */
  dryRunResult?: unknown;
};

/**
 * Perform one GHL v2 API call.
 *
 * Returns the parsed JSON body, or `null` in dry-run mode — callers must
 * handle a null result rather than assuming an id came back.
 */
export async function ghlFetch<T>({
  config,
  path,
  method = "GET",
  body,
  context,
  dryRunResult,
}: GhlRequest): Promise<T | null> {
  const url = `${GHL_API_BASE}${path}`;

  if (isDryRun()) {
    console.log("[ghl:dry-run]", {
      context,
      method,
      url,
      locationId: config.locationId,
      pipeline: config.pipeline,
      body: body ?? null,
    });
    return (dryRunResult as T | undefined) ?? null;
  }

  let lastError: GhlError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${config.token}`,
          Version: GHL_API_VERSION,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        // Never let a hung GHL request pin a serverless invocation open.
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      // Network-level failure (DNS, timeout, socket). Retry, then give up.
      lastError = new GhlError(0, String(err), context);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(Math.min(500 * 2 ** (attempt - 1), 8_000));
        continue;
      }
      throw lastError;
    }

    if (res.ok) {
      const text = await res.text();
      if (!text) return null;
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new GhlError(res.status, text, `${context} (invalid JSON)`);
      }
    }

    const text = await res.text().catch(() => "");
    lastError = new GhlError(res.status, text, context);

    if (isRetryable(res.status) && attempt < MAX_ATTEMPTS) {
      await sleep(retryDelayMs(res, attempt));
      continue;
    }
    throw lastError;
  }

  throw lastError ?? new GhlError(0, "exhausted retries", context);
}
