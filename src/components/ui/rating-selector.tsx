'use client'

import { useState } from 'react'
import { cn, getRatingColor, getRatingBgColor } from '@/lib/utils'

interface RatingSelectorProps {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const ratingLabels: Record<number, string> = {
  1: 'Desastrosa',
  2: 'Muy mala',
  3: 'Mala',
  4: 'Floja',
  5: 'Regular',
  6: 'Decente',
  7: 'Buena',
  8: 'Muy buena',
  9: 'Excelente',
  10: 'Obra maestra',
}

export function RatingSelector({
  value,
  onChange,
  disabled = false,
  showLabel = true,
  size = 'md',
}: RatingSelectorProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)

  const displayValue = hoveredValue ?? value
  const label = displayValue ? ratingLabels[displayValue] : 'Seleccioná tu puntuación'

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => {
          const isSelected = value === rating
          const isHovered = hoveredValue === rating

          return (
            <button
              key={rating}
              type="button"
              onClick={() => !disabled && onChange(rating)}
              onMouseEnter={() => !disabled && setHoveredValue(rating)}
              onMouseLeave={() => setHoveredValue(null)}
              disabled={disabled}
              className={cn(
                'rounded-lg font-bold transition-all duration-200',
                'border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                sizes[size],
                isSelected
                  ? cn(
                      'border-transparent',
                      getRatingBgColor(rating),
                      getRatingColor(rating)
                    )
                  : isHovered
                  ? 'border-gray-600 bg-[var(--surface-hover)] text-gray-200'
                  : 'border-[var(--border)] bg-[var(--surface)] text-gray-400 hover:border-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {rating}
            </button>
          )
        })}
      </div>
      {showLabel && (
        <p
          className={cn(
            'text-center text-sm font-medium transition-colors',
            displayValue ? getRatingColor(displayValue) : 'text-gray-500'
          )}
        >
          {label}
        </p>
      )}
    </div>
  )
}

interface RatingDisplayProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function RatingDisplay({
  rating,
  size = 'md',
  showLabel = false,
  className,
}: RatingDisplayProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'font-bold',
          sizes[size],
          getRatingColor(rating)
        )}
      >
        {rating.toFixed(1)}
      </span>
      {showLabel && (
        <span className="text-sm text-gray-400">/10</span>
      )}
    </div>
  )
}
