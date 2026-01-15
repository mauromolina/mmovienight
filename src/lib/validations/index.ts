import { z } from 'zod'

// Validaciones de autenticación
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  displayName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar los 50 caracteres')
    .optional(),
})

// Validaciones de grupos
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre del grupo debe tener al menos 2 caracteres')
    .max(100, 'El nombre del grupo no puede superar los 100 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/, 'El nombre contiene caracteres no permitidos'),
  description: z
    .string()
    .max(500, 'La descripción no puede superar los 500 caracteres')
    .optional(),
})

// Validaciones de ratings
export const ratingSchema = z.object({
  score: z
    .number()
    .int('El puntaje debe ser un número entero')
    .min(1, 'El puntaje mínimo es 1')
    .max(10, 'El puntaje máximo es 10'),
  comment: z
    .string()
    .max(1000, 'El comentario no puede superar los 1000 caracteres')
    .optional()
    .nullable(),
})

// Validaciones de invitaciones
export const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
})

// Validaciones de películas
export const addMovieSchema = z.object({
  tmdbId: z.number().int().positive('ID de TMDb inválido'),
  watchedAt: z.string().datetime().optional().nullable(),
})

// Validaciones de búsqueda
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'La búsqueda no puede estar vacía')
    .max(100, 'La búsqueda no puede superar los 100 caracteres'),
})

// Validación de IDs
export const uuidSchema = z.string().uuid('ID inválido')

// Tipos inferidos de los schemas
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type RatingInput = z.infer<typeof ratingSchema>
export type InviteInput = z.infer<typeof inviteSchema>
export type AddMovieInput = z.infer<typeof addMovieSchema>
export type SearchInput = z.infer<typeof searchSchema>

// Helper para validar y retornar errores formateados
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string> = {}
  // Zod v4 usa `issues`, versiones anteriores usan `errors`
  const issues = result.error.issues || (result.error as { errors?: Array<{ path: (string | number)[]; message: string }> }).errors || []
  issues.forEach((issue) => {
    const path = issue.path.join('.') || 'root'
    errors[path] = issue.message
  })

  return { success: false, errors }
}
