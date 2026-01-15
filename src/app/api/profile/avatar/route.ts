import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'

// POST /api/profile/avatar - Upload avatar image
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es muy grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage using service client
    const serviceClient = createServiceClient()

    // Delete old avatar if exists
    const { data: oldProfile } = await getTable(serviceClient, 'profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (oldProfile?.avatar_url) {
      // Extract old file path from URL
      const oldUrlParts = oldProfile.avatar_url.split('/avatars/')
      if (oldUrlParts.length > 1) {
        const oldFileName = oldUrlParts[1].split('?')[0]
        await serviceClient.storage.from('avatars').remove([`avatars/${oldFileName}`])
      }
    }

    // Upload new avatar
    const { error: uploadError } = await serviceClient.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir la imagen' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = serviceClient.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Update profile with new avatar URL
    const { error: updateError } = await getTable(serviceClient, 'profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el perfil' },
        { status: 500 }
      )
    }

    // Revalidate to update navbar and other cached components
    revalidatePath('/', 'layout')

    return NextResponse.json({ avatar_url: avatarUrl })
  } catch (error) {
    console.error('Error in POST /api/profile/avatar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/profile/avatar - Remove avatar
export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const serviceClient = createServiceClient()

    // Get current avatar URL
    const { data: profile } = await getTable(serviceClient, 'profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.avatar_url) {
      // Extract file path from URL and delete
      const urlParts = profile.avatar_url.split('/avatars/')
      if (urlParts.length > 1) {
        const fileName = urlParts[1].split('?')[0]
        await serviceClient.storage.from('avatars').remove([`avatars/${fileName}`])
      }
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await getTable(serviceClient, 'profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el perfil' },
        { status: 500 }
      )
    }

    // Revalidate to update navbar and other cached components
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/profile/avatar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
