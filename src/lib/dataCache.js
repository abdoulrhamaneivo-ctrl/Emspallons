const CACHE_PREFIX = 'emsp_cache_v1:'
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

const memoryCache = new Map()

export const CACHE_KEYS = {
  STUDENTS: 'students',
  PAYMENTS: 'payments',
  SCANS: 'scans',
}

const getStorage = () => {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

const buildKey = (key) => `${CACHE_PREFIX}${key}`

export function setCache(key, data, ttl = DEFAULT_TTL) {
  const entry = {
    data,
    timestamp: Date.now(),
    ttl,
  }
  memoryCache.set(key, entry)

  const storage = getStorage()
  if (storage) {
    try {
      storage.setItem(buildKey(key), JSON.stringify(entry))
    } catch {
      // Ignore quota errors
    }
  }
}

export function getCache(key, ttl = DEFAULT_TTL) {
  const now = Date.now()
  const entry = memoryCache.get(key)
  if (entry && now - entry.timestamp < (entry.ttl || ttl)) {
    return entry.data
  }

  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(buildKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.data || !parsed?.timestamp) {
      storage.removeItem(buildKey(key))
      return null
    }
    const effectiveTtl = parsed.ttl || ttl
    if (now - parsed.timestamp > effectiveTtl) {
      storage.removeItem(buildKey(key))
      return null
    }
    memoryCache.set(key, parsed)
    return parsed.data
  } catch {
    storage.removeItem(buildKey(key))
    return null
  }
}

export function clearCache(key) {
  memoryCache.delete(key)
  const storage = getStorage()
  if (storage) {
    storage.removeItem(buildKey(key))
  }
}


