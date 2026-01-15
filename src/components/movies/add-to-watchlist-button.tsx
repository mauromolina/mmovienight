'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Check, ChevronDown, Users, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Group {
  id: string
  name: string
  member_count?: number
}

interface AddToWatchlistButtonProps {
  tmdbId: number
  movieTitle: string
  variant?: 'primary' | 'secondary' | 'hero'
  className?: string
}

export function AddToWatchlistButton({
  tmdbId,
  movieTitle,
  variant = 'primary',
  className,
}: AddToWatchlistButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [addedToGroups, setAddedToGroups] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch user's groups and check existing watchlist when dropdown opens
  useEffect(() => {
    async function loadData() {
      if (!isOpen) return

      setIsLoading(true)
      setError(null)

      try {
        // Always fetch groups first (or use cached)
        let currentGroups = groups
        if (currentGroups.length === 0) {
          const response = await fetch('/api/groups')
          if (response.ok) {
            const data = await response.json()
            currentGroups = data.groups || []
            setGroups(currentGroups)
          } else {
            setError('Error al cargar grupos')
            setIsLoading(false)
            return
          }
        }

        // Always check which groups already have this movie
        if (currentGroups.length > 0 && tmdbId) {
          const checkResponse = await fetch(`/api/watchlist/check?tmdbId=${tmdbId}`)
          if (checkResponse.ok) {
            const checkData = await checkResponse.json()
            setAddedToGroups(checkData.groupIds || [])
          }
        }
      } catch (err) {
        console.error('Error loading watchlist data:', err)
        setError('Error al cargar datos')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isOpen, tmdbId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleAddToWatchlist = async (groupId: string) => {
    if (addedToGroups.includes(groupId)) return

    setIsAdding(true)
    setError(null)

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId, groupId }),
      })

      const data = await response.json()

      if (response.ok) {
        setAddedToGroups((prev) => [...prev, groupId])
      } else {
        setError(data.error || 'Error al agregar')
      }
    } catch (err) {
      setError('Error al agregar a watchlist')
    } finally {
      setIsAdding(false)
    }
  }

  const buttonStyles = {
    primary:
      'inline-flex items-center gap-2 px-6 py-3 bg-[#16C7D9] hover:bg-[#14B8C9] rounded-xl text-sm font-semibold text-[#0B0D10] transition-all shadow-lg shadow-[#16C7D9]/20',
    secondary:
      'inline-flex items-center gap-2 px-4 py-2 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all',
    hero:
      'flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 rounded-xl text-sm sm:text-base font-medium text-[#F2F4F6] transition-all',
  }

  return (
    <div className={cn('relative z-40', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(buttonStyles[variant], 'cursor-pointer')}
      >
        <Plus className="w-5 h-5" />
        Agregar a watchlist
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#14181D] border border-[#2A3038] rounded-xl shadow-2xl z-[100] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1E2328]">
            <p className="text-sm font-medium text-[#F2F4F6]">Seleccionar círculo</p>
            <p className="text-xs text-[#6B7280] mt-0.5 truncate">
              {movieTitle}
            </p>
          </div>

          {/* Content */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-[#16C7D9] animate-spin" />
              </div>
            ) : groups.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Users className="w-8 h-8 text-[#3A4048] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">No pertenecés a ningún círculo</p>
                <p className="text-xs text-[#4A5568] mt-1">
                  Creá o unite a un círculo para agregar películas
                </p>
              </div>
            ) : (
              <div className="py-2">
                {groups.map((group) => {
                  const isAdded = addedToGroups.includes(group.id)
                  return (
                    <button
                      key={group.id}
                      onClick={() => handleAddToWatchlist(group.id)}
                      disabled={isAdded || isAdding}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 transition-colors cursor-pointer',
                        isAdded
                          ? 'bg-[#10B981]/10'
                          : 'hover:bg-[#1A2026]',
                        isAdding && !isAdded && 'opacity-50 cursor-wait'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#16C7D9]/10 border border-[#16C7D9]/20 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-[#16C7D9]" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-sm font-medium text-[#F2F4F6] truncate">
                            {group.name}
                          </p>
                          {group.member_count && (
                            <p className="text-xs text-[#6B7280]">
                              {group.member_count} {group.member_count === 1 ? 'miembro' : 'miembros'}
                            </p>
                          )}
                        </div>
                      </div>
                      {isAdded ? (
                        <div className="flex items-center gap-1 text-[#10B981]">
                          <Check className="w-4 h-4" />
                          <span className="text-xs font-medium">Agregada</span>
                        </div>
                      ) : isAdding ? (
                        <Loader2 className="w-4 h-4 text-[#16C7D9] animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 text-[#6B7280]" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="px-4 py-3 border-t border-[#1E2328] bg-[#EF4444]/10">
              <div className="flex items-center gap-2 text-[#EF4444]">
                <X className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
