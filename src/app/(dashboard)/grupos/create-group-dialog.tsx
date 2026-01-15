'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { Plus, ArrowRight, Sparkles } from 'lucide-react'
import { createGroup, type GroupActionState } from './actions'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'

interface CreateGroupDialogProps {
  variant?: 'primary' | 'secondary' | 'empty-state' | 'card'
}

export function CreateGroupDialog({ variant = 'primary' }: CreateGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<GroupActionState, FormData>(
    createGroup,
    {}
  )

  // Link directly to the full creation page for most variants
  if (variant === 'empty-state') {
    return (
      <Link
        href="/grupos/crear"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#16C7D9] hover:text-[#3DD4E4] transition-colors group/link"
      >
        Crear grupo
        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
      </Link>
    )
  }

  if (variant === 'card') {
    return (
      <Link
        href="/grupos/crear"
        className="flex-1 flex items-center justify-center py-2.5 px-4 bg-[#16C7D9] hover:bg-[#14B8C9] rounded-xl text-sm font-semibold text-[#0B0D10] transition-all shadow-lg shadow-[#16C7D9]/20 hover:shadow-[#16C7D9]/30"
      >
        Crear círculo
      </Link>
    )
  }

  if (variant === 'primary') {
    return (
      <Link
        href="/grupos/crear"
        className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-sm font-medium text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all"
      >
        <Plus className="w-4 h-4" />
        Crear grupo
      </Link>
    )
  }

  if (variant === 'secondary') {
    return (
      <Link
        href="/grupos/crear"
        className="px-5 py-2.5 bg-[#16C7D9]/10 hover:bg-[#16C7D9]/20 border border-[#16C7D9]/30 rounded-xl text-sm font-medium text-[#16C7D9] transition-colors"
      >
        Iniciar configuración
      </Link>
    )
  }

  // Fallback to dialog (not used currently but kept for backwards compatibility)
  const renderTrigger = () => {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-sm font-medium text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all"
      >
        <Plus className="w-4 h-4" />
        Crear grupo
      </button>
    )
  }

  return (
    <>
      {renderTrigger()}

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Crear nuevo grupo"
        description="Creá un espacio para registrar y calificar películas con tus amigos."
      >
        <form action={formAction}>
          <DialogContent>
            <div className="space-y-4">
              {state.error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {state.error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#9AA3AD] tracking-wide mb-2">
                  NOMBRE DEL GRUPO
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Ej: Cine Club de los Viernes"
                  autoFocus
                  className="w-full px-4 py-3 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] text-sm focus:outline-none focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/50 transition-all"
                />
                {state.fieldErrors?.name && (
                  <p className="mt-1 text-xs text-red-400">{state.fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9AA3AD] tracking-wide mb-2">
                  DESCRIPCIÓN (OPCIONAL)
                </label>
                <textarea
                  name="description"
                  placeholder="¿De qué se trata este grupo?"
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] text-sm focus:outline-none focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/50 transition-all resize-none"
                />
                {state.fieldErrors?.description && (
                  <p className="mt-1 text-xs text-red-400">{state.fieldErrors.description}</p>
                )}
              </div>
            </div>
          </DialogContent>

          {/* Link to advanced creation */}
          <div className="px-6 pb-4">
            <Link
              href="/grupos/crear"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-[#6B7280] hover:text-[#16C7D9] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Creación avanzada con portada e invitaciones
            </Link>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 bg-[#1A2026] hover:bg-[#242A32] border border-[#2A3038] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-sm font-medium text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all disabled:opacity-50"
            >
              {isPending ? 'Creando...' : 'Crear grupo'}
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
