import { createClient } from '@/lib/supabase/server'
import { getTable, dbInsert } from '@/lib/supabase/db'
import { getTMDbClient, mapTMDbMovieToInsert } from '@/lib/tmdb'
import type { Movie, GroupMovieWithDetails, MovieWithGroupData, RatingWithProfile, Profile, ScreeningType } from '@/types'

interface GroupMovieWithMovie {
  id: string
  group_id: string
  movie_id: string
  watched_at: string | null
  added_by: string
  screening_type: ScreeningType
  created_at: string
  movie: Movie
}

interface RatingRecord {
  movie_id: string
  score: number
  user_id: string
}

interface RatingWithProfileRecord {
  id: string
  group_id: string
  movie_id: string
  user_id: string
  score: number
  comment: string | null
  created_at: string
  updated_at: string
  profile: Profile
}

export async function getOrCreateMovie(tmdbId: number): Promise<Movie | null> {
  const supabase = await createClient()

  // Primero, buscar si ya existe
  const { data: existing } = await getTable(supabase, 'movies')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .single()

  if (existing) {
    return existing as Movie
  }

  // Si no existe, obtener de TMDb y crear
  try {
    const tmdb = getTMDbClient()
    const movieDetails = await tmdb.getMovieDetails(tmdbId)
    const movieData = mapTMDbMovieToInsert(movieDetails)

    const { error } = await dbInsert(supabase, 'movies', movieData)

    if (error) {
      console.error('Error creating movie:', error)
      return null
    }

    // Fetch the newly created movie
    const { data: newMovie } = await getTable(supabase, 'movies')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .single()

    return newMovie as Movie | null
  } catch (error) {
    console.error('Error fetching movie from TMDb:', error)
    return null
  }
}

