'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  X,
  Search,
  Clapperboard,
  Lock,
  UserPlus,
  Sparkles,
  Crown,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Steps configuration
const steps = [
  { id: 1, name: 'Identidad del círculo', icon: Sparkles },
  { id: 2, name: 'Privacidad', icon: Lock },
  { id: 3, name: 'Invitar miembros', icon: UserPlus },
]

// Preset cover images
const coverPresets = [
  { id: 'noir', name: 'Noir', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80' },
  { id: 'scifi', name: 'Sci-Fi', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80' },
  { id: 'drama', name: 'Drama', url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80' },
  { id: 'horror', name: 'Horror', url: 'https://images.unsplash.com/photo-1509248961895-b4f8b07c2a78?w=800&q=80' },
  { id: 'classic', name: 'Clásico', url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80' },
]

// Privacy options
const privacyOptions = [
  {
    id: 'private',
    name: 'Privado',
    description: 'Solo las personas que invites pueden ver el grupo y participar.',
    icon: Lock,
  },
  {
    id: 'invite-only',
    name: 'Solo por invitación',
    description: 'Otros pueden ver el grupo, pero necesitan invitación o aprobación para entrar.',
    icon: UserPlus,
  },
]

// User type for member search
interface UserResult {
  id: string
  name: string
  email: string
  avatar: string | null
}

interface FormData {
  name: string
  description: string
  coverImage: string | null
  coverPreset: string | null
  privacy: 'private' | 'invite-only'
  members: UserResult[]
}

export default function CreateGroupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    coverImage: null,
    coverPreset: null,
    privacy: 'private',
    members: [],
  })

  const [errors, setErrors] = useState<{ name?: string; submit?: string }>({})
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setErrors({ name: 'El nombre del círculo es requerido' })
        return false
      }
      if (formData.name.trim().length < 3) {
        setErrors({ name: 'El nombre debe tener al menos 3 caracteres' })
        return false
      }
    }
    setErrors({})
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    setErrors({})

    try {
      // Determinar la imagen de portada
      let imageUrl = formData.coverImage
      if (!imageUrl && formData.coverPreset) {
        const preset = coverPresets.find(p => p.id === formData.coverPreset)
        imageUrl = preset?.url || null
      }

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          image_url: imageUrl,
          memberIds: formData.members.map(m => m.id),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ submit: data.error || 'Error al crear el grupo' })
        setIsSubmitting(false)
        return
      }

      // Guardar el ID del grupo y el código de invitación
      setCreatedGroupId(data.group?.id)
      setInviteCode(data.inviteCode)

      // Redirigir al grupo creado
      router.push(`/grupos/${data.group?.id}`)
    } catch (error) {
      console.error('Error creating group:', error)
      setErrors({ submit: 'Error al procesar la solicitud' })
      setIsSubmitting(false)
    }
  }

  const addMember = (user: UserResult) => {
    if (!formData.members.find(m => m.id === user.id)) {
      setFormData({ ...formData, members: [...formData.members, user] })
    }
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const removeMember = (userId: string) => {
    setFormData({
      ...formData,
      members: formData.members.filter(m => m.id !== userId),
    })
  }

  // Debounced search for users
  useEffect(() => {
    const query = searchQuery.trim()

    if (query.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          // Map API response to UserResult format and exclude already added members
          const users: UserResult[] = data.users
            .filter((u: any) => !formData.members.find(m => m.id === u.id))
            .map((u: any) => ({
              id: u.id,
              name: u.display_name || u.email.split('@')[0],
              email: u.email,
              avatar: u.avatar_url,
            }))
          setSearchResults(users)
        }
      } catch (error) {
        console.error('Error searching users:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, formData.members])

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Back Link */}
      <Link
        href="/grupos"
        className="inline-flex items-center gap-2 text-sm text-[#9AA3AD] hover:text-[#F2F4F6] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
          <span className="text-[#F2F4F6]">Crear nuevo </span>
          <span className="text-[#16C7D9]">círculo</span>
        </h1>
        <p className="text-[#9AA3AD] text-base lg:text-lg max-w-2xl leading-relaxed">
          Definí la identidad del grupo e invitá a tus amigos a este espacio privado para ver cine juntos.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-10">
        {/* Desktop Stepper */}
        <div className="hidden sm:flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                      isActive
                        ? 'bg-[#16C7D9] text-[#0B0D10]'
                        : isCompleted
                        ? 'bg-[#16C7D9]/20 text-[#16C7D9] border border-[#16C7D9]/30'
                        : 'bg-[#14181D] text-[#4A5568] border border-[#2A3038]'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isActive ? 'text-[#F2F4F6]' : 'text-[#6B7280]'
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-px mx-4',
                      isCompleted ? 'bg-[#16C7D9]/50' : 'bg-[#2A3038]'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile Stepper */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#9AA3AD]">Paso {currentStep} de 3</span>
            <span className="text-sm font-medium text-[#F2F4F6]">{steps[currentStep - 1].name}</span>
          </div>
          <div className="flex gap-1">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  'flex-1 h-1 rounded-full transition-colors',
                  currentStep >= step.id ? 'bg-[#16C7D9]' : 'bg-[#2A3038]'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-8">
        {/* Step 1: Identity */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#16C7D9]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#16C7D9]" />
              </div>
              <h2 className="text-xl font-bold text-[#F2F4F6]">Identidad del círculo</h2>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-[#9AA3AD] mb-2">
                Nombre del círculo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) setErrors({})
                }}
                placeholder="Ej: Sociedad del Horror de Medianoche"
                className={cn(
                  'w-full px-4 py-3.5 bg-[#14181D] border rounded-xl text-[#F2F4F6] placeholder-[#4A5568] text-sm focus:outline-none transition-all',
                  errors.name
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#2A3038] focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/50'
                )}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-[#9AA3AD] mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="¿Cuál es la onda del grupo? ¿Debates semanales, cine clásico, documentales…?"
                rows={4}
                className="w-full px-4 py-3.5 bg-[#14181D] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] text-sm focus:outline-none focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/50 transition-all resize-none"
              />
              <p className="mt-2 text-xs text-[#4A5568]">
                Opcional. Contales a los demás de qué se trata este círculo.
              </p>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-[#9AA3AD] mb-3">
                Imagen de portada
              </label>

              {/* Upload Area */}
              <div className="relative mb-4">
                {formData.coverImage || formData.coverPreset ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#2A3038]">
                    <Image
                      src={
                        formData.coverImage ||
                        coverPresets.find(p => p.id === formData.coverPreset)?.url ||
                        ''
                      }
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, coverImage: null, coverPreset: null })}
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video rounded-2xl border-2 border-dashed border-[#2A3038] hover:border-[#16C7D9]/50 bg-[#14181D]/50 cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-[#4A5568] mb-3" />
                    <span className="text-sm font-medium text-[#9AA3AD]">Subir portada personalizada</span>
                    <span className="text-xs text-[#4A5568] mt-1">Relación 16:9 recomendada</span>
                    <input type="file" className="hidden" accept="image/*" />
                  </label>
                )}
              </div>

              {/* Presets */}
              <div>
                <p className="text-xs text-[#6B7280] mb-3">O elegí un preset cinematográfico:</p>
                <div className="grid grid-cols-5 gap-2">
                  {coverPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setFormData({ ...formData, coverPreset: preset.id, coverImage: null })}
                      className={cn(
                        'relative aspect-video rounded-xl overflow-hidden border-2 transition-all',
                        formData.coverPreset === preset.id
                          ? 'border-[#16C7D9] ring-2 ring-[#16C7D9]/30'
                          : 'border-transparent hover:border-[#2A3038]'
                      )}
                    >
                      <Image src={preset.url} alt={preset.name} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                        <span className="text-[10px] font-medium text-white">{preset.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Privacy */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#16C7D9]/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#16C7D9]" />
              </div>
              <h2 className="text-xl font-bold text-[#F2F4F6]">Configuración de privacidad</h2>
            </div>

            <div className="space-y-3">
              {privacyOptions.map((option) => {
                const OptionIcon = option.icon
                const isSelected = formData.privacy === option.id

                return (
                  <button
                    key={option.id}
                    onClick={() => setFormData({ ...formData, privacy: option.id as 'private' | 'invite-only' })}
                    className={cn(
                      'w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all',
                      isSelected
                        ? 'bg-[#16C7D9]/5 border-[#16C7D9]/50'
                        : 'bg-[#14181D] border-[#2A3038] hover:border-[#3A4048]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        isSelected ? 'bg-[#16C7D9]/20 text-[#16C7D9]' : 'bg-[#1A2026] text-[#6B7280]'
                      )}
                    >
                      <OptionIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3
                          className={cn(
                            'font-semibold',
                            isSelected ? 'text-[#F2F4F6]' : 'text-[#9AA3AD]'
                          )}
                        >
                          {option.name}
                        </h3>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#16C7D9] flex items-center justify-center">
                            <Check className="w-3 h-3 text-[#0B0D10]" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-[#6B7280] mt-1">{option.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Invite Members */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#16C7D9]/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-[#16C7D9]" />
              </div>
              <h2 className="text-xl font-bold text-[#F2F4F6]">Invitar miembros</h2>
            </div>

            <p className="text-sm text-[#6B7280]">
              Podés invitar miembros ahora o hacerlo más tarde desde la configuración del grupo.
            </p>

            {/* Search */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSearchResults(e.target.value.length > 0)
                    }}
                    onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
                    placeholder="Buscar por usuario o email…"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#14181D] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] text-sm focus:outline-none focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/50 transition-all"
                  />
                </div>
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#14181D] border border-[#2A3038] rounded-xl overflow-hidden z-10 shadow-xl">
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-4">
                      <Loader2 className="w-4 h-4 text-[#16C7D9] animate-spin" />
                      <span className="text-sm text-[#6B7280]">Buscando usuarios...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => addMember(user)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1A2026] transition-colors text-left cursor-pointer"
                      >
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.name}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#16C7D9]/40 to-[#0EA5E9]/40 flex items-center justify-center">
                            <span className="text-sm text-[#16C7D9] font-bold">{user.name[0]?.toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#F2F4F6]">{user.name}</p>
                          <p className="text-xs text-[#6B7280]">{user.email}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-center">
                      <p className="text-sm text-[#6B7280]">No se encontraron usuarios</p>
                      <p className="text-xs text-[#4A5568] mt-1">Probá con otro nombre o email</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Members List */}
            <div className="space-y-3">
              {/* Current User (Creator) */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#14181D] rounded-xl border border-[#2A3038]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37]/40 to-[#F59E0B]/40 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#F2F4F6]">Vos</p>
                  <p className="text-xs text-[#6B7280]">Creador del grupo</p>
                </div>
                <span className="px-2 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-md text-xs font-semibold text-[#D4AF37]">
                  Owner
                </span>
              </div>

              {/* Added Members */}
              {formData.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 bg-[#14181D] rounded-xl border border-[#2A3038]"
                >
                  {member.avatar ? (
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#16C7D9]/40 to-[#0EA5E9]/40 flex items-center justify-center">
                      <span className="text-sm text-[#16C7D9] font-bold">{member.name[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#F2F4F6]">{member.name}</p>
                    <p className="text-xs text-[#6B7280]">{member.email}</p>
                  </div>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-2 text-[#6B7280] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {formData.members.length === 0 && (
                <p className="text-center text-sm text-[#4A5568] py-6">
                  Todavía no agregaste miembros. Podés hacerlo ahora o después.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-12 pt-8 border-t border-[#1A2026]">
        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400 text-center">{errors.submit}</p>
          </div>
        )}

        {/* Legal Note */}
        <p className="text-xs text-[#4A5568] text-center mb-6">
          Al crear este círculo aceptás las{' '}
          <Link href="#" className="text-[#D4AF37] hover:underline">
            normas de la comunidad
          </Link>{' '}
          y{' '}
          <Link href="#" className="text-[#D4AF37] hover:underline">
            lineamientos cinematográficos
          </Link>
          .
        </p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all">
              Guardar como borrador
            </button>

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-sm font-semibold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-sm font-semibold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0B0D10]/30 border-t-[#0B0D10] rounded-full animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Clapperboard className="w-4 h-4" />
                    Crear círculo
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
