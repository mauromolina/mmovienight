import { NextRequest, NextResponse } from 'next/server'
import { getTMDbClient } from '@/lib/tmdb/client'

// Genre mapping from Spanish names to TMDB IDs
const genreNameToId: Record<string, number> = {
  'Acción': 28,
  'Aventura': 12,
  'Animación': 16,
  'Comedia': 35,
  'Crimen': 80,
  'Documental': 99,
  'Drama': 18,
  'Familia': 10751,
  'Fantasía': 14,
  'Historia': 36,
  'Terror': 27,
  'Música': 10402,
  'Misterio': 9648,
  'Romance': 10749,
  'Ciencia Ficción': 878,
  'Thriller': 53,
  'Bélica': 10752,
  'Western': 37,
}

// Platform/Watch provider mapping for Argentina
const platformNameToId: Record<string, number> = {
  'Netflix': 8,
  'Prime Video': 119,
  'Disney+': 337,
  'HBO Max': 384,
  'Apple TV+': 350,
  'Paramount+': 531,
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1', 10)
  const genre = searchParams.get('genre') || 'Todos'
  const year = searchParams.get('year') || 'Todos'
  const duration = searchParams.get('duration') || 'Todas'
  const platform = searchParams.get('platform') || 'Todas'

  try {
    const tmdbClient = getTMDbClient()

    // Build filter options
    const options: {
      page: number
      genres?: number[]
      yearGte?: string
      yearLte?: string
      runtimeGte?: number
      runtimeLte?: number
      watchProviders?: number[]
    } = { page }

    // Genre filter
    if (genre !== 'Todos' && genreNameToId[genre]) {
      options.genres = [genreNameToId[genre]]
    }

    // Year filter
    if (year !== 'Todos') {
      switch (year) {
        case '2024':
        case '2023':
        case '2022':
        case '2021':
        case '2020':
          options.yearGte = year
          options.yearLte = year
          break
        case '2010s':
          options.yearGte = '2010'
          options.yearLte = '2019'
          break
        case '2000s':
          options.yearGte = '2000'
          options.yearLte = '2009'
          break
        case 'Clásicos':
          options.yearLte = '1999'
          break
      }
    }

    // Duration filter
    if (duration !== 'Todas') {
      switch (duration) {
        case '< 90 min':
          options.runtimeLte = 90
          break
        case '90-120 min':
          options.runtimeGte = 90
          options.runtimeLte = 120
          break
        case '120-150 min':
          options.runtimeGte = 120
          options.runtimeLte = 150
          break
        case '> 150 min':
          options.runtimeGte = 150
          break
      }
    }

    // Platform filter
    if (platform !== 'Todas' && platformNameToId[platform]) {
      options.watchProviders = [platformNameToId[platform]]
    }

    const response = await tmdbClient.discoverMovies(options)

    // Map results to simplified format
    const results = response.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      genre_ids: movie.genre_ids,
    }))

    return NextResponse.json({
      results,
      total_pages: response.total_pages,
      total_results: response.total_results,
      page: response.page,
    })
  } catch (error) {
    console.error('Error discovering movies:', error)
    return NextResponse.json({ error: 'Error discovering movies' }, { status: 500 })
  }
}