export async function getGroupMovies(
  groupId: string,
  sortBy: 'recent' | 'top' = 'recent'
): Promise<GroupMovieWithDetails[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Obtener películas del grupo con datos de la película
  const { data: groupMoviesData, error } = await getTable(supabase, 'group_movies')
    .select(`
      *,
      movie:movies (*)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  const groupMovies = groupMoviesData as GroupMovieWithMovie[] | null

  if (error || !groupMovies) return []

  // Obtener ratings para calcular promedios
  const { data: allRatingsData } = await getTable(supabase, 'ratings')
    .select('movie_id, score, user_id')
    .eq('group_id', groupId)

  const allRatings = allRatingsData as RatingRecord[] | null

  // Mapear con cálculos
  const moviesWithDetails: GroupMovieWithDetails[] = groupMovies.map((gm) => {
    const movieRatings = allRatings?.filter((r) => r.movie_id === gm.movie_id) || []
    const scores = movieRatings.map((r) => r.score)
    const average = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0

    const userRatingData = user
      ? movieRatings.find((r) => r.user_id === user.id)
      : null

    return {
      ...gm,
      movie: gm.movie,
      average_rating: average,
      rating_count: scores.length,
      user_rating: userRatingData
        ? {
            id: '',
            group_id: groupId,
            movie_id: gm.movie_id,
            user_id: user!.id,
            score: userRatingData.score,
            comment: null,
            created_at: '',
            updated_at: '',
          }
        : null,
    }
  })

  // Ordenar
  if (sortBy === 'top') {
    moviesWithDetails.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
  }

  return moviesWithDetails
}

export async function getMovieWithRatings(
  groupId: string,
  movieId: string
): Promise<MovieWithGroupData | null> {
  const supabase = await createClient()

  // Obtener la película del grupo
  const { data: groupMovieData, error: gmError } = await getTable(supabase, 'group_movies')
    .select(`
      *,
      movie:movies (*)
    `)
    .eq('group_id', groupId)
    .eq('movie_id', movieId)
    .single()

  const groupMovie = groupMovieData as GroupMovieWithMovie | null

  if (gmError || !groupMovie) return null

  // Obtener ratings con perfiles
  const { data: ratingsData, error: ratingsError } = await getTable(supabase, 'ratings')
    .select(`
      *,
      profile:profiles (*)
    `)
    .eq('group_id', groupId)
    .eq('movie_id', movieId)
    .order('created_at', { ascending: false })

  const ratings = ratingsData as RatingWithProfileRecord[] | null

  if (ratingsError) return null

  // Obtener asistentes a la proyección
  const { data: attendeesData } = await getTable(supabase, 'screening_attendees')
    .select(`
      user_id,
      profile:profiles (
        id,
        display_name,
        avatar_url,
        email
      )
    `)
    .eq('group_movie_id', groupMovie.id)

  const attendees = (attendeesData || []).map((a: any) => ({
    user_id: a.user_id,
    profile: a.profile,
  }))

  const ratingScores = ratings?.map((r) => r.score) || []
  const averageRating = ratingScores.length > 0
    ? Math.round((ratingScores.reduce((a, b) => a + b, 0) / ratingScores.length) * 10) / 10
    : 0

  const movie = groupMovie.movie

  return {
    ...movie,
    group_movie: {
      id: groupMovie.id,
      group_id: groupMovie.group_id,
      movie_id: groupMovie.movie_id,
      watched_at: groupMovie.watched_at,
      added_by: groupMovie.added_by,
      screening_type: groupMovie.screening_type,
      created_at: groupMovie.created_at,
    },
    average_rating: averageRating,
    rating_count: ratingScores.length,
    ratings: ratings?.map((r) => ({
      ...r,
      profile: r.profile as RatingWithProfile['profile'],
    })) || [],
    attendees,
  }
}

export async function getUserRatingForMovie(
  groupId: string,
  movieId: string,
  userId: string
): Promise<{
  id: string
  score: number
  comment: string | null
  created_at: string
  updated_at: string
} | null> {
  const supabase = await createClient()

  const { data, error } = await getTable(supabase, 'ratings')
    .select('*')
    .eq('group_id', groupId)
    .eq('movie_id', movieId)
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data as {
    id: string
    score: number
    comment: string | null
    created_at: string
    updated_at: string
  }
}

export interface UserStats {
  moviesWatched: number
  reviewsWritten: number
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient()

  // Contar películas únicas que el usuario ha calificado
  const { data: ratingsData, error: ratingsError } = await getTable(supabase, 'ratings')
    .select('movie_id, comment')
    .eq('user_id', userId)

  if (ratingsError || !ratingsData) {
    return { moviesWatched: 0, reviewsWritten: 0 }
  }

  // Películas únicas
  const uniqueMovies = new Set(ratingsData.map((r: any) => r.movie_id))

  // Reseñas con comentario
  const reviewsWithComment = ratingsData.filter((r: any) => r.comment && r.comment.trim() !== '')

  return {
    moviesWatched: uniqueMovies.size,
    reviewsWritten: reviewsWithComment.length,
  }
}

export interface UserRatingWithMovie {
  id: string
  score: number
  comment: string | null
  created_at: string
  group_id: string
  movie: {
    id: string
    title: string
    year: number | null
    poster_path: string | null
  }
  group: {
    id: string
    name: string
  }
}

export async function getUserRecentRatings(userId: string, limit: number = 5): Promise<UserRatingWithMovie[]> {
  const supabase = await createClient()

  const { data, error } = await getTable(supabase, 'ratings')
    .select(`
      id,
      score,
      comment,
      created_at,
      group_id,
      movie:movies (
        id,
        title,
        year,
        poster_path
      ),
      group:groups (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data.map((r: any) => ({
    id: r.id,
    score: r.score,
    comment: r.comment,
    created_at: r.created_at,
    group_id: r.group_id,
    movie: r.movie,
    group: r.group,
  }))
}

export interface GenreStats {
  name: string
  count: number
  percentage: number
  color: string
}

// Colors for genres - cinematographic palette
const GENRE_COLORS: Record<string, string> = {
  'Action': '#EF4444',
  'Acción': '#EF4444',
  'Adventure': '#F97316',
  'Aventura': '#F97316',
  'Animation': '#8B5CF6',
  'Animación': '#8B5CF6',
  'Comedy': '#FBBF24',
  'Comedia': '#FBBF24',
  'Crime': '#6B7280',
  'Crimen': '#6B7280',
  'Documentary': '#10B981',
  'Documental': '#10B981',
  'Drama': '#3B82F6',
  'Family': '#EC4899',
  'Familia': '#EC4899',
  'Fantasy': '#A855F7',
  'Fantasía': '#A855F7',
  'History': '#92400E',
  'Historia': '#92400E',
  'Horror': '#991B1B',
  'Terror': '#991B1B',
  'Music': '#14B8A6',
  'Música': '#14B8A6',
  'Mystery': '#6366F1',
  'Misterio': '#6366F1',
  'Romance': '#F43F5E',
  'Science Fiction': '#06B6D4',
  'Ciencia ficción': '#06B6D4',
  'TV Movie': '#9CA3AF',
  'Película de TV': '#9CA3AF',
  'Thriller': '#DC2626',
  'Suspenso': '#DC2626',
  'War': '#78716C',
  'Bélica': '#78716C',
  'Guerra': '#78716C',
  'Western': '#D97706',
}

const DEFAULT_COLOR = '#16C7D9'

export async function getUserTopGenres(userId: string, limit: number = 5): Promise<GenreStats[]> {
  const supabase = await createClient()

  // Get all movies the user has rated with their genres
  const { data, error } = await getTable(supabase, 'ratings')
    .select(`
      movie:movies (
        genres
      )
    `)
    .eq('user_id', userId)

  if (error || !data || data.length === 0) {
    return []
  }

  // Count genre occurrences
  const genreCounts: Record<string, number> = {}
  let totalGenres = 0

  for (const rating of data) {
    const movieRaw = rating.movie as unknown
    const movie = (Array.isArray(movieRaw) ? movieRaw[0] : movieRaw) as { genres: string[] | null } | null
    if (movie?.genres && Array.isArray(movie.genres)) {
      for (const genre of movie.genres) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1
        totalGenres++
      }
    }
  }

  if (totalGenres === 0) {
    return []
  }

  // Convert to array, calculate percentages, and sort
  const genreStats: GenreStats[] = Object.entries(genreCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalGenres) * 100),
      color: GENRE_COLORS[name] || DEFAULT_COLOR,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  return genreStats
}

