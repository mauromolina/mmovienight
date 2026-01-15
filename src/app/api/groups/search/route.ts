import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'

// GET /api/groups/search?q=<query> - Search user's groups by name
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

    if (!query || query.length < 1) {
      return NextResponse.json({ groups: [] })
    }

    // First get user's group IDs
    const { data: memberships } = await getTable(supabase, 'memberships')
      .select('group_id')
      .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ groups: [] })
    }

    const groupIds = memberships.map((m: any) => m.group_id)

    // Search groups by name (case insensitive)
    const { data: groups, error } = await getTable(supabase, 'groups')
      .select('id, name, image_url')
      .in('id', groupIds)
      .ilike('name', `%${query}%`)
      .limit(5)

    if (error) {
      console.error('Error searching groups:', error)
      return NextResponse.json({ error: 'Error al buscar grupos' }, { status: 500 })
    }

    return NextResponse.json({ groups: groups || [] })
  } catch (error) {
    console.error('Error searching groups:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
