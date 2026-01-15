import { NextRequest, NextResponse } from 'next/server'
import { getTMDbClient } from '@/lib/tmdb/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  if (!query.trim()) {
    return NextResponse.json({ results: [], total_pages: 0, total_results: 0 })
  }

  try {
    const tmdbClient = getTMDbClient()
    const response = await tmdbClient.searchMovies(query, page)

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
    console.error('Error searching movies:', error)
    return NextResponse.json({ error: 'Error searching movies' }, { status: 500 })
  }
}
