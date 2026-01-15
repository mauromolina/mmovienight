'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2, AlertTriangle } from 'lucide-react'

interface LeaveGroupButtonProps {
  groupId: string
  groupName: string
}

export function LeaveGroupButton({ groupId, groupName }: LeaveGroupButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const handleLeave = async () => {
    setIsLeaving(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/grupos')
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al abandonar el grupo')
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      alert('Error al abandonar el grupo')
    } finally {
      setIsLeaving(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-md p-6 rounded-2xl bg-[#14181D] border border-[#2A3038] shadow-2xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F2F4F6] mb-1">
                ¿Abandonar el grupo?
              </h3>
              <p className="text-sm text-[#6B7280]">
                Vas a dejar de ser miembro de <span className="text-[#F2F4F6] font-medium">{groupName}</span>.
                Tus calificaciones y comentarios permanecerán, pero ya no tendrás acceso al grupo.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isLeaving}
              className="px-4 py-2.5 text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleLeave}
              disabled={isLeaving}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isLeaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Abandonando...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Sí, abandonar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-1 px-2.5 py-1 bg-[#14181D] hover:bg-red-500/10 border border-[#2A3038] hover:border-red-500/30 rounded-lg text-xs font-medium text-[#6B7280] hover:text-red-400 transition-all cursor-pointer"
    >
      <LogOut className="w-3 h-3" />
      Abandonar
    </button>
  )
}
