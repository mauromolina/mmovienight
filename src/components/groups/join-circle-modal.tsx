'use client'

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { X, Ticket, ArrowRight, Loader2, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JoinCircleModalProps {
  isOpen: boolean
  onClose: () => void
  onJoin?: (code: string) => Promise<{ success: boolean; error?: string; alreadyMember?: boolean; circleName?: string; circleId?: string }>
}

const CODE_LENGTH = 6

export default function JoinCircleModal({ isOpen, onClose, onJoin }: JoinCircleModalProps) {
  const router = useRouter()
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyMember, setAlreadyMember] = useState<{ circleName: string; circleId: string } | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCode(Array(CODE_LENGTH).fill(''))
      setError(null)
      setAlreadyMember(null)
      setIsLoading(false)
      setShowHelp(false)
      // Focus first input after a short delay for animation
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [isOpen])

  // Handle keyboard escape
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleInputChange = (index: number, value: string) => {
    // Only allow alphanumeric characters
    const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

    if (sanitized.length <= 1) {
      const newCode = [...code]
      newCode[index] = sanitized
      setCode(newCode)
      setError(null)
      setAlreadyMember(null)

      // Auto-advance to next input
      if (sanitized && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const chars = pasted.slice(0, CODE_LENGTH).split('')
    const newCode = [...code]

    chars.forEach((char, i) => {
      if (i < CODE_LENGTH) {
        newCode[i] = char
      }
    })

    setCode(newCode)
    setError(null)
    setAlreadyMember(null)

    // Focus the next empty slot or the last one
    const nextEmpty = newCode.findIndex(c => !c)
    if (nextEmpty !== -1) {
      inputRefs.current[nextEmpty]?.focus()
    } else {
      inputRefs.current[CODE_LENGTH - 1]?.focus()
    }
  }

  const isCodeComplete = code.every(c => c !== '')
  const fullCode = code.join('')

  const handleSubmit = async () => {
    if (!isCodeComplete || isLoading) return

    setIsLoading(true)
    setError(null)
    setAlreadyMember(null)

    // If no onJoin handler is provided, show an error
    if (!onJoin) {
      setError('Esta funcionalidad aún no está disponible')
      setIsLoading(false)
      return
    }

    try {
      const result = await onJoin(fullCode)

      if (result.alreadyMember && result.circleName && result.circleId) {
        setAlreadyMember({ circleName: result.circleName, circleId: result.circleId })
      } else if (!result.success) {
        setError(result.error || 'El código no es válido o ya expiró')
      } else if (result.circleId) {
        // Success - redirect to the group
        onClose()
        router.push(`/grupos/${result.circleId}`)
      } else {
        // Success but no circleId - just close and refresh
        onClose()
        router.refresh()
      }
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToCircle = () => {
    if (alreadyMember) {
      onClose()
      router.push(`/grupos/${alreadyMember.circleId}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
      />

      {/* Close button - outside modal */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[#9AA3AD] hover:text-white transition-all"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#14181D]/95 backdrop-blur-md border border-[#1E2328] rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/50 animate-scale-in overflow-hidden">
        {/* Decorative gradient top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#16C7D9] to-transparent opacity-60" />

        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#16C7D9]/20 to-[#0EA5E9]/10 border border-[#16C7D9]/30 flex items-center justify-center">
              <Ticket className="w-8 h-8 sm:w-10 sm:h-10 text-[#16C7D9]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
            Ingresar código secreto
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#9AA3AD] text-center mb-8">
            Sumate al círculo para la próxima función
          </p>

          {/* Code Input Slots */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-4">
            {code.map((char, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={char}
                onChange={e => handleInputChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={cn(
                  'w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl bg-[#0B0D10] border-2 transition-all duration-200 outline-none',
                  'placeholder:text-[#2A3038]',
                  error
                    ? 'border-red-500/50 text-red-400 focus:border-red-500'
                    : char
                      ? 'border-[#16C7D9]/50 text-white'
                      : 'border-[#1E2328] text-white focus:border-[#16C7D9]',
                  'focus:ring-2 focus:ring-[#16C7D9]/20'
                )}
                placeholder="•"
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4 animate-fade-in">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Already Member Message */}
          {alreadyMember && (
            <div className="bg-[#16C7D9]/10 border border-[#16C7D9]/30 rounded-xl p-4 mb-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#16C7D9] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    Ya sos miembro de este círculo
                  </p>
                  <p className="text-xs text-[#9AA3AD] mb-3">
                    Pertenecés a <span className="text-[#16C7D9] font-medium">{alreadyMember.circleName}</span>
                  </p>
                  <button
                    onClick={handleGoToCircle}
                    className="text-xs text-[#16C7D9] hover:text-[#14B4C5] font-medium transition-colors"
                  >
                    Ir al círculo →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!alreadyMember && (
            <button
              onClick={handleSubmit}
              disabled={!isCodeComplete || isLoading}
              className={cn(
                'w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2',
                isCodeComplete && !isLoading
                  ? 'bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] text-[#0B0D10] hover:shadow-lg hover:shadow-[#16C7D9]/30 hover:-translate-y-0.5'
                  : 'bg-[#1E2328] text-[#4A5568] cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Unirse al círculo</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}

          {/* Help Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#6B7280] hover:text-[#9AA3AD] transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>¿Dónde encuentro mi código?</span>
            </button>

            {/* Help Tooltip */}
            {showHelp && (
              <div className="mt-3 p-4 bg-[#0B0D10] border border-[#1E2328] rounded-xl text-left animate-fade-in">
                <p className="text-xs sm:text-sm text-[#9AA3AD] leading-relaxed">
                  El código de invitación lo genera un miembro del círculo desde la configuración del grupo.
                  Pedile a quien te invitó que te comparta el código de 6 caracteres.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Decorative bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#16C7D9]/5 to-transparent pointer-events-none" />
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
