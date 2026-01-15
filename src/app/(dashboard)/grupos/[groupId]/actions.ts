'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { dbInsert, dbUpdate, dbSelect } from '@/lib/supabase/db'
import { getOrCreateMovie } from '@/services/movies'
import { isUserMemberOfGroup } from '@/services/groups'
import { ratingSchema, validate, uuidSchema } from '@/lib/validations'

export type MovieActionState = {
  error?: string
  success?: boolean
}

export type RatingActionState = {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

export async function addMovieToGroup(
  groupId: string,
  tmdbId: number,
  watchedAt?: string
): Promise<MovieActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debés iniciar sesión' }
  }

  // Validar que sea miembro del grupo
  const isMember = await isUserMemberOfGroup(groupId, user.id)
  if (!isMember) {
    return { error: 'No tenés acceso a este grupo' }
  }

  // Obtener o crear la película
  const movie = await getOrCreateMovie(tmdbId)
  if (!movie) {
    return { error: 'No pudimos encontrar la información de la película' }
  }

  // Verificar si ya existe en el grupo
  const { data: existing } = await dbSelect(supabase, 'group_movies', 'id', {
    group_id: groupId,
    movie_id: movie.id,
  })

  if (existing && existing.length > 0) {
    return { error: 'Esta película ya está en el grupo' }
  }

  // Agregar al grupo
  const { error } = await dbInsert(supabase, 'group_movies', {
    group_id: groupId,
    movie_id: movie.id,
    added_by: user.id,
    watched_at: watchedAt || null,
  })

  if (error) {
    console.error('Error adding movie to group:', error)
    return { error: 'No pudimos agregar la película. Intentá de nuevo.' }
  }

  revalidatePath(`/grupos/${groupId}`)
  return { success: true }
}

export async function saveRating(
  prevState: RatingActionState,
  formData: FormData
): Promise<RatingActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debés iniciar sesión' }
  }

  const groupId = formData.get('groupId') as string
  const movieId = formData.get('movieId') as string
  const score = parseInt(formData.get('score') as string, 10)
  const comment = (formData.get('comment') as string) || null

  // Validar IDs
  if (!uuidSchema.safeParse(groupId).success || !uuidSchema.safeParse(movieId).success) {
    return { error: 'Datos inválidos' }
  }

  // Validar que sea miembro del grupo
  const isMember = await isUserMemberOfGroup(groupId, user.id)
  if (!isMember) {
    return { error: 'No tenés acceso a este grupo' }
  }

  // Validar rating
  const validation = validate(ratingSchema, { score, comment })
  if (!validation.success) {
    return { fieldErrors: validation.errors }
  }

  // Verificar si ya existe un rating
  const { data: existingRatings } = await dbSelect(supabase, 'ratings', 'id', {
    group_id: groupId,
    movie_id: movieId,
    user_id: user.id,
  })

  const existingRating = existingRatings?.[0] as { id: string } | undefined

  if (existingRating) {
    // Actualizar
    const { error } = await dbUpdate(
      supabase,
      'ratings',
      {
        score: validation.data.score,
        comment: validation.data.comment,
        updated_at: new Date().toISOString(),
      },
      { id: existingRating.id }
    )

    if (error) {
      console.error('Error updating rating:', error)
      return { error: 'No pudimos guardar tu calificación. Intentá de nuevo.' }
    }
  } else {
    // Crear
    const { error } = await dbInsert(supabase, 'ratings', {
      group_id: groupId,
      movie_id: movieId,
      user_id: user.id,
      score: validation.data.score,
      comment: validation.data.comment,
    })

    if (error) {
      console.error('Error creating rating:', error)
      return { error: 'No pudimos guardar tu calificación. Intentá de nuevo.' }
    }
  }

  revalidatePath(`/grupos/${groupId}`)
  revalidatePath(`/grupos/${groupId}/pelicula/${movieId}`)
  return { success: true }
}

export async function deleteRating(
  groupId: string,
  movieId: string
): Promise<RatingActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debés iniciar sesión' }
  }

  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('group_id', groupId)
    .eq('movie_id', movieId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting rating:', error)
    return { error: 'No pudimos eliminar tu calificación. Intentá de nuevo.' }
  }

  revalidatePath(`/grupos/${groupId}`)
  revalidatePath(`/grupos/${groupId}/pelicula/${movieId}`)
  return { success: true }
}
