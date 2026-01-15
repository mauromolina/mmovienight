import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'

// POST /api/profile/avatar/restore-google - Restore Google avatar
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    // Get Google avatar from user metadata
    const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture

    if (!googleAvatarUrl) {
      return NextResponse.json(
        { error: 'No se encontró foto de Google' },
        { status: 404 }
      )
    }

    // Update profile with Google avatar URL
    const serviceClient = createServiceClient()
    const { error: updateError } = await getTable(serviceClient, 'profiles')
      .update({
        avatar_url: googleAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el perfil' },
        { status: 500 }
      )
    }

    // Revalidate to update navbar and other cached components
    revalidatePath('/', 'layout')

    return NextResponse.json({ avatar_url: googleAvatarUrl })
  } catch (error) {
    console.error('Error in POST /api/profile/avatar/restore-google:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