export interface WatchlistItemWithDetails {
  id: string
  group_id: string
  movie_id: string
  added_by: string
  reason: string | null
  priority: number
  created_at: string
  movie: {
    id: string
    tmdb_id: number
    title: string
    year: number | null
    poster_path: string | null
    backdrop_path: string | null
    director: string | null
    genres: string[] | null
    overview: string | null
  }
  added_by_profile: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export interface UserFavoriteMovie {
  id: string
  tmdb_id: number
  title: string
  year: number | null
  poster_path: string | null
  created_at: string // When it was favorited
}

export async function getUserFavorites(userId: string): Promise<UserFavoriteMovie[]> {
  const supabase = await createClient()

  const { data: favorites, error } = await getTable(supabase, 'favorite_movies')
    .select(`
      id,
      created_at,
      movie:movies (
        id,
        tmdb_id,
        title,
        year,
        poster_path
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !favorites) {
    return []
  }

  return favorites.map((f: any) => ({
    id: f.movie.id,
    tmdb_id: f.movie.tmdb_id,
    title: f.movie.title,
    year: f.movie.year,
    poster_path: f.movie.poster_path,
    created_at: f.created_at,
  }))
}

export async function getGroupWatchlist(groupId: string): Promise<WatchlistItemWithDetails[]> {
  const supabase = await createClient()

  // First get watchlist items with movies
  const { data: items, error } = await getTable(supabase, 'watchlist_items')
    .select(`
      *,
      movie:movies (*)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching watchlist:', error)
    return []
  }

  if (!items || items.length === 0) {
    return []
  }

  // Get profiles for all users who added items
  const userIds = [...new Set(items.map((item: any) => item.added_by))]
  const { data: profiles } = await getTable(supabase, 'profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles || []).map((p: any) => [p.id, p])
  )

  // Combine the data
  return items.map((item: any) => ({
    ...item,
    added_by_profile: profileMap.get(item.added_by) || null,
  })) as WatchlistItemWithDetails[]
}
