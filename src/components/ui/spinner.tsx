import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <Loader2
      className={cn('animate-spin text-teal-500', sizes[size], className)}
    />
  )
}

interface LoadingProps {
  text?: string
  className?: string
}

export function Loading({ text = 'Cargando...', className }: LoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 gap-3',
        className
      )}
    >
      <Spinner size="lg" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cinematic">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center animate-pulse-glow">
          <Spinner size="lg" />
        </div>
        <p className="text-gray-400">Cargando...</p>
      </div>
    </div>
  )
}
