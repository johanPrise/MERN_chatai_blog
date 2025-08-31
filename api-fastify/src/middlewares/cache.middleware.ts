import { FastifyRequest, FastifyReply } from 'fastify';
import { cache } from '../services/cache.service.js';

export const cacheMiddleware = (ttl = 300) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method !== 'GET') return;

    const cacheKey = `cache:${request.url}`;
    const cachedData = await cache.get(cacheKey);

    if (cachedData) {
      reply.header('X-Cache', 'HIT');
      return reply.send(cachedData);
    }

    const originalSend = reply.send;
    reply.send = function(payload: any) {
      if (reply.statusCode === 200) {
        cache.set(cacheKey, payload, ttl);
        reply.header('X-Cache', 'MISS');
      }
      return originalSend.call(this, payload);
    };
  };
};