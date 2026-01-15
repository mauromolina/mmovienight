import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserActivities, type ActivityFilter } from '@/services/activity'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const filter = (searchParams.get('filter') || 'all') as ActivityFilter

  const { activities, hasMore } = await getUserActivities(limit, offset, filter)

  return NextResponse.json({ activities, hasMore })
}
