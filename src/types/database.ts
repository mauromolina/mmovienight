// Tipos generados para la base de datos Supabase
// Este archivo define la estructura de las tablas

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type MemberRole = 'owner' | 'member'
export type InviteStatus = 'pending' | 'accepted' | 'expired'
export type ScreeningType = 'presencial' | 'remota'
export type ActivityType =
  | 'group_created'
  | 'movie_added'
  | 'movie_rated'
  | 'rating_updated'
  | 'watchlist_added'
  | 'comment_added'
  | 'member_joined'
  | 'member_left'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          banner_url: string | null
          banner_preset: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          banner_url?: string | null
          banner_preset?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          banner_url?: string | null
          banner_preset?: string | null
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          image_url?: string | null
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: MemberRole
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: MemberRole
          created_at?: string
        }
        Update: {
          role?: MemberRole
        }
      }
      movies: {
        Row: {
          id: string
          tmdb_id: number
          title: string
          year: number | null
          poster_path: string | null
          backdrop_path: string | null
          runtime: number | null
          overview: string | null
          director: string | null
          genres: string[] | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tmdb_id: number
          title: string
          year?: number | null
          poster_path?: string | null
          backdrop_path?: string | null
          runtime?: number | null
          overview?: string | null
          director?: string | null
          genres?: string[] | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          title?: string
          year?: number | null
          poster_path?: string | null
          backdrop_path?: string | null
          runtime?: number | null
          overview?: string | null
          director?: string | null
          genres?: string[] | null
          metadata?: Json | null
        }
      }
      group_movies: {
        Row: {
          id: string
          group_id: string
          movie_id: string
          watched_at: string | null
          added_by: string
          screening_type: ScreeningType
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          movie_id: string
          watched_at?: string | null
          added_by: string
          screening_type?: ScreeningType
          created_at?: string
        }
        Update: {
          watched_at?: string | null
          screening_type?: ScreeningType
        }
      }
      ratings: {
        Row: {
          id: string
          group_id: string
          movie_id: string
          user_id: string
          score: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          movie_id: string
          user_id: string
          score: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          score?: number
          comment?: string | null
          updated_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          group_id: string
          email: string
          token_hash: string
          expires_at: string
          accepted_at: string | null
          invited_by: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          email: string
          token_hash: string
          expires_at: string
          accepted_at?: string | null
          invited_by: string
          created_at?: string
        }
        Update: {
          accepted_at?: string | null
        }
      }
      invite_codes: {
        Row: {
          id: string
          group_id: string
          code: string
          created_by: string
          max_uses: number | null
          use_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          code: string
          created_by: string
          max_uses?: number | null
          use_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          max_uses?: number | null
          use_count?: number
          expires_at?: string | null
          is_active?: boolean
        }
      }
      watchlist_items: {
        Row: {
          id: string
          group_id: string
          movie_id: string
          added_by: string
          reason: string | null
          priority: number
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          movie_id: string
          added_by: string
          reason?: string | null
          priority?: number
          created_at?: string
        }
        Update: {
          reason?: string | null
          priority?: number
        }
      }
      comments: {
        Row: {
          id: string
          group_id: string
          movie_id: string
          user_id: string
          content: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          movie_id: string
          user_id: string
          content: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          updated_at?: string
        }
      }
      activity_feed: {
        Row: {
          id: string
          group_id: string
          user_id: string
          activity_type: ActivityType
          target_movie_id: string | null
          target_user_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          activity_type: ActivityType
          target_movie_id?: string | null
          target_user_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: never
      }
      favorite_movies: {
        Row: {
          id: string
          user_id: string
          movie_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: string
          created_at?: string
        }
        Update: never
      }
      screening_attendees: {
        Row: {
          id: string
          group_movie_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_movie_id: string
          user_id: string
          created_at?: string
        }
        Update: never
      }
    }
  }
}

// Tipos auxiliares para uso en la aplicación
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type Membership = Database['public']['Tables']['memberships']['Row']
export type Movie = Database['public']['Tables']['movies']['Row']
export type GroupMovie = Database['public']['Tables']['group_movies']['Row']
export type Rating = Database['public']['Tables']['ratings']['Row']
export type Invite = Database['public']['Tables']['invites']['Row']
export type InviteCode = Database['public']['Tables']['invite_codes']['Row']
export type WatchlistItem = Database['public']['Tables']['watchlist_items']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type ActivityFeedItem = Database['public']['Tables']['activity_feed']['Row']
export type FavoriteMovie = Database['public']['Tables']['favorite_movies']['Row']
export type ScreeningAttendee = Database['public']['Tables']['screening_attendees']['Row']

// Tipos extendidos con relaciones
export interface GroupWithMembership extends Group {
  membership?: Membership
  member_count?: number
  member_avatars?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }[]
  last_movie?: {
    id: string
    title: string
    poster_path: string | null
    backdrop_path: string | null
    watched_at?: string | null
    average_rating?: number | null
  } | null
  last_activity?: string
}

export interface GroupMovieWithDetails extends GroupMovie {
  movie: Movie
  average_rating?: number
  rating_count?: number
  user_rating?: Rating | null
}

export interface RatingWithProfile extends Rating {
  profile: Profile
}

export interface ScreeningAttendeeWithProfile {
  user_id: string
  profile: Profile
}

export interface MovieWithGroupData extends Movie {
  group_movie: GroupMovie
  average_rating: number
  rating_count: number
  ratings?: RatingWithProfile[]
  attendees?: ScreeningAttendeeWithProfile[]
}

export interface WatchlistItemWithMovie extends WatchlistItem {
  movie: Movie
  added_by_profile?: Profile
}

export interface CommentWithProfile extends Comment {
  profile: Profile
  replies?: CommentWithProfile[]
}

export interface ActivityFeedItemDetailed extends ActivityFeedItem {
  profile: Profile
  movie?: Movie
  group: Group
}
