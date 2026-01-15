import { getTMDbClient, extractDirector } from '@/lib/tmdb/client'
import { notFound } from 'next/navigation'
import MovieDetailContent from './movie-detail-content'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { id } = await params
  const tmdbId = parseInt(id, 10)

  if (isNaN(tmdbId)) {
    notFound()
  }

  try {
    const tmdbClient = getTMDbClient()

    // Fetch movie details, videos, and watch providers in parallel
    const [movie, videosResponse, watchProvidersResponse] = await Promise.all([
      tmdbClient.getMovieDetails(tmdbId),
      tmdbClient.getMovieVideosAllLanguages(tmdbId),
      tmdbClient.getWatchProviders(tmdbId),
    ])

    const director = extractDirector(movie.credits)

    // Find YouTube trailer - prioritize Spanish (Latin American), then Spanish, then any
    const videos = videosResponse.results.filter(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    )

    // Priority: es-MX (Mexico), es-AR (Argentina), es-ES (Spain), es (Spanish general), then any other
    const trailer =
      videos.find((v) => v.iso_639_1 === 'es' && v.iso_3166_1 === 'MX') ||
      videos.find((v) => v.iso_639_1 === 'es' && v.iso_3166_1 === 'AR') ||
      videos.find((v) => v.iso_639_1 === 'es' && v.iso_3166_1 === 'ES') ||
      videos.find((v) => v.iso_639_1 === 'es') ||
      videos[0]

    // Get Argentina watch providers
    const argentinaProviders = watchProvidersResponse.results?.AR
    const watchProviders: Array<{ name: string; logo: string; type: 'flatrate' | 'rent' | 'buy' }> = []

    // Add streaming (flatrate) providers
    if (argentinaProviders?.flatrate) {
      argentinaProviders.flatrate.forEach((p) => {
        watchProviders.push({
          name: p.provider_name,
          logo: p.logo_path,
          type: 'flatrate',
        })
      })
    }

    // Add rent providers (optional, you can remove this if you only want streaming)
    if (argentinaProviders?.rent) {
      argentinaProviders.rent.forEach((p) => {
        // Avoid duplicates
        if (!watchProviders.find((wp) => wp.name === p.provider_name)) {
          watchProviders.push({
            name: p.provider_name,
            logo: p.logo_path,
            type: 'rent',
          })
        }
      })
    }

    const mappedMovie = {
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      runtime: movie.runtime || null,
      director,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      genres: movie.genres?.map((g) => g.name) || [],
      overview: movie.overview || '',
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      tagline: movie.tagline || null,
      trailerKey: trailer?.key || null,
      cast: movie.credits?.cast?.slice(0, 10).map((c) => ({
        name: c.name,
        character: c.character,
        photo: c.profile_path,
      })) || [],
      watchProviders,
      watchProvidersLink: argentinaProviders?.link || null,
    }

    return <MovieDetailContent movie={mappedMovie} />
  } catch (error) {
    console.error('Error fetching movie details:', error)
    notFound()
  }
}
