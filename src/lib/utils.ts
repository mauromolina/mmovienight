import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import crypto from 'crypto'

// Utilidad para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generar token seguro para invitaciones
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Hash de token para almacenar en DB
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Verificar token contra hash
export function verifyToken(token: string, hash: string): boolean {
  const tokenHash = hashToken(token)
  return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash))
}

// Formatear fecha relativa
export function formatRelativeDate(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      if (diffMinutes < 1) return 'Hace un momento'
      return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`
    }
    return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  }
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`
  return `Hace ${Math.floor(diffDays / 365)} años`
}

// Formatear fecha completa
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Formatear duración de película
export function formatRuntime(minutes: number | null): string {
  if (!minutes) return 'Duración desconocida'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

// Truncar texto con ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Obtener iniciales de un nombre
export function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Calcular promedio de ratings
export function calculateAverage(scores: number[]): number {
  if (scores.length === 0) return 0
  const sum = scores.reduce((acc, score) => acc + score, 0)
  return Math.round((sum / scores.length) * 10) / 10
}

// Obtener color según rating
export function getRatingColor(rating: number): string {
  if (rating >= 8) return 'text-emerald-400'
  if (rating >= 6) return 'text-cyan-400'
  if (rating >= 4) return 'text-yellow-400'
  return 'text-red-400'
}

// Obtener color de fondo según rating
export function getRatingBgColor(rating: number): string {
  if (rating >= 8) return 'bg-emerald-500/20'
  if (rating >= 6) return 'bg-cyan-500/20'
  if (rating >= 4) return 'bg-yellow-500/20'
  return 'bg-red-500/20'
}
