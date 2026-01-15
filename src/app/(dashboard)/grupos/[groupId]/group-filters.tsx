'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface GroupFiltersProps {
  currentFilter: string
}

export function GroupFilters({ currentFilter }: GroupFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filters = [
    { id: 'recent', label: 'Recientes' },
    { id: 'top', label: 'Top Rated' },
  ]

  const handleFilterChange = (filterId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (filterId === 'recent') {
      params.delete('filter')
    } else {
      params.set('filter', filterId)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--background-secondary)]">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => handleFilterChange(filter.id)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            currentFilter === filter.id
              ? 'bg-teal-500 text-gray-900'
              : 'text-gray-400 hover:text-gray-200'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
