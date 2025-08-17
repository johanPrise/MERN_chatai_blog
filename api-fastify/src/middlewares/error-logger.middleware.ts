import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../services/logger.service.js';

export const errorLoggerMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const originalSend = reply.send;
  
  reply.send = function(payload: any) {
    if (reply.statusCode >= 400) {
      logger.error(
        `HTTP ${reply.statusCode} - ${request.method} ${request.url}`,
        new Error(typeof payload === 'string' ? payload : JSON.stringify(payload)),
        {
          userId: (request as any).user?.id,
          endpoint: `${request.method} ${request.url}`,
          ip: request.ip
        }
      );
    }
    
    return originalSend.call(this, payload);
  };
};