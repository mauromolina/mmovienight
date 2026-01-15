import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/services/groups'
import { getTable } from '@/lib/supabase/db'

// Remove movie from watchlist
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get the watchlist item to verify group membership
    const serviceClient = createServiceClient()
    const { data: item, error: fetchError } = await getTable(serviceClient, 'watchlist_items')
      .select('id, group_id, added_by')
      .eq('id', itemId)
      .single()

    if (fetchError || !item) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }

    // Verify user is member of the group
    const membership = await getUserMembership(item.group_id, user.id)
    if (!membership) {
      return NextResponse.json(
        { error: 'No sos miembro de este grupo' },
        { status: 403 }
      )
    }

    // Only owner or the person who added it can remove
    const isOwner = membership.role === 'owner'
    const isAdder = item.added_by === user.id

    if (!isOwner && !isAdder) {
      return NextResponse.json(
        { error: 'Solo el administrador o quien agregó la película puede eliminarla' },
        { status: 403 }
      )
    }

    // Delete the item
    const { error: deleteError } = await getTable(serviceClient, 'watchlist_items')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      console.error('Error deleting watchlist item:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar de la watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/watchlist/[itemId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
