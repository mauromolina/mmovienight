import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createGroup, getUserGroups } from '@/services/groups'
import { getTable } from '@/lib/supabase/db'
import { recordActivity } from '@/services/activity'

// GET /api/groups - Obtener los grupos del usuario
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const groups = await getUserGroups()
    return NextResponse.json({
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        member_count: g.member_count,
      })),
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Error al obtener los grupos' },
      { status: 500 }
    )
  }
}

// POST /api/groups - Crear un nuevo grupo
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
    const { name, description, image_url, memberIds } = body

    // Validar datos
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'El nombre del grupo es requerido' },
        { status: 400 }
      )
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      )
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'El nombre no puede tener más de 100 caracteres' },
        { status: 400 }
      )
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: 'La descripción no puede tener más de 500 caracteres' },
        { status: 400 }
      )
    }

    // Crear grupo (pasamos user para evitar problemas de RLS y asegurar perfil)
    const result = await createGroup(
      {
        name: name.trim(),
        description: description?.trim(),
        image_url,
      },
      { id: user.id, email: user.email! }
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al crear el grupo' },
        { status: 500 }
      )
    }

    // Record group creation activity
    if (result.group) {
      await recordActivity({
        groupId: result.group.id,
        userId: user.id,
        activityType: 'group_created',
      })
    }

    // Add members if provided
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0 && result.group) {
      const serviceClient = createServiceClient()

      // Create membership records for each member
      const membershipsToInsert = memberIds.map((memberId: string) => ({
        group_id: result.group!.id,
        user_id: memberId,
        role: 'member' as const,
      }))

      const { error: membersError } = await getTable(serviceClient, 'memberships')
        .insert(membershipsToInsert)

      if (membersError) {
        console.error('Error adding members to group:', membersError)
        // Group was created but members failed - we don't fail the whole operation
      }
    }

    return NextResponse.json({
      success: true,
      group: result.group,
      inviteCode: result.inviteCode,
    })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
