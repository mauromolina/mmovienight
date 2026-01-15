'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { dbSelect, dbInsert, dbUpdate } from '@/lib/supabase/db'
import { verifyToken } from '@/lib/utils'

interface InviteRecord {
  id: string
  group_id: string
  email: string
  token_hash: string
  expires_at: string
  accepted_at: string | null
  invited_by: string
  created_at: string
}

export async function acceptInvitation(
  inviteId: string,
  token: string,
  groupId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debés iniciar sesión para unirte al grupo' }
  }

  // Verificar la invitación
  const { data: invites } = await dbSelect(supabase, 'invites', '*', { id: inviteId })
  const invite = invites?.[0] as InviteRecord | undefined

  if (!invite) {
    return { error: 'Invitación no encontrada' }
  }

  // Verificar el token
  if (!verifyToken(token, invite.token_hash)) {
    return { error: 'Token de invitación inválido' }
  }

  // Verificar que no haya expirado
  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'Esta invitación ha expirado' }
  }

  // Verificar que no haya sido aceptada
  if (invite.accepted_at) {
    return { error: 'Esta invitación ya fue utilizada' }
  }

  // Verificar que no sea ya miembro
  const { data: memberships } = await dbSelect(supabase, 'memberships', 'id', {
    group_id: groupId,
    user_id: user.id,
  })
  const existingMembership = memberships?.[0]

  if (existingMembership) {
    return { error: 'Ya sos miembro de este grupo' }
  }

  // Crear membresía
  const { error: membershipError } = await dbInsert(supabase, 'memberships', {
    group_id: groupId,
    user_id: user.id,
    role: 'member',
  })

  if (membershipError) {
    console.error('Error creating membership:', membershipError)
    return { error: 'No pudimos agregarte al grupo. Intentá de nuevo.' }
  }

  // Marcar invitación como aceptada
  await dbUpdate(
    supabase,
    'invites',
    { accepted_at: new Date().toISOString() },
    { id: inviteId }
  )

  revalidatePath('/grupos')
  revalidatePath(`/grupos/${groupId}`)

  return { success: true }
}
