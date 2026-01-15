import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/services/groups'
import { getGroupActivities, type ActivityFilter } from '@/services/activity'

interface RouteParams {
  params: Promise<{ groupId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { groupId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verify membership
  const membership = await getUserMembership(groupId, user.id)
  if (!membership) {
    return NextResponse.json({ error: 'No sos miembro de este grupo' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const filter = (searchParams.get('filter') || 'all') as ActivityFilter

  const { activities, hasMore } = await getGroupActivities(groupId, limit, offset, filter)

  return NextResponse.json({ activities, hasMore })
}
