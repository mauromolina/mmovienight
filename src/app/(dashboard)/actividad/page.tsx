import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Film } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserActivities } from '@/services/activity'
import { ActivityFeed } from '@/components/activity/activity-feed'

export default async function ActividadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { activities, hasMore } = await getUserActivities(20, 0, 'all')

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#16C7D9]/20 to-[#0EA5E9]/20 border border-[#16C7D9]/30 flex items-center justify-center">
            <Film className="w-6 h-6 text-[#16C7D9]" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
              <span className="text-[#F2F4F6]">Actividad </span>
              <span className="text-[#16C7D9]">reciente</span>
            </h1>
          </div>
        </div>
        <p className="text-[#9AA3AD] text-base lg:text-lg max-w-2xl leading-relaxed">
          Mantenete al día con lo último que pasa en tus círculos de cine.
        </p>
      </div>

      {/* Activity Feed */}
      <ActivityFeed
        initialActivities={activities}
        initialHasMore={hasMore}
        showGroupName={true}
      />

      {/* Quick Actions (show when no activities) */}
      {activities.length === 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link
            href="/grupos"
            className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-sm font-bold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 transition-all"
          >
            <Users className="w-4 h-4" />
            Ver mis círculos
          </Link>
          <Link
            href="/explorar"
            className="flex items-center justify-center gap-3 px-6 py-3 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all"
          >
            <Film className="w-4 h-4" />
            Explorar películas
          </Link>
        </div>
      )}
    </div>
  )
}
