import { Redis } from '@upstash/redis';
import { env } from '../config/env.js';

interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

class InMemoryCache implements CacheAdapter {
  private readonly store = new Map<string, { value: unknown; expiresAt: number | null }>();

  public async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) {
      return null;
    }

    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  public async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class UpstashCache implements CacheAdapter {
  private readonly client = new Redis({
    url: env.UPSTASH_REDIS_URL!,
    token: env.UPSTASH_REDIS_TOKEN!,
  });

  public async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get<T>(key);
    return value ?? null;
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { ex: ttlSeconds });
      return;
    }

    await this.client.set(key, value);
  }

  public async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}

export const cacheService: CacheAdapter =
  env.UPSTASH_REDIS_URL && env.UPSTASH_REDIS_TOKEN ? new UpstashCache() : new InMemoryCache();
