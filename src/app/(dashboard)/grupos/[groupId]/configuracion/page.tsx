import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getGroupById, getGroupMembers, getUserMembership, getGroupInviteCodes } from '@/services/groups'
import { GroupSettingsClient } from './group-settings-client'

interface GroupSettingsPageProps {
  params: Promise<{ groupId: string }>
}

export default async function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const { groupId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar membresía y que sea owner
  const membership = await getUserMembership(groupId, user.id)
  if (!membership) {
    notFound()
  }

  if (membership.role !== 'owner') {
    // Redirigir al grupo si no es owner
    redirect(`/grupos/${groupId}`)
  }

  // Obtener datos del grupo
  const group = await getGroupById(groupId)
  if (!group) {
    notFound()
  }

  // Obtener miembros y códigos de invitación
  const [members, inviteCodes] = await Promise.all([
    getGroupMembers(groupId),
    getGroupInviteCodes(groupId),
  ])

  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/grupos/${groupId}`}
          className="inline-flex items-center gap-2 text-sm text-[#16C7D9] hover:text-[#3DD4E4] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al grupo
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#16C7D9]/10 border border-[#16C7D9]/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-[#16C7D9]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F2F4F6]">
              Configuración
            </h1>
            <p className="text-sm text-[#6B7280]">{group.name}</p>
          </div>
        </div>
      </div>

      <GroupSettingsClient
        group={group}
        members={members}
        inviteCodes={inviteCodes}
        currentUserId={user.id}
      />
    </div>
  )
}
