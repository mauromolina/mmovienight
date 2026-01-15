'use client'

import { useState } from 'react'
import { Link2 } from 'lucide-react'
import JoinCircleModal from './join-circle-modal'

interface JoinWithCodeButtonProps {
  variant?: 'default' | 'empty-state' | 'card'
}

export default function JoinWithCodeButton({ variant = 'default' }: JoinWithCodeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleJoin = async (code: string) => {
    // TODO: Implement actual API call to validate code and join circle
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'El código no es válido o ya expiró' }
      }

      if (data.alreadyMember) {
        return {
          success: true,
          alreadyMember: true,
          circleName: data.circleName,
          circleId: data.circleId,
        }
      }

      return { success: true, circleId: data.circleId }
    } catch (error) {
      console.error('Error joining circle:', error)
      return { success: false, error: 'Error al procesar la solicitud' }
    }
  }

  if (variant === 'empty-state') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#D4AF37] hover:text-[#E5C158] transition-colors group/link cursor-pointer"
        >
          Ingresar código
          <svg
            className="w-4 h-4 group-hover/link:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <JoinCircleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onJoin={handleJoin}
        />
      </>
    )
  }

  if (variant === 'card') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-1 flex items-center justify-center py-2.5 px-4 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all cursor-pointer"
        >
          Unirse con código
        </button>
        <JoinCircleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onJoin={handleJoin}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#F2F4F6] transition-all cursor-pointer"
      >
        <Link2 className="w-4 h-4" />
        Unirse con código
      </button>
      <JoinCircleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onJoin={handleJoin}
      />
    </>
  )
}
