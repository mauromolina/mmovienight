'use server'

import { createClient } from '@/lib/supabase/server'
import { dbInsert, dbSelect } from '@/lib/supabase/db'
import { isUserMemberOfGroup } from '@/services/groups'
import { inviteSchema, validate, uuidSchema } from '@/lib/validations'
import { generateSecureToken, hashToken } from '@/lib/utils'
import { sendInvitationEmail } from '@/lib/email'

export type InviteActionState = {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

export async function sendInvitation(
  prevState: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debés iniciar sesión' }
  }

  const groupId = formData.get('groupId') as string
  const email = formData.get('email') as string

  // Validar ID del grupo
  if (!uuidSchema.safeParse(groupId).success) {
    return { error: 'Grupo inválido' }
  }

  // Validar email
  const validation = validate(inviteSchema, { email })
  if (!validation.success) {
    return { fieldErrors: validation.errors }
  }

  // Verificar que el usuario que invita sea miembro del grupo
  const isMember = await isUserMemberOfGroup(groupId, user.id)
  if (!isMember) {
    return { error: 'No tenés acceso a este grupo' }
  }

  // Verificar si el email ya es miembro del grupo
  const { data: profiles } = await dbSelect(supabase, 'profiles', 'id', {
    email: email.toLowerCase(),
  })
  const existingProfile = profiles?.[0] as { id: string } | undefined

  if (existingProfile) {
    const isAlreadyMember = await isUserMemberOfGroup(groupId, existingProfile.id)
    if (isAlreadyMember) {
      return { error: 'Esta persona ya es miembro del grupo' }
    }
  }

  // Verificar si ya existe una invitación pendiente
  const { data: invites } = await dbSelect(supabase, 'invites', 'id, expires_at, accepted_at', {
    group_id: groupId,
    email: email.toLowerCase(),
  })
  const invitesList = invites as Array<{ id: string; expires_at: string; accepted_at: string | null }> | null
  const existingInvite = invitesList?.find((inv) => !inv.accepted_at)

  // Si existe una invitación no expirada, avisar
  if (existingInvite) {
    const isExpired = new Date(existingInvite.expires_at) < new Date()
    if (!isExpired) {
      return { error: 'Ya existe una invitación pendiente para este email' }
    }
    // Si expiró, eliminarla para crear una nueva
    await supabase.from('invites').delete().eq('id', existingInvite.id)
  }

  // Obtener datos del grupo y del usuario que invita
  const { data: groups } = await dbSelect(supabase, 'groups', 'name', { id: groupId })
  const group = groups?.[0] as { name: string } | undefined

  const { data: inviterProfiles } = await dbSelect(supabase, 'profiles', 'display_name, email', {
    id: user.id,
  })
  const inviterProfile = inviterProfiles?.[0] as
    | { display_name: string | null; email: string }
    | undefined

  if (!group || !inviterProfile) {
    return { error: 'No se pudo obtener la información del grupo' }
  }

  // Generar token seguro
  const token = generateSecureToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expira en 7 días

  // Guardar invitación
  const { error: insertError } = await dbInsert(supabase, 'invites', {
    group_id: groupId,
    email: email.toLowerCase(),
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    invited_by: user.id,
  })

  if (insertError) {
    console.error('Error creating invite:', insertError)
    return { error: 'No pudimos crear la invitación. Intentá de nuevo.' }
  }

  // Enviar email
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${token}`
  const inviterName = inviterProfile.display_name || inviterProfile.email.split('@')[0]

  try {
    await sendInvitationEmail({
      to: email,
      groupName: group.name,
      inviterName,
      inviteUrl,
    })
  } catch (emailError) {
    console.error('Error sending invitation email:', emailError)
    // No falla si el email no se envía, la invitación ya está creada
  }

  return { success: true }
}
