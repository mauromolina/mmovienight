'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbInsert, dbSelect } from '@/lib/supabase/db'
import { createGroupSchema, validate } from '@/lib/validations'

export type GroupActionState = {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

export async function createGroup(
  prevState: GroupActionState,
  formData: FormData
): Promise<GroupActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debés iniciar sesión para crear un grupo' }
  }

  const data = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
  }

  // Validar datos
  const validation = validate(createGroupSchema, data)
  if (!validation.success) {
    return { fieldErrors: validation.errors }
  }

  // Crear el grupo
  const { data: groupData, error } = await dbInsert(supabase, 'groups', {
    name: validation.data.name,
    description: validation.data.description,
    owner_id: user.id,
  })

  // Workaround: Obtener el grupo creado
  if (error) {
    console.error('Error creating group:', error)
    return { error: 'No pudimos crear el grupo. Intentá de nuevo.' }
  }

  // Obtener el grupo recién creado por owner_id y nombre
  const { data: groups } = await dbSelect(supabase, 'groups', 'id', {
    owner_id: user.id,
    name: validation.data.name,
  })
  const group = groups?.[0] as { id: string } | undefined

  if (!group) {
    return { error: 'No pudimos crear el grupo. Intentá de nuevo.' }
  }

  revalidatePath('/grupos')
  redirect(`/grupos/${group.id}`)
}

export async function leaveGroup(groupId: string): Promise<GroupActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debés iniciar sesión' }
  }

  // Verificar que no sea el owner
  const { data: memberships } = await dbSelect(supabase, 'memberships', 'role', {
    group_id: groupId,
    user_id: user.id,
  })
  const membership = memberships?.[0] as { role: string } | undefined

  if (membership?.role === 'owner') {
    return { error: 'No podés abandonar un grupo que creaste. Debés eliminarlo o transferir la propiedad.' }
  }

  // Eliminar membresía
  const { error } = await supabase
    .from('memberships')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'No pudimos procesar tu solicitud. Intentá de nuevo.' }
  }

  revalidatePath('/grupos')
  redirect('/grupos')
}

export async function deleteGroup(groupId: string): Promise<GroupActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debés iniciar sesión' }
  }

  // Verificar que sea el owner
  const { data: memberships } = await dbSelect(supabase, 'memberships', 'role', {
    group_id: groupId,
    user_id: user.id,
  })
  const membership = memberships?.[0] as { role: string } | undefined

  if (membership?.role !== 'owner') {
    return { error: 'Solo el creador del grupo puede eliminarlo' }
  }

  // Eliminar grupo (las relaciones se eliminan en cascada)
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (error) {
    console.error('Error deleting group:', error)
    return { error: 'No pudimos eliminar el grupo. Intentá de nuevo.' }
  }

  revalidatePath('/grupos')
  redirect('/grupos')
}
