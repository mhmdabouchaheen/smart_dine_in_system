type FetcherFn<T> = () => Promise<T>;

interface CoalescerOptions {
  cacheTTL?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class RequestCoalescer {
  private inFlight = new Map<string, Promise<any>>();
  private cache = new Map<string, CacheEntry<any>>();

  public async execute<T>(
    key: string,
    fetcher: FetcherFn<T>,
    options: CoalescerOptions = { cacheTTL: 0 }
  ): Promise<T> {
    if (options.cacheTTL && options.cacheTTL > 0) {
      const cached = this.cache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value as T;
      }
    }

    const existingPromise = this.inFlight.get(key);
    if (existingPromise) return existingPromise as Promise<T>;

    const executionPromise = fetcher()
      .then((result) => {
        if (options.cacheTTL && options.cacheTTL > 0) {
          this.cache.set(key, { value: result, expiresAt: Date.now() + options.cacheTTL });
        }
        return result;
      })
      .finally(() => this.inFlight.delete(key));

    this.inFlight.set(key, executionPromise);
    return executionPromise;
  }

  public invalidate(key: string): void {
    this.cache.delete(key);
  }
}

export const globalCoalescer = new RequestCoalescer();