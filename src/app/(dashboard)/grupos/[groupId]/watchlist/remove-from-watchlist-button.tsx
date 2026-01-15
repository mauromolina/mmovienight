'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RemoveFromWatchlistButtonProps {
  watchlistItemId: string
  movieTitle: string
  compact?: boolean
}

export function RemoveFromWatchlistButton({
  watchlistItemId,
  movieTitle,
  compact = false,
}: RemoveFromWatchlistButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    if (!confirm(`¿Estás seguro de que querés eliminar "${movieTitle}" de la watchlist?`)) {
      return
    }

    setIsRemoving(true)

    try {
      const response = await fetch(`/api/watchlist/${watchlistItemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar de la watchlist')
      }
    } catch (error) {
      alert('Error al eliminar de la watchlist')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isRemoving}
      className={cn(
        'flex items-center justify-center text-[#6B7280] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        compact
          ? 'w-10 h-10 rounded-xl border border-[#2A3038]'
          : 'gap-1.5 px-3 py-2 text-xs font-medium rounded-lg'
      )}
      title="Eliminar de watchlist"
    >
      {isRemoving ? (
        <Loader2 className={cn('animate-spin', compact ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
      ) : (
        <Trash2 className={compact ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      )}
      {!compact && <span>Eliminar</span>}
    </button>
  )
}
