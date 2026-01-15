'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Dices, Film, Sparkles, RotateCcw, Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WatchlistMovie {
  id: string
  movie: {
    id: string
    tmdb_id: number
    title: string
    year: number | null
    poster_path: string | null
    genres: string[] | null
  }
}

interface MovieRouletteProps {
  movies: WatchlistMovie[]
  groupId: string
}

const ITEM_HEIGHT = 200 // Height of each slot item in pixels
const VISIBLE_ITEMS = 3 // Number of items visible in the slot window

export function MovieRoulette({ movies, groupId }: MovieRouletteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<WatchlistMovie | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [slotOffset, setSlotOffset] = useState(0)
  const slotRef = useRef<HTMLDivElement>(null)

  // Create extended list for seamless looping (repeat movies multiple times)
  const extendedMovies = [...movies, ...movies, ...movies, ...movies, ...movies]

  const spinRoulette = () => {
    if (movies.length === 0 || isSpinning) return

    setIsSpinning(true)
    setShowResult(false)
    setSelectedMovie(null)

    // Pick random winner
    const winnerIndex = Math.floor(Math.random() * movies.length)

    // Calculate target position
    // We want to spin through several cycles then land on the winner in the CENTER slot
    // The CENTER slot is at position ITEM_HEIGHT (second visible slot)
    // So we need: offset + ITEM_HEIGHT = targetItemPosition
    // Which means: offset = targetItemPosition - ITEM_HEIGHT
    const cycles = 3 + Math.floor(Math.random() * 2) // 3-4 full cycles
    const targetPosition = (cycles * movies.length + winnerIndex) * ITEM_HEIGHT
    const finalOffset = targetPosition - ITEM_HEIGHT // Adjust so winner lands in CENTER, not TOP

    // Start position (reset to beginning)
    setSlotOffset(0)

    // Small delay then start animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Set final position with CSS transition
        setSlotOffset(finalOffset)
      })
    })

    // Calculate animation duration based on distance
    const duration = 4000 + (finalOffset / ITEM_HEIGHT) * 50 // ~4-6 seconds

    // After animation completes
    setTimeout(() => {
      setSelectedMovie(movies[winnerIndex])
      setIsSpinning(false)

      setTimeout(() => {
        setShowResult(true)
      }, 300)
    }, duration)
  }

  const handleOpen = () => {
    setIsOpen(true)
    setShowResult(false)
    setSelectedMovie(null)
    setSlotOffset(0)
  }

  const handleClose = () => {
    if (isSpinning) return
    setIsOpen(false)
    setShowResult(false)
    setSelectedMovie(null)
    setSlotOffset(0)
  }

  const handleSpinAgain = () => {
    setShowResult(false)
    setSelectedMovie(null)
    setSlotOffset(0)
    // Small delay to reset position before spinning again
    setTimeout(() => {
      spinRoulette()
    }, 100)
  }

  if (movies.length < 2) {
    return null
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#9333EA] to-[#7C3AED] hover:from-[#8B2BE0] hover:to-[#7335E5] rounded-xl text-sm font-bold text-white shadow-lg shadow-[#9333EA]/25 hover:shadow-[#9333EA]/40 transition-all hover:scale-105 cursor-pointer"
      >
        <Dices className="w-5 h-5" />
        <span className="hidden sm:inline">¿Qué vemos hoy?</span>
        <span className="sm:hidden">Sortear</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#1A1D23] to-[#13161B] rounded-3xl border border-[#2A3038] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 text-center border-b border-[#2A3038]">
              <button
                onClick={handleClose}
                disabled={isSpinning}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#2A3038] text-[#6B7280] hover:text-[#F2F4F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 mb-2">
                <Dices className="w-6 h-6 text-[#9333EA]" />
                <h2 className="text-xl font-black text-[#F2F4F6]">¿Qué vemos hoy?</h2>
              </div>
              <p className="text-sm text-[#6B7280]">
                Dejá que el destino elija la próxima película
              </p>
            </div>

            {/* Slot Machine */}
            <div className="px-6 py-8">
              {!showResult ? (
                <div className="relative">
                  {/* Slot Machine Frame */}
                  <div className="relative mx-auto w-64 bg-gradient-to-b from-[#1E2328] to-[#14181D] rounded-2xl p-3 shadow-2xl">
                    {/* Decorative bolts */}
                    <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#3A4048] shadow-inner" />
                    <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#3A4048] shadow-inner" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#3A4048] shadow-inner" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#3A4048] shadow-inner" />

                    {/* Slot Window */}
                    <div
                      className="relative overflow-hidden rounded-xl bg-[#0B0D10]"
                      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
                    >
                      {/* Top shadow gradient */}
                      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0B0D10] via-[#0B0D10]/80 to-transparent z-20 pointer-events-none" />

                      {/* Bottom shadow gradient */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/80 to-transparent z-20 pointer-events-none" />

                      {/* Center selection indicator */}
                      <div
                        className="absolute inset-x-0 z-10 pointer-events-none border-y-2 border-[#9333EA] bg-[#9333EA]/10"
                        style={{
                          top: ITEM_HEIGHT,
                          height: ITEM_HEIGHT,
                        }}
                      >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-[#9333EA]/5" />
                        {/* Side arrows */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-[#9333EA]" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-[#9333EA]" />
                      </div>

                      {/* Scrolling Movies */}
                      <div
                        ref={slotRef}
                        className={cn(
                          "relative",
                          isSpinning && "transition-transform duration-[4500ms] ease-out"
                        )}
                        style={{
                          transform: `translateY(-${slotOffset}px)`,
                          transitionTimingFunction: isSpinning
                            ? 'cubic-bezier(0.15, 0.85, 0.35, 1)'
                            : 'none',
                        }}
                      >
                        {extendedMovies.map((item, index) => (
                          <div
                            key={`${item.id}-${index}`}
                            className="flex items-center justify-center p-4"
                            style={{ height: ITEM_HEIGHT }}
                          >
                            <div className="relative w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-lg bg-[#1A2026]">
                              {item.movie.poster_path ? (
                                <Image
                                  src={`https://image.tmdb.org/t/p/w200${item.movie.poster_path}`}
                                  alt={item.movie.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                                  <Film className="w-8 h-8 text-[#4A5568]" />
                                  <span className="text-xs text-[#4A5568] text-center line-clamp-2">
                                    {item.movie.title}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Machine label */}
                    <div className="mt-3 text-center">
                      <span className="text-xs font-bold text-[#4A5568] uppercase tracking-widest">
                        Movie Night Slot
                      </span>
                    </div>
                  </div>

                  {/* Current movie title (shown during spin) */}
                  {isSpinning && (
                    <div className="mt-6 text-center animate-pulse">
                      <p className="text-sm text-[#6B7280]">Girando...</p>
                    </div>
                  )}
                </div>
              ) : (
                // Result View
                <div className="relative animate-fade-in">
                  {/* Sparkles */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <Sparkles className="w-8 h-8 text-[#D4AF37] animate-bounce" />
                  </div>

                  {/* Winner Card */}
                  <div className="relative mx-auto w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-[#9333EA]/40 ring-4 ring-[#9333EA]">
                    {selectedMovie?.movie.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${selectedMovie.movie.poster_path}`}
                        alt={selectedMovie.movie.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1A2026]">
                        <Film className="w-14 h-14 text-[#4A5568]" />
                      </div>
                    )}

                    <div className="absolute top-3 right-3 px-2 py-1 bg-[#D4AF37] rounded-full shadow-lg">
                      <span className="text-xs font-bold text-[#0B0D10]">ELEGIDA</span>
                    </div>
                  </div>

                  {/* Winner Info */}
                  <div className="mt-6 text-center">
                    <p className="text-2xl font-black text-[#F2F4F6]">
                      {selectedMovie?.movie.title}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2 text-[#9AA3AD]">
                      {selectedMovie?.movie.year && (
                        <span>{selectedMovie.movie.year}</span>
                      )}
                      {selectedMovie?.movie.genres && selectedMovie.movie.genres.length > 0 && (
                        <>
                          <span className="text-[#4A5568]">·</span>
                          <span>{selectedMovie.movie.genres.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6">
              {!isSpinning && !showResult && (
                <button
                  onClick={spinRoulette}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#9333EA] to-[#7C3AED] hover:from-[#8B2BE0] hover:to-[#7335E5] rounded-2xl text-lg font-bold text-white shadow-lg shadow-[#9333EA]/25 hover:shadow-[#9333EA]/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Dices className="w-6 h-6" />
                  Girar
                </button>
              )}

              {isSpinning && (
                <div className="flex items-center justify-center gap-3 py-4 text-[#9AA3AD]">
                  <div className="w-5 h-5 border-2 border-[#9333EA]/30 border-t-[#9333EA] rounded-full animate-spin" />
                  <span className="font-medium">Eligiendo película...</span>
                </div>
              )}

              {showResult && selectedMovie && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/grupos/${groupId}/registrar?movie=${selectedMovie.movie.tmdb_id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-sm font-bold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    Ver esta película
                  </Link>
                  <button
                    onClick={handleSpinAgain}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1A2026] hover:bg-[#242A32] border border-[#2A3038] rounded-xl text-sm font-semibold text-[#9AA3AD] hover:text-[#F2F4F6] transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Girar de nuevo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
