import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getGroupById, getUserMembership } from '@/services/groups'
import { getGroupActivities } from '@/services/activity'
import { ActivityFeed } from '@/components/activity/activity-feed'

interface GroupActivityPageProps {
  params: Promise<{ groupId: string }>
}

export default async function GroupActivityPage({ params }: GroupActivityPageProps) {
  const { groupId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar membresía
  const membership = await getUserMembership(groupId, user.id)
  if (!membership) {
    notFound()
  }

  // Obtener datos del grupo
  const group = await getGroupById(groupId)
  if (!group) {
    notFound()
  }

  // Obtener actividades del grupo
  const { activities, hasMore } = await getGroupActivities(groupId, 20, 0, 'all')

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
        <Link href="/grupos" className="hover:text-[#9AA3AD] transition-colors">
          Círculos
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/grupos/${groupId}`} className="hover:text-[#9AA3AD] transition-colors">
          {group.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-[#9AA3AD]">Actividad</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#16C7D9]/20 to-[#0EA5E9]/20 border border-[#16C7D9]/30 flex items-center justify-center">
            <Activity className="w-6 h-6 text-[#16C7D9]" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
              <span className="text-[#F2F4F6]">Actividad de </span>
              <span className="text-[#16C7D9]">{group.name}</span>
            </h1>
          </div>
        </div>
        <p className="text-[#9AA3AD] text-base lg:text-lg max-w-2xl leading-relaxed">
          Todo lo que está pasando en tu círculo de cine.
        </p>
      </div>

      {/* Activity Feed */}
      <ActivityFeed
        initialActivities={activities}
        initialHasMore={hasMore}
        groupId={groupId}
        showGroupName={false}
      />

      {/* Quick Action (show when no activities) */}
      {activities.length === 0 && (
        <div className="flex justify-center mt-8">
          <Link
            href={`/grupos/${groupId}`}
            className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-sm font-bold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 transition-all"
          >
            Ir al grupo
          </Link>
        </div>
      )}
    </div>
  )
}
