import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { joinGroupWithCode } from '@/services/groups'

// POST /api/groups/join - Unirse a un grupo con código de invitación
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code } = body

    // Validar código
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'El código de invitación es requerido' },
        { status: 400 }
      )
    }

    // Limpiar y validar formato del código
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (cleanCode.length !== 6) {
      return NextResponse.json(
        { error: 'El código debe tener 6 caracteres' },
        { status: 400 }
      )
    }

    // Intentar unirse
    const result = await joinGroupWithCode(cleanCode)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'El código no es válido o ya expiró' },
        { status: 400 }
      )
    }

    // Éxito - puede ser nuevo miembro o ya era miembro
    return NextResponse.json({
      success: true,
      alreadyMember: result.alreadyMember || false,
      circleId: result.groupId,
      circleName: result.groupName,
    })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
