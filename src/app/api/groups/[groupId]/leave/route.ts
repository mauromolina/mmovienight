import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/services/groups'
import { getTable, dbInsert } from '@/lib/supabase/db'

// POST /api/groups/[groupId]/leave - Leave a group
export async function POST(
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

    // Verificar membresía
    const membership = await getUserMembership(groupId, user.id)
    if (!membership) {
      return NextResponse.json({ error: 'No sos miembro de este grupo' }, { status: 404 })
    }

    // El owner no puede abandonar el grupo
    if (membership.role === 'owner') {
      return NextResponse.json(
        { error: 'El administrador no puede abandonar el grupo. Debés eliminarlo o transferir la propiedad.' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Obtener el nombre del usuario antes de eliminarlo
    const { data: profile } = await getTable(serviceClient, 'profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single()

    const userName = profile?.display_name || profile?.email?.split('@')[0] || 'Usuario'

    // Eliminar la membresía
    const { error: deleteError } = await getTable(serviceClient, 'memberships')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error leaving group:', deleteError)
      return NextResponse.json({ error: 'Error al abandonar el grupo' }, { status: 500 })
    }

    // Registrar actividad con el nombre guardado en metadata
    await dbInsert(serviceClient, 'activity_feed', {
      group_id: groupId,
      user_id: user.id,
      activity_type: 'member_left',
      metadata: { user_name: userName },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/groups/[groupId]/leave:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
