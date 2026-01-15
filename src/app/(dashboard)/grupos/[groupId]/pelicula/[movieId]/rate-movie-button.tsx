'use client'

import { useState, useActionState } from 'react'
import { Star, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { RatingSelector } from '@/components/ui/rating-selector'
import { saveRating, type RatingActionState } from '../../actions'

interface ExistingRating {
  score: number
  comment: string | null
}

interface RateMovieButtonProps {
  groupId: string
  movieId: string
  movieTitle: string
  existingRating?: ExistingRating | null
}

export function RateMovieButton({
  groupId,
  movieId,
  movieTitle,
  existingRating,
}: RateMovieButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [score, setScore] = useState<number | null>(existingRating?.score || null)
  const [comment, setComment] = useState(existingRating?.comment || '')

  const [state, formAction, isPending] = useActionState<RatingActionState, FormData>(
    async (prevState, formData) => {
      const result = await saveRating(prevState, formData)
      if (result.success) {
        setIsOpen(false)
      }
      return result
    },
    {}
  )

  const handleClose = () => {
    setIsOpen(false)
    // Reset to existing values
    setScore(existingRating?.score || null)
    setComment(existingRating?.comment || '')
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full"
        variant={existingRating ? 'secondary' : 'primary'}
        leftIcon={existingRating ? <Pencil className="w-4 h-4" /> : <Star className="w-4 h-4" />}
      >
        {existingRating ? 'Editar calificación' : 'Calificar película'}
      </Button>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        title={existingRating ? 'Editar tu calificación' : 'Calificar película'}
        description={movieTitle}
        size="md"
      >
        <form action={formAction}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="movieId" value={movieId} />
          <input type="hidden" name="score" value={score || ''} />

          <DialogContent>
            <div className="space-y-6">
              {state.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {state.error}
                </div>
              )}

              {/* Rating selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                  ¿Qué te pareció?
                </label>
                <RatingSelector
                  value={score}
                  onChange={setScore}
                  size="lg"
                />
                {state.fieldErrors?.score && (
                  <p className="mt-2 text-sm text-red-400 text-center">
                    {state.fieldErrors.score}
                  </p>
                )}
              </div>

              {/* Comment */}
              <Textarea
                label="Comentario (opcional)"
                name="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Qué opinás de la película?"
                rows={3}
                error={state.fieldErrors?.comment}
              />
            </div>
          </DialogContent>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isPending}
              disabled={score === null}
              leftIcon={<Star className="w-4 h-4" />}
            >
              {existingRating ? 'Guardar cambios' : 'Publicar'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
