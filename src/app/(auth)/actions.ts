'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema, validate } from '@/lib/validations'

export type AuthActionState = {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

export async function login(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Validar datos
  const validation = validate(loginSchema, data)
  if (!validation.success) {
    return { fieldErrors: validation.errors }
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email o contraseña incorrectos' }
    }
    return { error: 'Ocurrió un error al iniciar sesión. Intentá de nuevo.' }
  }

  revalidatePath('/', 'layout')
  redirect('/grupos')
}

export async function register(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    displayName: formData.get('displayName') as string || undefined,
  }

  // Validar datos
  const validation = validate(registerSchema, data)
  if (!validation.success) {
    return { fieldErrors: validation.errors }
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        display_name: data.displayName,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este email ya está registrado' }
    }
    return { error: 'Ocurrió un error al crear la cuenta. Intentá de nuevo.' }
  }

  revalidatePath('/', 'layout')
  redirect('/grupos')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function loginWithMagicLink(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email || !email.includes('@')) {
    return { error: 'Ingresá un email válido' }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: 'No pudimos enviar el link. Intentá de nuevo.' }
  }

  return { success: true }
}
