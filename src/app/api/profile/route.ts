import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'

// GET /api/profile - Get current user's profile
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const { data: profile, error } = await getTable(supabase, 'profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 })
    }

    // Get Google avatar from user metadata as fallback
    const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

    return NextResponse.json({ profile, googleAvatarUrl })
  } catch (error) {
    console.error('Error in GET /api/profile:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { display_name, bio, banner_url, banner_preset } = body

    // Validate bio length
    if (bio && bio.length > 300) {
      return NextResponse.json({ error: 'La bio no puede superar los 300 caracteres' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data: profile, error } = await getTable(serviceClient, 'profiles')
      .update({
        display_name: display_name?.trim() || null,
        bio: bio?.trim() || null,
        banner_url: banner_url || null,
        banner_preset: banner_preset || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in PUT /api/profile:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
