import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/services/groups'
import { getOrCreateMovie } from '@/services/movies'
import { getTable, dbInsert } from '@/lib/supabase/db'

// Add movie to group watchlist
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tmdbId, groupId, reason } = body

    if (!tmdbId || !groupId) {
      return NextResponse.json(
        { error: 'tmdbId y groupId son requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verify user is member of the group
    const membership = await getUserMembership(groupId, user.id)
    if (!membership) {
      return NextResponse.json(
        { error: 'No sos miembro de este grupo' },
        { status: 403 }
      )
    }

    // Get or create the movie in our database
    const movie = await getOrCreateMovie(tmdbId)
    if (!movie) {
      return NextResponse.json(
        { error: 'No se pudo obtener la información de la película' },
        { status: 500 }
      )
    }

    // Check if movie is already in watchlist
    const serviceClient = createServiceClient()
    const { data: existing } = await getTable(serviceClient, 'watchlist_items')
      .select('id')
      .eq('group_id', groupId)
      .eq('movie_id', movie.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Esta película ya está en la watchlist del grupo' },
        { status: 400 }
      )
    }

    // Check if movie has already been watched by the group
    const { data: watchedMovie } = await getTable(serviceClient, 'group_movies')
      .select('id')
      .eq('group_id', groupId)
      .eq('movie_id', movie.id)
      .single()

    if (watchedMovie) {
      return NextResponse.json(
        { error: 'Esta película ya fue vista por el grupo' },
        { status: 400 }
      )
    }

    // Add to watchlist
    const { error: insertError } = await dbInsert(serviceClient, 'watchlist_items', {
      group_id: groupId,
      movie_id: movie.id,
      added_by: user.id,
      reason: reason?.trim() || null,
      priority: 0,
    })

    if (insertError) {
      console.error('Error adding to watchlist:', insertError)
      return NextResponse.json(
        { error: 'Error al agregar a la watchlist' },
        { status: 500 }
      )
    }

    // Note: Activity is recorded automatically by database trigger (on_watchlist_item_added)

    return NextResponse.json({
      success: true,
      movie: {
        id: movie.id,
        title: movie.title,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/watchlist:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
