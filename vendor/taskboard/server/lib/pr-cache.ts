export interface PRData {
  title: string
  state: string
  author: string
  created_at: string
}

export interface PRCacheEntry {
  data: PRData
  expiresAt: number
}

const cache = new Map<string, PRCacheEntry>()

export function getCached(prUrl: string): PRData | null {
  const entry = cache.get(prUrl)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(prUrl)
    return null
  }
  return entry.data
}

export function setCached(prUrl: string, data: PRData): void {
  cache.set(prUrl, { data, expiresAt: Date.now() + 5 * 60 * 1000 })
}
