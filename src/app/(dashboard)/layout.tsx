import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'
import { Navbar } from '@/components/layout/navbar'
import type { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener el perfil del usuario
  const { data: profileData } = await getTable(supabase, 'profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Obtener avatar: priorizar DB, luego user metadata (para OAuth)
  const avatarFromMetadata = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

  // Si no hay perfil, crear uno básico desde los datos de auth
  const profile: Profile = profileData ? {
    ...(profileData as Profile),
    // Si no hay avatar en DB pero sí en metadata (OAuth), usar ese
    avatar_url: (profileData as Profile).avatar_url || avatarFromMetadata,
  } : {
    id: user.id,
    email: user.email || '',
    display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
    avatar_url: avatarFromMetadata,
    bio: null,
    banner_url: null,
    banner_preset: null,
    created_at: user.created_at,
    updated_at: user.updated_at || user.created_at,
  }

  return (
    <div className="min-h-screen bg-[#0B0D10]">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#16C7D9]/5 via-transparent to-[#0EA5E9]/5 pointer-events-none" />

      <div className="relative">
        <Navbar user={profile} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#1A2026] mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#4A5568]">
              <p>© {new Date().getFullYear()} MMovieNight</p>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-[#9AA3AD] transition-colors">Privacidad</a>
                <a href="#" className="hover:text-[#9AA3AD] transition-colors">Términos</a>
                <a href="#" className="hover:text-[#9AA3AD] transition-colors">Soporte</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
