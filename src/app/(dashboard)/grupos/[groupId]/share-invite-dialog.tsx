'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Copy, Check, RefreshCw, Link2 } from 'lucide-react'

interface ShareInviteDialogProps {
  groupId: string
  groupName: string
}

export function ShareInviteDialog({ groupId, groupName }: ShareInviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchInviteCode = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/groups/${groupId}/invite-code`, {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok && data.code) {
        setInviteCode(data.code)
      } else {
        setError(data.error || 'Error al obtener el código')
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && !inviteCode) {
      fetchInviteCode()
    }
  }, [isOpen])

  const handleCopyCode = async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied('code')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCopyLink = async () => {
    if (!inviteCode) return
    const link = `${window.location.origin}/unirse?code=${inviteCode}`
    await navigator.clipboard.writeText(link)
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        Invitar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#14181D] to-[#0F1318] rounded-2xl border border-[#2A3038] shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#1E2328]">
              <h2 className="text-xl font-bold text-[#F2F4F6]">
                Invitar a <span className="text-[#16C7D9]">{groupName}</span>
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Compartí el código con tus amigos para que se unan
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Invite Code */}
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                  Código de invitación
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-[#0B0D10] border border-[#2A3038] rounded-xl">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-[#6B7280]">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generando...</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-mono font-bold text-[#16C7D9] tracking-widest">
                        {inviteCode || '------'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    disabled={!inviteCode || isLoading}
                    className="p-3 bg-[#1A2026] hover:bg-[#242A32] border border-[#2A3038] rounded-xl text-[#9AA3AD] hover:text-[#F2F4F6] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {copied === 'code' ? (
                      <Check className="w-5 h-5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1E2328]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-[#12151A] text-xs text-[#4A5568]">
                    o compartí el link
                  </span>
                </div>
              </div>

              {/* Copy Link Button */}
              <button
                onClick={handleCopyLink}
                disabled={!inviteCode || isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1A2026] hover:bg-[#242A32] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all disabled:opacity-50 cursor-pointer"
              >
                {copied === 'link' ? (
                  <>
                    <Check className="w-4 h-4 text-[#10B981]" />
                    Link copiado!
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Copiar link de invitación
                  </>
                )}
              </button>

              {/* Info */}
              <p className="text-xs text-[#4A5568] text-center">
                El código no expira. Podés generar uno nuevo cuando quieras.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#1E2328] flex justify-between items-center">
              <button
                onClick={fetchInviteCode}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#16C7D9] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Generar nuevo código
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
