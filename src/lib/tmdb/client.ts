import type {
  TMDbSearchResponse,
  TMDbMovieDetails,
  TMDbMovie,
  TMDbVideosResponse,
  TMDbWatchProvidersResponse,
} from '@/types/tmdb'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

class TMDbClient {
  private apiKey: string
  private language = 'es-AR'

  constructor() {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
      throw new Error('TMDB_API_KEY no está configurado')
    }
    this.apiKey = apiKey
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
    url.searchParams.set('api_key', this.apiKey)
    url.searchParams.set('language', this.language)

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache por 1 hora
    })

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async searchMovies(query: string, page: number = 1): Promise<TMDbSearchResponse> {
    if (!query.trim()) {
      return { page: 1, results: [], total_pages: 0, total_results: 0 }
    }

    return this.fetch<TMDbSearchResponse>('/search/movie', {
      query: query.trim(),
      page: page.toString(),
      include_adult: 'false',
    })
  }

  async getMovieDetails(tmdbId: number): Promise<TMDbMovieDetails> {
    return this.fetch<TMDbMovieDetails>(`/movie/${tmdbId}`, {
      append_to_response: 'credits,videos',
    })
  }

  async getMovieVideos(tmdbId: number, language?: string): Promise<TMDbVideosResponse> {
    const params: Record<string, string> = {}
    if (language) {
      params.language = language
    }
    return this.fetch<TMDbVideosResponse>(`/movie/${tmdbId}/videos`, params)
  }

  async getMovieVideosAllLanguages(tmdbId: number): Promise<TMDbVideosResponse> {
    // Fetch videos in multiple languages and combine results
    const [esVideos, defaultVideos] = await Promise.all([
      this.fetch<TMDbVideosResponse>(`/movie/${tmdbId}/videos`, { language: 'es-MX' }),
      this.fetch<TMDbVideosResponse>(`/movie/${tmdbId}/videos`, {}),
    ])

    // Combine and deduplicate by video key
    const allVideos = [...esVideos.results, ...defaultVideos.results]
    const uniqueVideos = allVideos.filter(
      (video, index, self) => index === self.findIndex((v) => v.key === video.key)
    )

    return {
      id: tmdbId,
      results: uniqueVideos,
    }
  }

  async getPopularMovies(page: number = 1): Promise<TMDbSearchResponse> {
    return this.fetch<TMDbSearchResponse>('/movie/popular', {
      page: page.toString(),
    })
  }

  async getNowPlayingMovies(page: number = 1): Promise<TMDbSearchResponse> {
    return this.fetch<TMDbSearchResponse>('/movie/now_playing', {
      page: page.toString(),
      region: 'AR',
    })
  }

  async getTopRatedMovies(page: number = 1): Promise<TMDbSearchResponse> {
    return this.fetch<TMDbSearchResponse>('/movie/top_rated', {
      page: page.toString(),
    })
  }

  async getUpcomingMovies(page: number = 1): Promise<TMDbSearchResponse> {
    return this.fetch<TMDbSearchResponse>('/movie/upcoming', {
      page: page.toString(),
      region: 'AR',
    })
  }

  async discoverMovies(options: {
    page?: number
    genres?: number[]
    yearGte?: string
    yearLte?: string
    runtimeGte?: number
    runtimeLte?: number
    watchProviders?: number[]
    sortBy?: string
  } = {}): Promise<TMDbSearchResponse> {
    const params: Record<string, string> = {
      page: (options.page || 1).toString(),
      sort_by: options.sortBy || 'popularity.desc',
      'vote_count.gte': '50', // Minimum votes for quality
      watch_region: 'AR',
    }

    if (options.genres && options.genres.length > 0) {
      params.with_genres = options.genres.join(',')
    }

    if (options.yearGte) {
      params['primary_release_date.gte'] = `${options.yearGte}-01-01`
    }

    if (options.yearLte) {
      params['primary_release_date.lte'] = `${options.yearLte}-12-31`
    }

    if (options.runtimeGte !== undefined) {
      params['with_runtime.gte'] = options.runtimeGte.toString()
    }

    if (options.runtimeLte !== undefined) {
      params['with_runtime.lte'] = options.runtimeLte.toString()
    }

    if (options.watchProviders && options.watchProviders.length > 0) {
      params.with_watch_providers = options.watchProviders.join('|')
    }

    return this.fetch<TMDbSearchResponse>('/discover/movie', params)
  }

  async getGenres(): Promise<{ genres: Array<{ id: number; name: string }> }> {
    return this.fetch<{ genres: Array<{ id: number; name: string }> }>('/genre/movie/list')
  }

  async getWatchProviders(tmdbId: number): Promise<TMDbWatchProvidersResponse> {
    return this.fetch<TMDbWatchProvidersResponse>(`/movie/${tmdbId}/watch/providers`)
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<TMDbSearchResponse> {
    return this.fetch<TMDbSearchResponse>(`/trending/movie/${timeWindow}`)
  }
}

// Singleton para el cliente
let tmdbClient: TMDbClient | null = null

export function getTMDbClient(): TMDbClient {
  if (!tmdbClient) {
    tmdbClient = new TMDbClient()
  }
  return tmdbClient
}

// Helper para extraer el director de los créditos
export function extractDirector(credits?: TMDbMovieDetails['credits']): string | null {
  if (!credits?.crew) return null
  const director = credits.crew.find((c) => c.job === 'Director')
  return director?.name || null
}

// Helper para mapear película de TMDb a nuestro modelo
export function mapTMDbMovieToInsert(movie: TMDbMovieDetails) {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return {
    tmdb_id: movie.id,
    title: movie.title,
    year,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    runtime: movie.runtime || null,
    overview: movie.overview || null,
    director: extractDirector(movie.credits),
    genres: movie.genres?.map((g) => g.name) || null,
    metadata: {
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      tagline: movie.tagline,
    },
  }
}

// Helper para mapear resultado de búsqueda a formato simplificado
export function mapSearchResultToSimple(movie: TMDbMovie) {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return {
    tmdb_id: movie.id,
    title: movie.title,
    year,
    poster_path: movie.poster_path,
    overview: movie.overview,
    vote_average: movie.vote_average,
  }
}
