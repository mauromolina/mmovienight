import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'
import { isUserMemberOfGroup } from '@/services/groups'
import { recordActivity } from '@/services/activity'

// POST /api/groups/[groupId]/movies/[movieId]/ratings - Crear o actualizar calificación
export async function POST(
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
    const body = await request.json()
    const { score, comment } = body

    // Validar score
    if (typeof score !== 'number' || score < 1 || score > 10) {
      return NextResponse.json(
        { error: 'La calificación debe ser un número entre 1 y 10' },
        { status: 400 }
      )
    }

    // Validar comment
    if (comment && (typeof comment !== 'string' || comment.length > 1000)) {
      return NextResponse.json(
        { error: 'El comentario no puede tener más de 1000 caracteres' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Verificar que la película existe en el grupo
    const { data: groupMovie } = await getTable(serviceClient, 'group_movies')
      .select('id')
      .eq('group_id', groupId)
      .eq('movie_id', movieId)
      .single()

    if (!groupMovie) {
      return NextResponse.json(
        { error: 'Película no encontrada en este grupo' },
        { status: 404 }
      )
    }

    // Verificar si ya existe una calificación del usuario
    const { data: existingRating } = await getTable(serviceClient, 'ratings')
      .select('id')
      .eq('group_id', groupId)
      .eq('movie_id', movieId)
      .eq('user_id', user.id)
      .single()

    let rating
    let isUpdate = false

    if (existingRating) {
      // Actualizar calificación existente
      const { data, error } = await getTable(serviceClient, 'ratings')
        .update({
          score,
          comment: comment?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRating.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating rating:', error)
        return NextResponse.json(
          { error: 'Error al actualizar la calificación' },
          { status: 500 }
        )
      }

      rating = data
      isUpdate = true

      // Record activity for rating update
      await recordActivity({
        groupId,
        userId: user.id,
        activityType: 'rating_updated',
        targetMovieId: movieId,
        metadata: { score, comment: comment?.trim() || null },
      })
    } else {
      // Crear nueva calificación
      const { data, error } = await getTable(serviceClient, 'ratings')
        .insert({
          group_id: groupId,
          movie_id: movieId,
          user_id: user.id,
          score,
          comment: comment?.trim() || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating rating:', error)
        return NextResponse.json(
          { error: 'Error al crear la calificación' },
          { status: 500 }
        )
      }

      rating = data

      // Record activity for new rating
      await recordActivity({
        groupId,
        userId: user.id,
        activityType: 'movie_rated',
        targetMovieId: movieId,
        metadata: { score, comment: comment?.trim() || null },
      })
    }

    return NextResponse.json({
      success: true,
      rating,
      isUpdate,
    })
  } catch (error) {
    console.error('Error saving rating:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// GET /api/groups/[groupId]/movies/[movieId]/ratings - Obtener calificaciones de la película
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
    const { data: ratings, error } = await getTable(supabase, 'ratings')
      .select(`
        *,
        profile:profiles (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('group_id', groupId)
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting ratings:', error)
      return NextResponse.json(
        { error: 'Error al obtener las calificaciones' },
        { status: 500 }
      )
    }

    // Calcular promedio
    const scores = ratings?.map((r) => r.score) || []
    const average = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0

    // Obtener rating del usuario actual
    const userRating = ratings?.find((r) => r.user_id === user.id) || null

    return NextResponse.json({
      ratings: ratings || [],
      average,
      count: scores.length,
      userRating,
    })
  } catch (error) {
    console.error('Error getting ratings:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[groupId]/movies/[movieId]/ratings - Eliminar calificación del usuario
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

  try {
    const serviceClient = createServiceClient()

    const { error } = await getTable(serviceClient, 'ratings')
      .delete()
      .eq('group_id', groupId)
      .eq('movie_id', movieId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting rating:', error)
      return NextResponse.json(
        { error: 'Error al eliminar la calificación' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rating:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
