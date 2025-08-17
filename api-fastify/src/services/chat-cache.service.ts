import { cache } from './cache.service.js';

export class ChatCacheService {
  // Cache des réponses IA (évite de redemander la même chose)
  async getCachedResponse(input: string): Promise<string | null> {
    const key = `chat:response:${this.hashInput(input)}`;
    return await cache.get(key);
  }

  async setCachedResponse(input: string, response: string): Promise<void> {
    const key = `chat:response:${this.hashInput(input)}`;
    await cache.set(key, response, 3600); // 1 heure
  }

  // Historique de session
  async getSessionHistory(sessionId: string): Promise<any[]> {
    const key = `chat:session:${sessionId}`;
    return await cache.get(key) || [];
  }

  async addToSessionHistory(sessionId: string, message: any): Promise<void> {
    const key = `chat:session:${sessionId}`;
    const history = await this.getSessionHistory(sessionId);
    history.push(message);
    
    // Garder seulement les 20 derniers messages
    const trimmed = history.slice(-20);
    await cache.set(key, trimmed, 7200); // 2 heures
  }

  // Rate limiting
  async checkRateLimit(userId: string): Promise<boolean> {
    const key = `chat:rate:${userId}`;
    const count = await cache.get<number>(key) || 0;
    
    if (count >= 10) return false; // Max 10 messages/minute
    
    await cache.set(key, count + 1, 60); // 1 minute
    return true;
  }

  private hashInput(input: string): string {
    return Buffer.from(input.toLowerCase().trim()).toString('base64').slice(0, 16);
  }
}

export const chatCache = new ChatCacheService();