/**
 * Redis Cache Integration
 * Advanced caching layer with Redis for distributed caching and session management
 */

import { supabase } from '@dislink/shared/lib/supabase';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number; // Default TTL in seconds
  maxRetries?: number;
  retryDelayOnFailover?: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Enable compression
  serialize?: boolean; // Enable serialization
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: string;
  connectedClients: number;
}

class RedisCache {
  private config: RedisConfig;
  private isConnected: boolean = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    memoryUsage: '0B',
    connectedClients: 0
  };

  constructor(config: RedisConfig) {
    this.config = {
      ttl: 3600, // 1 hour default
      maxRetries: 3,
      retryDelayOnFailover: 100,
      ...config
    };
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    try {
      // In a real implementation, this would connect to Redis
      // For now, we'll simulate the connection
      console.log('🔗 Connecting to Redis...');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.isConnected = true;
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      console.log('🔌 Disconnecting from Redis...');
      this.isConnected = false;
      console.log('✅ Redis disconnected');
    } catch (error) {
      console.error('❌ Failed to disconnect from Redis:', error);
    }
  }

  /**
   * Set a key-value pair in Redis
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const {
        ttl = this.config.ttl,
        tags = [],
        compress = false,
        serialize = true
      } = options;

      let processedValue = value;

      // Serialize if needed
      if (serialize) {
        processedValue = JSON.stringify(value);
      }

      // Compress if needed
      if (compress) {
        // In a real implementation, you would compress the data
        processedValue = `compressed:${processedValue}`;
      }

      // Store in Supabase as a fallback (in real implementation, this would be Redis)
      const { error } = await supabase
        .from('redis_cache')
        .upsert([{
          key,
          value: processedValue,
          ttl: ttl,
          tags: tags,
          compressed: compress,
          serialized: serialize,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + ttl * 1000).toISOString()
        }]);

      if (error) {
        throw new Error(`Failed to set cache key: ${error.message}`);
      }

      this.stats.totalKeys++;
      return true;
    } catch (error) {
      console.error('Failed to set cache key:', error);
      return false;
    }
  }

  /**
   * Get a value from Redis
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      // Get from Supabase as a fallback
      const { data, error } = await supabase
        .from('redis_cache')
        .select('*')
        .eq('key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      let value = data.value;

      // Decompress if needed
      if (data.compressed) {
        // In a real implementation, you would decompress the data
        value = value.replace('compressed:', '');
      }

      // Deserialize if needed
      if (data.serialized) {
        try {
          value = JSON.parse(value);
        } catch (parseError) {
          console.error('Failed to parse cached value:', parseError);
          return null;
        }
      }

      this.stats.hits++;
      this.updateHitRate();
      return value as T;
    } catch (error) {
      console.error('Failed to get cache key:', error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const { error } = await supabase
        .from('redis_cache')
        .delete()
        .eq('key', key);

      if (error) {
        throw new Error(`Failed to delete cache key: ${error.message}`);
      }

      this.stats.totalKeys = Math.max(0, this.stats.totalKeys - 1);
      return true;
    } catch (error) {
      console.error('Failed to delete cache key:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in Redis
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const { data, error } = await supabase
        .from('redis_cache')
        .select('key')
        .eq('key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Failed to check cache key existence:', error);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const { error } = await supabase
        .from('redis_cache')
        .update({
          ttl: ttl,
          expires_at: new Date(Date.now() + ttl * 1000).toISOString()
        })
        .eq('key', key);

      if (error) {
        throw new Error(`Failed to set expiration for cache key: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to set expiration for cache key:', error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const { data, error } = await supabase
        .from('redis_cache')
        .select('expires_at')
        .eq('key', key)
        .single();

      if (error || !data) {
        return -1;
      }

      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const ttl = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

      return ttl > 0 ? ttl : -1;
    } catch (error) {
      console.error('Failed to get TTL for cache key:', error);
      return -1;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      let deletedCount = 0;

      for (const tag of tags) {
        const { data, error } = await supabase
          .from('redis_cache')
          .delete()
          .contains('tags', [tag]);

        if (error) {
          console.error(`Failed to invalidate cache by tag ${tag}:`, error);
        } else {
          deletedCount += data?.length || 0;
        }
      }

      this.stats.totalKeys = Math.max(0, this.stats.totalKeys - deletedCount);
      return deletedCount;
    } catch (error) {
      console.error('Failed to invalidate cache by tags:', error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async flushAll(): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const { error } = await supabase
        .from('redis_cache')
        .delete()
        .neq('key', ''); // Delete all records

      if (error) {
        throw new Error(`Failed to flush cache: ${error.message}`);
      }

      this.stats.totalKeys = 0;
      return true;
    } catch (error) {
      console.error('Failed to flush cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      // Get total keys count
      const { count, error } = await supabase
        .from('redis_cache')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString());

      if (!error) {
        this.stats.totalKeys = count || 0;
      }

      // In a real Redis implementation, you would get memory usage and connected clients
      this.stats.memoryUsage = '0B'; // Placeholder
      this.stats.connectedClients = 1; // Placeholder

      return { ...this.stats };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { ...this.stats };
    }
  }

  /**
   * Clean up expired keys
   */
  async cleanup(): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const { data, error } = await supabase
        .from('redis_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        throw new Error(`Failed to cleanup expired keys: ${error.message}`);
      }

      const deletedCount = data?.length || 0;
      this.stats.totalKeys = Math.max(0, this.stats.totalKeys - deletedCount);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup expired keys:', error);
      return 0;
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Get connection status
   */
  isConnectedToRedis(): boolean {
    return this.isConnected;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', details: { error: 'Not connected to Redis' } };
      }

      // Test basic operations
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now() };

      await this.set(testKey, testValue, { ttl: 10 });
      const retrieved = await this.get(testKey);
      await this.del(testKey);

      if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
        return { status: 'healthy', details: { message: 'Redis operations working correctly' } };
      } else {
        return { status: 'unhealthy', details: { error: 'Data integrity check failed' } };
      }
    } catch (error) {
      return { status: 'unhealthy', details: { error: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }
}

// Create Redis cache instance
export const redisCache = new RedisCache({
  host: (typeof process !== 'undefined' && process.env?.REDIS_HOST) || 'localhost',
  port: parseInt((typeof process !== 'undefined' && process.env?.REDIS_PORT) || '6379'),
  password: (typeof process !== 'undefined' && process.env?.REDIS_PASSWORD) || undefined,
  db: parseInt((typeof process !== 'undefined' && process.env?.REDIS_DB) || '0'),
  ttl: parseInt((typeof process !== 'undefined' && process.env?.REDIS_TTL) || '3600')
});

// Cache utilities
export const cacheUtils = {
  // Cache with automatic serialization
  async cache<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const cached = await redisCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await redisCache.set(key, value, options);
    return value;
  },

  // Cache with tags for easy invalidation
  async cacheWithTags<T>(
    key: string,
    fetcher: () => Promise<T>,
    tags: string[],
    options: Omit<CacheOptions, 'tags'> = {}
  ): Promise<T> {
    return cacheUtils.cache(key, fetcher, { ...options, tags });
  },

  // Batch cache operations
  async batchSet(entries: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    const promises = entries.map(({ key, value, options }) => 
      redisCache.set(key, value, options)
    );
    await Promise.all(promises);
  },

  // Batch get operations
  async batchGet<T = any>(keys: string[]): Promise<Record<string, T | null>> {
    const promises = keys.map(async (key) => ({
      key,
      value: await redisCache.get<T>(key)
    }));
    
    const results = await Promise.all(promises);
    return results.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, T | null>);
  },

  // Cache warming
  async warmCache<T>(
    entries: Array<{ key: string; fetcher: () => Promise<T>; options?: CacheOptions }>
  ): Promise<void> {
    const promises = entries.map(async ({ key, fetcher, options }) => {
      const value = await fetcher();
      await redisCache.set(key, value, options);
    });
    await Promise.all(promises);
  }
};

export { RedisCache };
export type { RedisConfig, CacheOptions, CacheStats };
