'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ArrowLeft, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  movie: {
    title: string
    director: string
    year: number
    poster_path: string
  }
  groupName: string
  memberCount: number
  existingRating?: {
    score: number
    comment: string
  } | null
  onSubmit: (rating: { score: number; comment: string; publishToGroup: boolean }) => void
}

export function RatingModal({
  isOpen,
  onClose,
  movie,
  groupName,
  memberCount,
  existingRating,
  onSubmit,
}: RatingModalProps) {
  const [score, setScore] = useState<number | null>(existingRating?.score || null)
  const [hoverScore, setHoverScore] = useState(0)
  const [comment, setComment] = useState(existingRating?.comment || '')
  const [publishToGroup, setPublishToGroup] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle opening/closing animation and reset
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Reset form or load existing rating
      if (!existingRating) {
        setScore(null)
        setComment('')
        setPublishToGroup(true)
      } else {
        setScore(existingRating.score)
        setComment(existingRating.comment)
      }
    } else {
      // Reset form when modal closes
      setScore(null)
      setComment('')
      setPublishToGroup(true)
      setIsAnimating(false)
    }
  }, [isOpen, existingRating])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (score === null) return
    onSubmit({ score, comment, publishToGroup })
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const isEditing = !!existingRating

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-opacity duration-300',
        isAnimating ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-5xl max-h-[90vh] overflow-y-auto',
          'bg-gradient-to-b from-[#16191E] to-[#12151A] rounded-3xl',
          'shadow-2xl shadow-black/50',
          'transform transition-all duration-300',
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        {/* Close button - Mobile back arrow */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 lg:hidden p-2 rounded-xl bg-[#1A2026]/80 hover:bg-[#242A32] text-[#9AA3AD] hover:text-[#F2F4F6] transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Close button - Desktop X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 hidden lg:flex p-2 rounded-xl bg-[#1A2026]/80 hover:bg-[#242A32] text-[#9AA3AD] hover:text-[#F2F4F6] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Left Column - Movie Info */}
          <div className="lg:w-2/5 p-6 lg:p-10 flex flex-col items-center lg:items-start lg:border-r border-[#1E2328]/60">
            {/* Poster */}
            <div className="relative w-52 sm:w-64 lg:w-full max-w-[300px] aspect-[2/3] rounded-2xl overflow-hidden shadow-xl shadow-black/40 mb-6">
              <Image
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                fill
                className="object-cover"
              />
              {/* Badge */}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 bg-[#D4AF37]/90 backdrop-blur-sm rounded-lg text-[10px] font-bold tracking-wider text-[#0B0D10]">
                  MUY ESPERADA
                </span>
              </div>
            </div>

            {/* Title & Meta */}
            <h2 className="text-2xl lg:text-3xl font-black text-[#F2F4F6] text-center lg:text-left mb-2">
              {movie.title}
            </h2>
            <p className="text-sm text-[#6B7280] text-center lg:text-left">
              Dirigida por {movie.director} · {movie.year}
            </p>
          </div>

          {/* Right Column - Rating Form */}
          <div className="lg:w-3/5 p-6 lg:p-10">
            {/* Header */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-[#F2F4F6] mb-2">Tu calificación</h3>
              <p className="text-sm text-[#6B7280]">
                ¿Qué puntaje le darías a esta experiencia cinematográfica?
              </p>
            </div>

            {/* Star Rating Selector */}
            <div className="mb-8">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverScore(star)}
                      onMouseLeave={() => setHoverScore(0)}
                      onClick={() => setScore(star)}
                      className="p-0.5 sm:p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95"
                    >
                      <Star
                        className={cn(
                          'w-6 h-6 sm:w-8 sm:h-8 transition-all duration-150',
                          (hoverScore || score || 0) >= star
                            ? 'text-[#D4AF37] fill-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                            : 'text-[#2A3038] hover:text-[#3A4048]'
                        )}
                      />
                    </button>
                  ))}
                </div>
                {/* Selected score display */}
                {(score !== null || hoverScore > 0) && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#D4AF37]">{hoverScore || score}</span>
                    <span className="text-xl text-[#4A5568]">/ 10</span>
                  </div>
                )}
              </div>
            </div>

            {/* Review Textarea */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-[#9AA3AD] mb-2">
                Escribí una reseña corta (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Qué te quedó después de que pasaron los créditos?"
                rows={4}
                className="w-full px-4 py-3 bg-[#0B0D10]/60 border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] text-sm resize-none focus:outline-none focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/30 transition-all"
              />
            </div>

            {/* Publish to Group Toggle */}
            <div className="flex items-start justify-between gap-4 p-4 bg-[#0B0D10]/40 rounded-xl border border-[#1E2328]/60 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#F2F4F6]">
                    Publicar en "{groupName}"
                  </span>
                  <span className="px-2 py-0.5 bg-[#16C7D9]/10 border border-[#16C7D9]/30 rounded text-[10px] font-semibold text-[#16C7D9] tracking-wide">
                    SOLO GRUPO PRIVADO
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Se compartirá con {memberCount} amigos
                </p>
              </div>
              {/* Toggle Switch */}
              <button
                onClick={() => setPublishToGroup(!publishToGroup)}
                className={cn(
                  'relative flex-shrink-0 w-12 h-7 rounded-full transition-colors cursor-pointer',
                  publishToGroup ? 'bg-[#16C7D9]' : 'bg-[#2A3038]'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
                    publishToGroup ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={score === null}
                className={cn(
                  'w-full sm:flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all',
                  score !== null
                    ? 'bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 cursor-pointer'
                    : 'bg-[#2A3038] text-[#4A5568] cursor-not-allowed'
                )}
              >
                {isEditing ? 'Actualizar calificación' : 'Guardar calificación'}
                <span className="ml-1">→</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-4 text-sm font-medium text-[#6B7280] hover:text-[#F2F4F6] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
