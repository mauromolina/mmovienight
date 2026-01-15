// Re-export de todos los tipos
export * from './database'
export * from './tmdb'

// Tipos de respuesta de API genéricos
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Tipo Result para manejo de errores funcional
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data }
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error }
}

// Tipos de formulario
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  displayName?: string
}

export interface CreateGroupFormData {
  name: string
  description?: string
}

export interface RatingFormData {
  score: number
  comment?: string
}

export interface InviteFormData {
  email: string
}
