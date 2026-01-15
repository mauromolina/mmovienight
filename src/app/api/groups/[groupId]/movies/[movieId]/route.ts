import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'
import { isUserMemberOfGroup, getUserMembership } from '@/services/groups'
import { getMovieWithRatings } from '@/services/movies'

// GET /api/groups/[groupId]/movies/[movieId] - Obtener película con ratings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; movieId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { groupId, movieId } = await params

  // Verificar que el usuario es miembro del grupo
  const isMember = await isUserMemberOfGroup(groupId, user.id)
  if (!isMember) {
    return NextResponse.json(
      { error: 'No eres miembro de este grupo' },
      { status: 403 }
    )
  }

  try {
    const movieWithRatings = await getMovieWithRatings(groupId, movieId)

    if (!movieWithRatings) {
      return NextResponse.json(
        { error: 'Película no encontrada en este grupo' },
        { status: 404 }
      )
    }

    return NextResponse.json({ movie: movieWithRatings })
  } catch (error) {
    console.error('Error getting movie:', error)
    return NextResponse.json(
      { error: 'Error al obtener la película' },
      { status: 500 }
    )
  }
}

// PATCH /api/groups/[groupId]/movies/[movieId] - Actualizar película (marcar como vista)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; movieId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { groupId, movieId } = await params

  // Verificar que el usuario es miembro del grupo
  const membership = await getUserMembership(groupId, user.id)
  if (!membership) {
    return NextResponse.json(
      { error: 'No eres miembro de este grupo' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { watched_at } = body

    const serviceClient = createServiceClient()

    // Verificar que la película existe en el grupo
    const { data: groupMovie } = await getTable(serviceClient, 'group_movies')
      .select('id, added_by')
      .eq('group_id', groupId)
      .eq('movie_id', movieId)
      .single()

    if (!groupMovie) {
      return NextResponse.json(
        { error: 'Película no encontrada en este grupo' },
        { status: 404 }
      )
    }

    // Solo el que agregó la película o el owner del grupo puede modificarla
    if (groupMovie.added_by !== user.id && membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar esta película' },
        { status: 403 }
      )
    }

    // Actualizar la película
    const { data: updated, error } = await getTable(serviceClient, 'group_movies')
      .update({ watched_at: watched_at || null })
      .eq('id', groupMovie.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating group movie:', error)
      return NextResponse.json(
        { error: 'Error al actualizar la película' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      groupMovie: updated,
    })
  } catch (error) {
    console.error('Error updating movie:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[groupId]/movies/[movieId] - Eliminar película del grupo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; movieId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { groupId, movieId } = await params

  // Verificar que el usuario es owner del grupo
  const membership = await getUserMembership(groupId, user.id)
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json(
      { error: 'Solo el owner puede eliminar películas' },
      { status: 403 }
    )
  }

  try {
    const serviceClient = createServiceClient()

    const { error } = await getTable(serviceClient, 'group_movies')
      .delete()
      .eq('group_id', groupId)
      .eq('movie_id', movieId)

    if (error) {
      console.error('Error deleting group movie:', error)
      return NextResponse.json(
        { error: 'Error al eliminar la película' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting movie:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
