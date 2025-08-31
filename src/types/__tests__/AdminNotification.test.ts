/**
 * Tests pour vérifier que les types de notifications sont correctement définis
 */

import {
  AdminNotification,
  NotificationType,
  NotificationPriority,
  NotificationPanelProps,
  CreateNotificationRequest,
  NotificationFilters
} from '../AdminNotification'

// Test de création d'une notification basique
const testNotification: AdminNotification = {
  id: '1',
  type: 'user_registered',
  title: 'Nouvel utilisateur',
  message: 'Un nouvel utilisateur s\'est inscrit',
  timestamp: new Date(),
  read: false,
  priority: 'medium',
  actionUrl: '/admin/users',
  metadata: {
    userId: 'user123',
    username: 'testuser'
  }
}

// Test des types de notifications
const notificationTypes: NotificationType[] = [
  'user_registered',
  'post_published',
  'system_error',
  'user_activity',
  'content_moderation'
]

// Test des priorités
const priorities: NotificationPriority[] = ['low', 'medium', 'high']

// Test des props du composant NotificationPanel
const panelProps: NotificationPanelProps = {
  notifications: [testNotification],
  isOpen: true,
  onClose: () => {},
  onMarkAsRead: (id: string) => {},
  onMarkAllAsRead: () => {},
  onNotificationClick: (notification: AdminNotification) => {},
  isLoading: false,
  error: undefined
}

// Test de création d'une requête de notification
const createRequest: CreateNotificationRequest = {
  type: 'system_error',
  title: 'Erreur système',
  message: 'Une erreur critique s\'est produite',
  priority: 'high',
  actionUrl: '/admin/logs',
  metadata: {
    errorCode: 'ERR_500',
    component: 'database'
  }
}

// Test des filtres
const filters: NotificationFilters = {
  type: 'user_registered',
  read: false,
  priority: 'high',
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date(),
  limit: 10,
  offset: 0
}

// Vérification que tous les types sont correctement exportés
export {
  testNotification,
  notificationTypes,
  priorities,
  panelProps,
  createRequest,
  filters
}