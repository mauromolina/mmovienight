import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const imageSizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  }

  const initials = getInitials(fallback || alt || null)

  if (src) {
    return (
      <div
        className={cn(
          'relative rounded-full overflow-hidden bg-[var(--surface)]',
          sizes[size],
          className
        )}
      >
        <Image
          src={src}
          alt={alt || 'Avatar'}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="object-cover w-full h-full"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-teal-500/20 to-cyan-500/20',
        'text-teal-400 font-medium',
        'border border-teal-500/30',
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  )
}

interface AvatarGroupProps {
  avatars: Array<{ src?: string | null; alt?: string; fallback?: string }>
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, i) => (
        <Avatar
          key={i}
          src={avatar.src}
          alt={avatar.alt}
          fallback={avatar.fallback}
          size={size}
          className="ring-2 ring-[var(--background)]"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            'bg-[var(--surface)] text-gray-400 font-medium',
            'ring-2 ring-[var(--background)]',
            size === 'sm' && 'w-8 h-8 text-xs',
            size === 'md' && 'w-10 h-10 text-sm',
            size === 'lg' && 'w-12 h-12 text-base'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
