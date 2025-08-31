import { FastifyInstance } from 'fastify';
import { isAdmin } from '../middlewares/auth.middleware.js';
import { notificationRateLimit, notificationModifyRateLimit } from '../middlewares/rate-limit.middleware.js';
import { validateNotificationId, validateNotificationQuery, sanitizeInput } from '../middlewares/notification-validation.middleware.js';
import * as NotificationController from '../controllers/notification.controller.js';

/**
 * Routes pour les notifications admin
 */
export async function notificationRoutes(server: FastifyInstance) {
  // Appliquer les middlewares de sécurité à toutes les routes
  server.addHook('preHandler', sanitizeInput);
  server.addHook('preHandler', isAdmin);

  /**
   * GET /api/admin/notifications
   * Récupérer les notifications avec pagination
   */
  server.get('/', {
    preHandler: [notificationRateLimit as any, validateNotificationQuery as any],
    schema: {
      description: 'Récupérer les notifications admin avec pagination',
      tags: ['Admin', 'Notifications'],
      querystring: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            default: 1,
            description: 'Numéro de page'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 50,
            description: 'Nombre de notifications par page (max 100)'
          },
          unreadOnly: {
            type: 'boolean',
            default: false,
            description: 'Afficher uniquement les notifications non lues'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            notifications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { 
                    type: 'string',
                    enum: ['user_registered', 'post_published', 'system_error', 'user_activity', 'content_moderation']
                  },
                  title: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  read: { type: 'boolean' },
                  priority: { 
                    type: 'string',
                    enum: ['low', 'medium', 'high']
                  },
                  actionUrl: { type: 'string' },
                  metadata: { type: 'object' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'integer' },
                totalPages: { type: 'integer' },
                totalNotifications: { type: 'integer' },
                hasNextPage: { type: 'boolean' },
                hasPrevPage: { type: 'boolean' }
              }
            },
            unreadCount: { type: 'integer' }
          }
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, NotificationController.getNotifications as any);

  /**
   * PATCH /api/admin/notifications/:id/read
   * Marquer une notification comme lue
   */
  server.patch('/:id/read', {
    preHandler: [notificationModifyRateLimit as any, validateNotificationId as any],
    schema: {
      description: 'Marquer une notification comme lue',
      tags: ['Admin', 'Notifications'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'ID de la notification'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            notification: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { 
                  type: 'string',
                  enum: ['user_registered', 'post_published', 'system_error', 'user_activity', 'content_moderation']
                },
                title: { type: 'string' },
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                read: { type: 'boolean' },
                priority: { 
                  type: 'string',
                  enum: ['low', 'medium', 'high']
                },
                actionUrl: { type: 'string' },
                metadata: { type: 'object' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, NotificationController.markNotificationAsRead);

  /**
   * PATCH /api/admin/notifications/read-all
   * Marquer toutes les notifications comme lues
   */
  server.patch('/read-all', {
    preHandler: [notificationModifyRateLimit],
    schema: {
      description: 'Marquer toutes les notifications comme lues',
      tags: ['Admin', 'Notifications'],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            modifiedCount: { type: 'integer' }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, NotificationController.markAllNotificationsAsRead);

  /**
   * POST /api/admin/notifications/cleanup
   * Déclencher un nettoyage manuel des anciennes notifications
   */
  server.post('/cleanup', {
    preHandler: [notificationModifyRateLimit],
    schema: {
      description: 'Déclencher un nettoyage manuel des anciennes notifications (plus de 30 jours)',
      tags: ['Admin', 'Notifications'],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            deletedCount: { type: 'integer' }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, NotificationController.cleanupOldNotifications);

  /**
   * GET /api/admin/notifications/cleanup/status
   * Obtenir le statut du service de nettoyage automatique
   */
  server.get('/cleanup/status', {
    preHandler: [notificationRateLimit],
    schema: {
      description: 'Obtenir le statut du service de nettoyage automatique des notifications',
      tags: ['Admin', 'Notifications'],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            status: {
              type: 'object',
              properties: {
                isRunning: { type: 'boolean' },
                intervalHours: { type: 'integer' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, NotificationController.getCleanupServiceStatus);
}