import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/services/groups'
import { getTable } from '@/lib/supabase/db'

// Remove member from group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const { groupId, memberId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario actual es owner del grupo
    const currentUserMembership = await getUserMembership(groupId, user.id)
    if (!currentUserMembership || currentUserMembership.role !== 'owner') {
      return NextResponse.json({ error: 'No tenés permisos para eliminar miembros' }, { status: 403 })
    }

    // No se puede eliminar al owner
    const targetMembership = await getUserMembership(groupId, memberId)
    if (!targetMembership) {
      return NextResponse.json({ error: 'El usuario no es miembro del grupo' }, { status: 404 })
    }

    if (targetMembership.role === 'owner') {
      return NextResponse.json({ error: 'No se puede eliminar al administrador del grupo' }, { status: 400 })
    }

    // No se puede eliminar a uno mismo
    if (memberId === user.id) {
      return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 })
    }

    // Eliminar la membresía usando service client
    const serviceClient = createServiceClient()
    const { error } = await getTable(serviceClient, 'memberships')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', memberId)

    if (error) {
      console.error('Error removing member:', error)
      return NextResponse.json({ error: 'Error al eliminar el miembro' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/groups/[groupId]/members/[memberId]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
