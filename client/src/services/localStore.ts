// A minimal localStorage-backed "shared table" so the customer-facing
// order flow and the staff-facing queue/floor views agree on the same
// data within one browser session, without a backend. Every store built
// on top of this (orders, notifications) is read through services/api.ts
// first — the API is always tried before falling back here, exactly like
// the rest of the mock layer. Swap the api.ts fallbacks for real requests
// and these files can be deleted; nothing else references them directly.

export function readList<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T[]
    localStorage.setItem(key, JSON.stringify(seed))
    return seed
  } catch {
    return seed
  }
}

export function writeList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // ignore quota / privacy-mode errors — non-critical for a demo store
  }
}
