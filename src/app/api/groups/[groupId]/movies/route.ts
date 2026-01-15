import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'
import { getOrCreateMovie } from '@/services/movies'
import { isUserMemberOfGroup } from '@/services/groups'

// POST /api/groups/[groupId]/movies - Agregar película al grupo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { groupId } = await params

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
    const { tmdb_id, watched_at, attendees } = body

    if (!tmdb_id || typeof tmdb_id !== 'number') {
      return NextResponse.json(
        { error: 'El ID de TMDb es requerido' },
        { status: 400 }
      )
    }

    // Obtener o crear la película en nuestra base de datos
    const movie = await getOrCreateMovie(tmdb_id)
    if (!movie) {
      return NextResponse.json(
        { error: 'Error al obtener la película' },
        { status: 500 }
      )
    }

    // Verificar si la película ya está en el grupo
    const serviceClient = createServiceClient()
    const { data: existing } = await getTable(serviceClient, 'group_movies')
      .select('id')
      .eq('group_id', groupId)
      .eq('movie_id', movie.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Esta película ya está en el grupo' },
        { status: 400 }
      )
    }

    // Agregar película al grupo
    const { data: groupMovie, error } = await getTable(serviceClient, 'group_movies')
      .insert({
        group_id: groupId,
        movie_id: movie.id,
        added_by: user.id,
        watched_at: watched_at || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding movie to group:', error)
      return NextResponse.json(
        { error: 'Error al agregar la película' },
        { status: 500 }
      )
    }

    // Guardar asistentes si se proporcionaron
    if (attendees && Array.isArray(attendees) && attendees.length > 0) {
      const attendeeRecords = attendees.map((userId: string) => ({
        group_movie_id: groupMovie.id,
        user_id: userId,
      }))

      const { error: attendeesError } = await getTable(serviceClient, 'screening_attendees')
        .insert(attendeeRecords)

      if (attendeesError) {
        console.error('Error adding attendees:', attendeesError)
        // No fallamos por esto, la película ya se agregó
      }
    }

    return NextResponse.json({
      success: true,
      groupMovie,
      movie,
    })
  } catch (error) {
    console.error('Error adding movie to group:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// GET /api/groups/[groupId]/movies - Obtener películas del grupo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { groupId } = await params

  // Verificar que el usuario es miembro del grupo
  const isMember = await isUserMemberOfGroup(groupId, user.id)
  if (!isMember) {
    return NextResponse.json(
      { error: 'No eres miembro de este grupo' },
      { status: 403 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const sortBy = searchParams.get('sort') === 'top' ? 'top' : 'recent'

    // Importar dinámicamente para evitar problemas de circular dependency
    const { getGroupMovies } = await import('@/services/movies')
    const movies = await getGroupMovies(groupId, sortBy)

    return NextResponse.json({ movies })
  } catch (error) {
    console.error('Error getting group movies:', error)
    return NextResponse.json(
      { error: 'Error al obtener las películas' },
      { status: 500 }
    )
  }
}
