import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Film, AlertCircle, Users, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTable, dbSelect } from '@/lib/supabase/db'
import { hashToken } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { JoinGroupButton } from './join-group-button'

interface InviteWithRelations {
  id: string
  group_id: string
  email: string
  token_hash: string
  expires_at: string
  accepted_at: string | null
  invited_by: string
  created_at: string
  group: {
    id: string
    name: string
    description?: string
  }
  inviter: {
    display_name?: string
    email: string
  }
}

interface JoinPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <JoinPageLayout>
        <ErrorState
          title="Link inválido"
          description="El link de invitación no es válido. Pedile a quien te invitó que te envíe uno nuevo."
        />
      </JoinPageLayout>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si no está logueado, redirigir a login con el token
  if (!user) {
    redirect(`/login?next=/join?token=${token}`)
  }

  // Buscar la invitación por hash del token
  const tokenHash = hashToken(token)

  const { data: inviteData, error } = await getTable(supabase, 'invites')
    .select(`
      *,
      group:groups (
        id,
        name,
        description
      ),
      inviter:profiles!invites_invited_by_fkey (
        display_name,
        email
      )
    `)
    .eq('token_hash', tokenHash)
    .single()

  const invite = inviteData as InviteWithRelations | null

  if (error || !invite) {
    return (
      <JoinPageLayout>
        <ErrorState
          title="Invitación no encontrada"
          description="Esta invitación no existe o ya fue utilizada. Pedí una nueva invitación."
        />
      </JoinPageLayout>
    )
  }

  // Verificar si expiró
  if (new Date(invite.expires_at) < new Date()) {
    return (
      <JoinPageLayout>
        <ErrorState
          icon={Clock}
          title="Invitación expirada"
          description="Esta invitación ya no es válida. Pedí una nueva invitación."
        />
      </JoinPageLayout>
    )
  }

  // Verificar si ya fue aceptada
  if (invite.accepted_at) {
    return (
      <JoinPageLayout>
        <ErrorState
          title="Invitación ya utilizada"
          description="Esta invitación ya fue aceptada. Si ya sos miembro del grupo, podés acceder desde tu dashboard."
          action={
            <Link href="/grupos">
              <Button>Ir a mis grupos</Button>
            </Link>
          }
        />
      </JoinPageLayout>
    )
  }

  // Verificar si ya es miembro del grupo
  const { data: memberships } = await dbSelect(supabase, 'memberships', 'id', {
    group_id: invite.group_id,
    user_id: user.id,
  })
  const existingMembership = memberships?.[0]

  if (existingMembership) {
    return (
      <JoinPageLayout>
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-teal-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">
              ¡Ya sos parte del grupo!
            </h2>
            <p className="text-gray-400 mb-6">
              Ya sos miembro de &quot;{invite.group.name}&quot;
            </p>
            <Link href={`/grupos/${invite.group_id}`}>
              <Button>Ir al grupo</Button>
            </Link>
          </CardContent>
        </Card>
      </JoinPageLayout>
    )
  }

  const group = invite.group
  const inviter = invite.inviter
  const inviterName = inviter.display_name || inviter.email.split('@')[0]

  return (
    <JoinPageLayout>
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6 border border-teal-500/30">
              <Users className="w-10 h-10 text-teal-400" />
            </div>

            <p className="text-gray-400 mb-2">
              <span className="text-teal-400 font-medium">{inviterName}</span> te invitó a unirte a
            </p>

            <h2 className="text-2xl font-bold text-gray-100 mb-2">{group.name}</h2>

            {group.description && (
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {group.description}
              </p>
            )}

            <JoinGroupButton
              groupId={invite.group_id}
              inviteId={invite.id}
              token={token}
            />

            <p className="text-xs text-gray-500 mt-4">
              Al unirte, podrás ver las películas del grupo y dejar tus calificaciones.
            </p>
          </div>
        </CardContent>
      </Card>
    </JoinPageLayout>
  )
}

function JoinPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cinematic flex flex-col">
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <Film className="w-6 h-6 text-gray-900" />
          </div>
          <span className="text-xl font-bold text-gray-100">MMovieNight</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="p-6 text-center">
        <p className="text-sm text-gray-500">
          Después de los créditos, empieza la charla.
        </p>
      </footer>
    </div>
  )
}

function ErrorState({
  icon: Icon = AlertCircle,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-100 mb-2">{title}</h2>
        <p className="text-gray-400 mb-6">{description}</p>
        {action || (
          <Link href="/grupos">
            <Button variant="secondary">Ir a mis grupos</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
