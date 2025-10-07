/**
 * Advanced Caching System
 * Implements multiple caching strategies for optimal performance
 */

interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  strategy: 'lru' | 'fifo' | 'lfu';
  persist: boolean;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private totalSize = 0;
  private accessOrder: string[] = [];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100,
      ttl: 5 * 60 * 1000, // 5 minutes
      strategy: 'lru',
      persist: false,
      ...config
    };

    // Load from localStorage if persistence is enabled
    if (this.config.persist) {
      this.loadFromStorage();
    }

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), this.config.ttl / 2);
  }

  set(key: string, value: T): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.calculateSize(value)
    };

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.remove(key);
    }

    // Check if we need to evict entries
    while (this.totalSize + entry.size > this.config.maxSize && this.cache.size > 0) {
      this.evict();
    }

    this.cache.set(key, entry);
    this.totalSize += entry.size;
    this.updateAccessOrder(key);

    // Persist to localStorage if enabled
    if (this.config.persist) {
      this.saveToStorage();
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.remove(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  remove(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.totalSize -= entry.size;
    this.removeFromAccessOrder(key);

    if (this.config.persist) {
      this.saveToStorage();
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
    this.accessOrder = [];

    if (this.config.persist) {
      localStorage.removeItem(this.getStorageKey());
    }
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): {
    size: number;
    totalSize: number;
    hitRate: number;
    entries: Array<{ key: string; size: number; accessCount: number; age: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: entry.size,
      accessCount: entry.accessCount,
      age: Date.now() - entry.timestamp
    }));

    return {
      size: this.cache.size,
      totalSize: this.totalSize,
      hitRate: this.calculateHitRate(),
      entries
    };
  }

  private evict(): void {
    let keyToEvict: string | null = null;

    switch (this.config.strategy) {
      case 'lru':
        keyToEvict = this.accessOrder[0]; // Least recently used
        break;
      case 'fifo':
        keyToEvict = this.accessOrder[0]; // First in, first out
        break;
      case 'lfu':
        // Find least frequently used
        let minAccessCount = Infinity;
        for (const [key, entry] of this.cache.entries()) {
          if (entry.accessCount < minAccessCount) {
            minAccessCount = entry.accessCount;
            keyToEvict = key;
          }
        }
        break;
    }

    if (keyToEvict) {
      this.remove(keyToEvict);
    }
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.remove(key));
  }

  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate
    } catch {
      return 100; // Default size if serialization fails
    }
  }

  private calculateHitRate(): number {
    // This would need to be tracked over time for accurate hit rate
    return 0.85; // Placeholder
  }

  private getStorageKey(): string {
    return `advanced_cache_${this.constructor.name}`;
  }

  private saveToStorage(): void {
    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        accessOrder: this.accessOrder,
        totalSize: this.totalSize
      };
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (data) {
        const parsed = JSON.parse(data);
        this.cache = new Map(parsed.entries);
        this.accessOrder = parsed.accessOrder;
        this.totalSize = parsed.totalSize;
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }
}

// Specialized cache instances
export const apiCache = new AdvancedCache<any>({
  maxSize: 50,
  ttl: 10 * 60 * 1000, // 10 minutes
  strategy: 'lru',
  persist: true
});

export const userCache = new AdvancedCache<any>({
  maxSize: 20,
  ttl: 30 * 60 * 1000, // 30 minutes
  strategy: 'lru',
  persist: true
});

export const imageCache = new AdvancedCache<string>({
  maxSize: 100,
  ttl: 60 * 60 * 1000, // 1 hour
  strategy: 'lru',
  persist: false
});

export const componentCache = new AdvancedCache<React.ComponentType<any>>({
  maxSize: 30,
  ttl: 15 * 60 * 1000, // 15 minutes
  strategy: 'lru',
  persist: false
});

// Cache utilities
export const cacheUtils = {
  // Preload data into cache
  preload: async <T>(key: string, fetcher: () => Promise<T>, cache: AdvancedCache<T>): Promise<T> => {
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    const data = await fetcher();
    cache.set(key, data);
    return data;
  },

  // Batch cache operations
  batchSet: <T>(entries: Array<{ key: string; value: T }>, cache: AdvancedCache<T>): void => {
    entries.forEach(({ key, value }) => cache.set(key, value));
  },

  // Cache warming
  warmCache: async <T>(
    keys: string[],
    fetcher: (key: string) => Promise<T>,
    cache: AdvancedCache<T>
  ): Promise<void> => {
    const promises = keys.map(async (key) => {
      if (!cache.has(key)) {
        const value = await fetcher(key);
        cache.set(key, value);
      }
    });

    await Promise.all(promises);
  },

  // Cache invalidation patterns
  invalidatePattern: (pattern: RegExp, cache: AdvancedCache<any>): void => {
    const keysToRemove: string[] = [];
    for (const key of cache['cache'].keys()) {
      if (pattern.test(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => cache.remove(key));
  },

  // Cache statistics
  getCacheStats: () => ({
    api: apiCache.getStats(),
    user: userCache.getStats(),
    image: imageCache.getStats(),
    component: componentCache.getStats()
  })
};

export { AdvancedCache };
export type { CacheConfig, CacheEntry };
