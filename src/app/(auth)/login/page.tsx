'use client'

import { Suspense, useActionState, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login, loginWithMagicLink, register, type AuthActionState } from '../actions'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Film } from 'lucide-react'

function AuthPageContent() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const nextUrl = searchParams.get('next')

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleTabChange = (tab: 'login' | 'register') => {
    if (tab === activeTab) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveTab(tab)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 150)
  }

  const [loginState, loginAction, isLoginPending] = useActionState<AuthActionState, FormData>(
    login,
    {}
  )
  const [registerState, registerAction, isRegisterPending] = useActionState<
    AuthActionState,
    FormData
  >(register, {})

  const state = activeTab === 'login' ? loginState : registerState
  const formAction = activeTab === 'login' ? loginAction : registerAction
  const isPending = activeTab === 'login' ? isLoginPending : isRegisterPending

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    const supabase = createClient()

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] relative overflow-hidden">
      {/* Background with blur and overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070')`,
          filter: 'blur(8px) brightness(0.3)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0D10]/90 via-[#0B0D10]/70 to-[#0B0D10]/90" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-4 opacity-0 animate-[fadeSlideUp_0.5s_ease-out_0s_forwards]">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#16C7D9] to-[#0EA5E9] flex items-center justify-center shadow-lg shadow-[#16C7D9]/50">
            <Film className="w-5 h-5 text-[#0B0D10]" />
          </div>
          <span className="italic text-lg font-bold tracking-wide">
            <span className="text-[#16C7D9] drop-shadow-[0_0_15px_rgba(22,199,217,0.7)]">MM</span>
            <span className="text-[#F2F4F6] drop-shadow-[0_0_12px_rgba(242,244,246,0.4)]">OVIENIGHT</span>
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-80px)] px-4 lg:px-12 py-8 gap-8 lg:gap-16">
        {/* Left Side - Marketing Hero */}
        <div className="flex-1 max-w-xl text-center lg:text-left order-2 lg:order-1">
          {/* Beta Badge */}
          <div
            className="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-[#C9A23A]/20 border border-[#C9A23A]/30 opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.1s_forwards]"
          >
            <span className="text-xs font-semibold text-[#C9A23A] tracking-wider">ACCESO BETA</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            <span className="text-[#F2F4F6] block opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.2s_forwards]">TODO LISTO.</span>
            <span className="text-[#16C7D9] block opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.35s_forwards]">INVITÁ A TU GENTE.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#A8B0BA] text-base lg:text-lg leading-relaxed max-w-md mx-auto lg:mx-0 opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.5s_forwards]">
            Por fin, un espacio privado para puntuar pelis y charlar sin ruido. Tu círculo, tus
            reglas.
          </p>
        </div>

        {/* Right Side - Auth Card */}
        <div className="w-full max-w-[440px] order-1 lg:order-2 opacity-0 animate-[fadeSlideUp_0.7s_ease-out_0.3s_forwards]">
          <div className="bg-[#14181D]/80 backdrop-blur-xl rounded-3xl border border-[#1A2026] shadow-2xl shadow-black/50 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-[#1A2026] relative">
              <button
                onClick={() => handleTabChange('login')}
                className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-colors duration-200 cursor-pointer ${
                  activeTab === 'login' ? 'text-[#16C7D9]' : 'text-[#A8B0BA] hover:text-[#F2F4F6]'
                }`}
              >
                INICIAR SESIÓN
              </button>
              <button
                onClick={() => handleTabChange('register')}
                className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-colors duration-200 cursor-pointer ${
                  activeTab === 'register'
                    ? 'text-[#16C7D9]'
                    : 'text-[#A8B0BA] hover:text-[#F2F4F6]'
                }`}
              >
                CREAR CUENTA
              </button>
              {/* Animated indicator */}
              <div
                className="absolute bottom-0 h-0.5 w-12 bg-[#16C7D9] rounded-full transition-all duration-300 ease-out"
                style={{
                  left: activeTab === 'login' ? 'calc(25% - 24px)' : 'calc(75% - 24px)',
                }}
              />
            </div>

            {/* Card Content */}
            <div
              className={`p-6 sm:p-8 transition-all duration-200 ${
                isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              {/* Title */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-[#F2F4F6] mb-1">
                  {activeTab === 'login' ? '¡Bienvenido de nuevo!' : '¡Empezá tu círculo!'}
                </h2>
                <p className="text-sm text-[#A8B0BA]">
                  {activeTab === 'login'
                    ? 'Retomá donde lo dejaste con tus grupos de pelis.'
                    : 'Creá tu cuenta y armá tu grupo de cine.'}
                </p>
              </div>

              {/* Error Messages */}
              {(state.error || errorParam === 'auth_callback_error') && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {state.error || 'Hubo un problema al verificar tu sesión. Intentá de nuevo.'}
                </div>
              )}

              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 mb-6 bg-[#1A2026] hover:bg-[#1F262D] border border-[#2A3038] rounded-xl text-sm font-medium text-[#F2F4F6] transition-all hover:border-[#3A4048] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2A3038]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#14181D] text-[#A8B0BA]">O usá tu email</span>
                </div>
              </div>

              {/* Form */}
              <form action={formAction} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#A8B0BA] tracking-wide mb-2">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="cinefilo@ejemplo.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] text-sm focus:outline-none focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/50 transition-all"
                  />
                  {state.fieldErrors?.email && (
                    <p className="mt-1 text-xs text-red-400">{state.fieldErrors.email}</p>
                  )}
                </div>

                {/* Display Name (only for register) */}
                {activeTab === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#A8B0BA] tracking-wide mb-2">
                      NOMBRE
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      placeholder="¿Cómo te llamamos?"
                      autoComplete="name"
                      className="w-full px-4 py-3 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] text-sm focus:outline-none focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/50 transition-all"
                    />
                    {state.fieldErrors?.displayName && (
                      <p className="mt-1 text-xs text-red-400">{state.fieldErrors.displayName}</p>
                    )}
                  </div>
                )}

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-[#A8B0BA] tracking-wide">
                      CONTRASEÑA
                    </label>
                    {activeTab === 'login' && (
                      <button
                        type="button"
                        className="text-xs text-[#16C7D9] hover:text-[#16C7D9]/80 transition-colors cursor-pointer"
                      >
                        ¿Te olvidaste?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder={activeTab === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                      autoComplete={activeTab === 'register' ? 'new-password' : 'current-password'}
                      className="w-full px-4 py-3 pr-12 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] text-sm focus:outline-none focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#A8B0BA] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {state.fieldErrors?.password && (
                    <p className="mt-1 text-xs text-red-400">{state.fieldErrors.password}</p>
                  )}
                </div>

                {/* Remember Me (only for login) */}
                {activeTab === 'login' && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border-2 transition-all ${
                          rememberMe
                            ? 'bg-[#16C7D9] border-[#16C7D9]'
                            : 'bg-transparent border-[#2A3038]'
                        }`}
                      >
                        {rememberMe && (
                          <svg
                            className="w-full h-full text-[#0B0D10]"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-[#A8B0BA]">
                      Mantener sesión iniciada por 30 días
                    </span>
                  </label>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 mt-2 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] text-[#0B0D10] font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      PROCESANDO...
                    </span>
                  ) : activeTab === 'login' ? (
                    'ENTRAR AL CÍRCULO'
                  ) : (
                    'CREAR MI CUENTA'
                  )}
                </button>
              </form>

              {/* Legal */}
              <p className="mt-6 text-center text-xs text-[#4A5568]">
                Al {activeTab === 'login' ? 'iniciar sesión' : 'registrarte'}, aceptás nuestros{' '}
                <Link
                  href="#"
                  className="text-[#A8B0BA] hover:text-[#16C7D9] underline underline-offset-2 transition-colors"
                >
                  Términos
                </Link>{' '}
                y nuestra{' '}
                <Link
                  href="#"
                  className="text-[#A8B0BA] hover:text-[#16C7D9] underline underline-offset-2 transition-colors"
                >
                  Política de Privacidad
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}

function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#16C7D9] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthPageContent />
    </Suspense>
  )
}
