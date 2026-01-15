import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserMembership, getGroupById, getGroupMembers } from '@/services/groups'
import { getTable } from '@/lib/supabase/db'

// Get group with members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es miembro del grupo
    const membership = await getUserMembership(groupId, user.id)
    if (!membership) {
      return NextResponse.json({ error: 'No sos miembro de este grupo' }, { status: 403 })
    }

    // Obtener grupo y miembros
    const [group, members] = await Promise.all([
      getGroupById(groupId),
      getGroupMembers(groupId),
    ])

    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ group, members })
  } catch (error) {
    console.error('Error in GET /api/groups/[groupId]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Update group
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const body = await request.json()
    const { name, description } = body

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es owner del grupo
    const membership = await getUserMembership(groupId, user.id)
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'No tenés permisos para editar este grupo' }, { status: 403 })
    }

    // Validar nombre
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'El nombre debe tener al menos 2 caracteres' }, { status: 400 })
    }

    // Actualizar grupo usando service client
    const serviceClient = createServiceClient()
    const { data, error } = await getTable(serviceClient, 'groups')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select()
      .single()

    if (error) {
      console.error('Error updating group:', error)
      return NextResponse.json({ error: 'Error al actualizar el grupo' }, { status: 500 })
    }

    return NextResponse.json({ group: data })
  } catch (error) {
    console.error('Error in PATCH /api/groups/[groupId]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Delete group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es owner del grupo
    const membership = await getUserMembership(groupId, user.id)
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'No tenés permisos para eliminar este grupo' }, { status: 403 })
    }

    // Eliminar grupo usando service client (las FK con CASCADE eliminarán los datos relacionados)
    const serviceClient = createServiceClient()
    const { error } = await getTable(serviceClient, 'groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      console.error('Error deleting group:', error)
      return NextResponse.json({ error: 'Error al eliminar el grupo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/groups/[groupId]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
