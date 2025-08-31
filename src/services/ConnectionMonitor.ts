/**
 * Service de surveillance de la connectivité
 * Requirement 2.4: Indicateurs de statut de connexion
 */

export type ConnectionStatus = 'online' | 'offline' | 'checking'

export interface ConnectionMonitorConfig {
  checkInterval: number
  timeout: number
  endpoint: string
}

export class ConnectionMonitor {
  private status: ConnectionStatus = 'checking'
  private listeners: ((status: ConnectionStatus) => void)[] = []
  private checkInterval?: NodeJS.Timeout
  private config: ConnectionMonitorConfig

  constructor(config: Partial<ConnectionMonitorConfig> = {}) {
    this.config = {
      checkInterval: 30000, // 30 secondes
      timeout: 5000, // 5 secondes
      endpoint: '/api/health',
      ...config
    }

    this.initializeMonitoring()
  }

  private initializeMonitoring(): void {
    // Écouter les événements de connexion du navigateur
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())

    // Vérification initiale
    this.checkConnection()

    // Vérification périodique
    this.startPeriodicCheck()
  }

  private handleOnline(): void {
    this.updateStatus('checking')
    this.checkConnection()
  }

  private handleOffline(): void {
    this.updateStatus('offline')
  }

  private async checkConnection(): Promise<void> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(this.config.endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      })

      clearTimeout(timeoutId)
      this.updateStatus(response.ok ? 'online' : 'offline')
    } catch {
      this.updateStatus('offline')
    }
  }

  private updateStatus(newStatus: ConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus
      this.notifyListeners()
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.status)
      } catch (error) {
        console.error('Error in connection status listener:', error)
      }
    })
  }

  private startPeriodicCheck(): void {
    this.checkInterval = setInterval(() => {
      if (this.status === 'online') {
        this.checkConnection()
      }
    }, this.config.checkInterval)
  }

  /**
   * S'abonne aux changements de statut
   */
  subscribe(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(listener)
    listener(this.status) // Envoyer le statut actuel

    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Récupère le statut actuel
   */
  getStatus(): ConnectionStatus {
    return this.status
  }

  /**
   * Force une vérification de connexion
   */
  async forceCheck(): Promise<ConnectionStatus> {
    this.updateStatus('checking')
    await this.checkConnection()
    return this.status
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this.listeners = []
  }
}

export const connectionMonitor = new ConnectionMonitor()