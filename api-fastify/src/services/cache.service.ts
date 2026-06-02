import { createClient, RedisClientType } from 'redis';

class CacheService {
  private client: RedisClientType | null = null;
  private connectPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;
    this.connectPromise = this._connect();
    return this.connectPromise;
  }

  private async _connect(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });
      await this.client.connect();
    } catch {
      this.client = null;
      this.connectPromise = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const data = await this.client.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttl = 300): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch {
      // ignore cache errors
    }
  }

  // Utilise SCAN au lieu de KEYS pour ne pas bloquer Redis en production
  async del(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys: string[] = [];
      for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        keys.push(key.toString());
      }
      if (keys.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (this.client as any).del(keys);
      }
    } catch {
      // ignore cache errors
    }
  }
}

export const cache = new CacheService();