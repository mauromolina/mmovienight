// Tipos para la API de TMDb

export interface TMDbMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  adult: boolean
  genre_ids?: number[]
  genres?: TMDbGenre[]
  runtime?: number
  credits?: {
    crew: TMDbCrewMember[]
    cast: TMDbCastMember[]
  }
}

export interface TMDbGenre {
  id: number
  name: string
}

export interface TMDbCrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

export interface TMDbCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface TMDbSearchResponse {
  page: number
  results: TMDbMovie[]
  total_pages: number
  total_results: number
}

export interface TMDbVideo {
  id: string
  iso_639_1: string
  iso_3166_1: string
  key: string
  name: string
  site: string
  size: number
  type: string
  official: boolean
  published_at: string
}

export interface TMDbVideosResponse {
  id: number
  results: TMDbVideo[]
}

export interface TMDbWatchProvider {
  logo_path: string
  provider_id: number
  provider_name: string
  display_priority: number
}

export interface TMDbWatchProviderCountry {
  link: string
  flatrate?: TMDbWatchProvider[]
  rent?: TMDbWatchProvider[]
  buy?: TMDbWatchProvider[]
  ads?: TMDbWatchProvider[]
  free?: TMDbWatchProvider[]
}

export interface TMDbWatchProvidersResponse {
  id: number
  results: Record<string, TMDbWatchProviderCountry>
}

export interface TMDbMovieDetails extends TMDbMovie {
  runtime: number
  genres: TMDbGenre[]
  credits: {
    crew: TMDbCrewMember[]
    cast: TMDbCastMember[]
  }
  videos?: {
    results: TMDbVideo[]
  }
  status: string
  tagline: string
  budget: number
  revenue: number
  production_companies: {
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }[]
}

// Utilidad para construir URLs de imágenes de TMDb
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

export type TMDbImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'

export function getTMDbImageUrl(
  path: string | null,
  size: TMDbImageSize = 'w500'
): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}
