import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership, generateInviteCode, getGroupInviteCodes } from '@/services/groups'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es miembro del grupo
    const membership = await getUserMembership(groupId, user.id)
    if (!membership) {
      return NextResponse.json({ error: 'No sos miembro de este grupo' }, { status: 403 })
    }

    // Buscar un código existente activo
    const existingCodes = await getGroupInviteCodes(groupId)

    if (existingCodes.length > 0) {
      // Retornar el código más reciente
      return NextResponse.json({ code: existingCodes[0].code })
    }

    // Si no hay códigos, generar uno nuevo
    const newCode = await generateInviteCode(groupId, user.id)

    if (!newCode) {
      return NextResponse.json({ error: 'Error al generar el código' }, { status: 500 })
    }

    return NextResponse.json({ code: newCode })
  } catch (error) {
    console.error('Error getting invite code:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
