import { createClient, RedisClientType } from 'redis';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect() {
    if (this.isConnected) return;

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('Redis connecté');
    } catch (error) {
      console.warn('Redis non disponible, cache désactivé');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttl = 300): Promise<void> {
    if (!this.client || !this.isConnected) return;
    
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch {
      // Ignore cache errors
    }
  }

  async del(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch {
      // Ignore cache errors
    }
  }
}

export const cache = new CacheService();