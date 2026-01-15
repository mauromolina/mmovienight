import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTMDbClient } from '@/lib/tmdb'

// GET /api/tmdb/movie/[id] - Obtener detalles de película de TMDB
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar autenticación
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  const tmdbId = parseInt(id, 10)

  if (isNaN(tmdbId) || tmdbId <= 0) {
    return NextResponse.json(
      { error: 'ID de película inválido' },
      { status: 400 }
    )
  }

  try {
    const tmdb = getTMDbClient()
    const movie = await tmdb.getMovieDetails(tmdbId)

    // Extraer director de los créditos
    const director = movie.credits?.crew?.find((c) => c.job === 'Director')?.name || null

    return NextResponse.json({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      runtime: movie.runtime,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      genres: movie.genres,
      director,
      tagline: movie.tagline,
    })
  } catch (error) {
    console.error('TMDb movie details error:', error)
    return NextResponse.json(
      { error: 'Error al obtener detalles de la película' },
      { status: 500 }
    )
  }
}
