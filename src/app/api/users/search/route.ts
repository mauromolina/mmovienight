import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'

// GET /api/users/search?q=<query> - Search users by email or display name
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Search for users by email or display_name (case insensitive)
    // Using ilike for partial matching
    const { data: users, error } = await getTable(supabase, 'profiles')
      .select('id, email, display_name, avatar_url')
      .neq('id', user.id) // Exclude current user
      .or(`email.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error('Error searching users:', error)
      return NextResponse.json({ error: 'Error al buscar usuarios' }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
