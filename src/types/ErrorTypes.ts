export interface UserFriendlyError {
  message: string
  type: 'warning' | 'error' | 'info'
  code?: string
  action?: {
    label: string
    handler: () => void
  }
}

export interface ApiError extends Error {
  status?: number
  code?: string
  details?: any
}

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  timestamp: Date
  userAgent?: string
}

export interface ErrorReport {
  error: Error | ApiError
  context: ErrorContext
  userFriendlyError: UserFriendlyError
}

export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'API_ERROR' 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'IMAGE_LOAD_ERROR'
  | 'NAVIGATION_ERROR'
  | 'LIKE_ERROR'
  | 'DISLIKE_ERROR'
  | 'POST_CREATION_ERROR'
  | 'COMMENT_ERROR'
  | 'THEME_ERROR'
  | 'CONTENT_FILTER_ERROR'
  | 'UNKNOWN_ERROR'

export interface ErrorHandlerOptions {
  showToUser?: boolean
  logToConsole?: boolean
  reportToService?: boolean
  context?: Partial<ErrorContext>
}