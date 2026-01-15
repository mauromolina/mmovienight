import { getTMDbClient } from '@/lib/tmdb/client'
import ExploreContent from '@/components/movies/explore-content'
import { getFeaturedMovieOfTheWeek } from '@/services/featured-movie'

// Revalidate featured movie every week (604800 seconds)
export const revalidate = 604800

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

// Badge options for critically acclaimed movies
const badges = ['Must Watch', 'Masterpiece', 'Oscar Winner', 'Cult Classic']

export default async function ExplorePage() {
  const tmdbClient = getTMDbClient()

  // Fetch data from TMDB API in parallel, including featured movie
  const [topRatedResponse, nowPlayingResponse, popularResponse, featuredMovie] = await Promise.all([
    tmdbClient.getTopRatedMovies(1),
    tmdbClient.getNowPlayingMovies(1),
    tmdbClient.getPopularMovies(1),
    getFeaturedMovieOfTheWeek(),
  ])

  // Map top rated movies to critically acclaimed format
  const criticallyAcclaimed = topRatedResponse.results.slice(0, 15).map((movie, index) => {
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
    const primaryGenre = movie.genre_ids?.[0] ? genreMap[movie.genre_ids[0]] || 'Drama' : 'Drama'

    return {
      id: movie.id,
      title: movie.title,
      year,
      poster: movie.poster_path,
      rating: movie.vote_average,
      genre: primaryGenre,
      badge: badges[index % badges.length],
    }
  })

  // Map now playing movies to new releases format
  const newReleases = nowPlayingResponse.results.slice(0, 15).map((movie) => {
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
    const primaryGenre = movie.genre_ids?.[0] ? genreMap[movie.genre_ids[0]] || 'Drama' : 'Drama'

    return {
      id: movie.id,
      title: movie.title,
      year,
      poster: movie.poster_path,
      rating: movie.vote_average,
      genre: primaryGenre,
      isNew: true,
    }
  })

  // Map popular movies to discover format
  const discoverMovies = popularResponse.results.slice(0, 15).map((movie) => {
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
    const primaryGenre = movie.genre_ids?.[0] ? genreMap[movie.genre_ids[0]] || 'Drama' : 'Drama'

    return {
      id: movie.id,
      title: movie.title,
      year,
      poster: movie.poster_path,
      rating: movie.vote_average,
      genre: primaryGenre,
    }
  })

  return (
    <ExploreContent
      featuredMovie={featuredMovie}
      discoverMovies={discoverMovies}
      criticallyAcclaimed={criticallyAcclaimed}
      newReleases={newReleases}
    />
  )
}
