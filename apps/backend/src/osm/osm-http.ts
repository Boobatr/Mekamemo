/**
 * Shared plumbing for the free OpenStreetMap-ecosystem services (Nominatim, Overpass,
 * Zippopotam). Their public servers are run on donations, so the usage policies ask
 * every client to identify itself and to stay under one request per second.
 */
export const OSM_USER_AGENT =
  process.env.OSM_USER_AGENT || 'MekaMemo/1.0 (https://mekamemo-mobile.vercel.app)';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Runs jobs strictly one after another, at least `minGapMs` apart. */
export class RateLimiter {
  private tail: Promise<unknown> = Promise.resolve();
  private lastStart = 0;

  constructor(public minGapMs: number) {}

  run<T>(job: () => Promise<T>): Promise<T> {
    const result = this.tail.then(async () => {
      const wait = this.lastStart + this.minGapMs - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastStart = Date.now();
      return job();
    });
    this.tail = result.catch(() => undefined);
    return result;
  }
}

/** Nominatim's policy: an absolute maximum of 1 request per second, across the whole app. */
export const nominatimLimiter = new RateLimiter(1100);

export interface FetchJsonOptions {
  method?: 'GET' | 'POST';
  body?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    body: options.body,
    headers: { 'User-Agent': OSM_USER_AGENT, Accept: 'application/json', ...options.headers },
    signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
  });
  if (!response.ok) throw new Error(`${new URL(url).host} responded ${response.status}`);
  return (await response.json()) as T;
}
