import { getTMDbClient, extractDirector } from '@/lib/tmdb/client'

// Genre mapping from TMDB genre IDs to Spanish names
const genreMap: Record<number, string> = {
  28: 'Acción',
  12: 'Aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familia',
  14: 'Fantasía',
  36: 'Historia',
  27: 'Terror',
  10402: 'Música',
  9648: 'Misterio',
  10749: 'Romance',
  878: 'Ciencia Ficción',
  10770: 'Película de TV',
  53: 'Thriller',
  10752: 'Bélica',
  37: 'Western',
}

export interface FeaturedMovie {
  id: number
  title: string
  year: number | null
  runtime: number | null
  director: string | null
  synopsis: string
  backdrop_path: string | null
  poster_path: string | null
  genres: string[]
  rating: number
  voteCount: number
  tagline: string | null
  streamingProviders: Array<{
    name: string
    logo: string
  }>
}

/**
 * Gets the featured movie of the week.
 *
 * This function:
 * 1. Fetches trending movies of the week
 * 2. For each movie, checks if it's available on streaming (flatrate) in Argentina
 * 3. Returns the first movie that has streaming availability
 * 4. Results are cached for 1 week via Next.js fetch caching
 */
export async function getFeaturedMovieOfTheWeek(): Promise<FeaturedMovie | null> {
  const tmdbClient = getTMDbClient()

  try {
    // Get trending movies of the week
    const trendingResponse = await tmdbClient.getTrendingMovies('week')

    // Iterate through trending movies to find one with streaming availability
    for (const movie of trendingResponse.results) {
      // Skip movies without backdrop
      if (!movie.backdrop_path) continue

      // Get watch providers for this movie
      const providersResponse = await tmdbClient.getWatchProviders(movie.id)
      const argentinaProviders = providersResponse.results?.AR

      // Check if movie has streaming (flatrate) providers in Argentina
      if (!argentinaProviders?.flatrate || argentinaProviders.flatrate.length === 0) {
        continue // Skip to next movie
      }

      // Get full movie details
      const movieDetails = await tmdbClient.getMovieDetails(movie.id)
      const director = extractDirector(movieDetails.credits)

      // Map genres
      const genres = movieDetails.genres?.map((g) => g.name) ||
        movie.genre_ids?.map((id) => genreMap[id]).filter(Boolean) as string[] || []

      // Build the featured movie object
      const featuredMovie: FeaturedMovie = {
        id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        runtime: movieDetails.runtime || null,
        director,
        synopsis: movie.overview || movieDetails.overview || '',
        backdrop_path: movie.backdrop_path,
        poster_path: movie.poster_path,
        genres: genres.slice(0, 3), // Max 3 genres
        rating: movie.vote_average,
        voteCount: movie.vote_count,
        tagline: movieDetails.tagline || null,
        streamingProviders: argentinaProviders.flatrate.slice(0, 5).map((p) => ({
          name: p.provider_name,
          logo: p.logo_path,
        })),
      }

      return featuredMovie
    }

    // If no movie found with streaming, return null
    return null
  } catch (error) {
    console.error('Error getting featured movie of the week:', error)
    return null
  }
}

/**
 * Gets the week number of the year.
 * Used for consistent weekly selection.
 */
export function getWeekNumber(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 604800000 // milliseconds in a week
  return Math.floor(diff / oneWeek)
}
