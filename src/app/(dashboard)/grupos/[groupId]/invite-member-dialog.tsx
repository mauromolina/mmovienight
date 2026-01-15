'use client'

import { useState, useActionState } from 'react'
import { UserPlus, Mail, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { sendInvitation, type InviteActionState } from './invite-actions'

interface InviteMemberDialogProps {
  groupId: string
  groupName: string
}

export function InviteMemberDialog({ groupId, groupName }: InviteMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const [state, formAction, isPending] = useActionState<InviteActionState, FormData>(
    async (prevState, formData) => {
      formData.set('groupId', groupId)
      return sendInvitation(prevState, formData)
    },
    {}
  )

  const handleCopyLink = async () => {
    // Por ahora copiamos el link base del grupo
    // Cuando implementemos invitaciones, generaremos un token
    const inviteUrl = `${window.location.origin}/join?group=${groupId}`
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(true)}
        leftIcon={<UserPlus className="w-4 h-4" />}
      >
        Invitar
      </Button>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        title="Invitar a alguien"
        description={`Invitá a tus amigos a "${groupName}"`}
      >
        <form action={formAction}>
          <DialogContent>
            {state.success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">
                    Invitación enviada
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Le enviamos un email con el link para unirse al grupo
                  </p>
                </div>
                <Button variant="secondary" onClick={handleClose}>
                  Cerrar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {state.error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {state.error}
                  </div>
                )}

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="amigo@email.com"
                  error={state.fieldErrors?.email}
                />

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border)]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[var(--background-secondary)] text-gray-500">
                      o compartí el link
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleCopyLink}
                  leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? 'Link copiado!' : 'Copiar link de invitación'}
                </Button>
              </div>
            )}
          </DialogContent>

          {!state.success && (
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isPending}
                leftIcon={<Mail className="w-4 h-4" />}
              >
                Enviar invitación
              </Button>
            </DialogFooter>
          )}
        </form>
      </Dialog>
    </>
  )
}
