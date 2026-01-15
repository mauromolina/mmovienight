'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Camera,
  Lock,
  Trash2,
  X,
  Check,
  Loader2,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Banner presets - cinematic images
const bannerPresets = [
  { id: 'cinema-1', url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025', label: 'Cinema Classic' },
  { id: 'theater-1', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070', label: 'Theater Noir' },
  { id: 'space-1', url: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?q=80&w=2107', label: 'Space Opera' },
  { id: 'drama-1', url: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=2028', label: 'Drama Stage' },
  { id: 'neon-1', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029', label: 'Neon Nights' },
  { id: 'vintage-1', url: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=2079', label: 'Vintage Reel' },
]

interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  banner_url: string | null
  banner_preset: string | null
}

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Profile data
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null)
  const [pendingAvatarRemoval, setPendingAvatarRemoval] = useState(false)
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedBanner, setSelectedBanner] = useState(bannerPresets[0])
  const [showBannerSelector, setShowBannerSelector] = useState(false)

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          const profileData = data.profile as Profile
          setProfile(profileData)
          setGoogleAvatarUrl(data.googleAvatarUrl || null)

          // Populate form with current values
          setDisplayName(profileData.display_name || '')
          setBio(profileData.bio || '')
          // Use profile avatar, or fallback to Google avatar
          const effectiveAvatar = profileData.avatar_url || data.googleAvatarUrl || null
          setAvatarUrl(effectiveAvatar)
          setOriginalAvatarUrl(effectiveAvatar)

          // Set banner from preset or default
          if (profileData.banner_preset) {
            const preset = bannerPresets.find(b => b.id === profileData.banner_preset)
            if (preset) setSelectedBanner(preset)
          } else if (profileData.banner_url) {
            // Custom banner URL - create a custom preset entry
            setSelectedBanner({ id: 'custom', url: profileData.banner_url, label: 'Custom' })
          }
        } else {
          setError('Error al cargar el perfil')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Error al cargar el perfil')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // If avatar was marked for removal, delete it first
      if (pendingAvatarRemoval && originalAvatarUrl) {
        const deleteResponse = await fetch('/api/profile/avatar', {
          method: 'DELETE',
        })
        if (!deleteResponse.ok) {
          const data = await deleteResponse.json()
          setError(data.error || 'Error al eliminar la imagen')
          setIsSaving(false)
          return
        }
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          bio: bio,
          banner_preset: selectedBanner.id !== 'custom' ? selectedBanner.id : null,
          banner_url: selectedBanner.id === 'custom' ? selectedBanner.url : selectedBanner.url,
        }),
      })

      if (response.ok) {
        router.push('/perfil')
      } else {
        const data = await response.json()
        setError(data.error || 'Error al guardar cambios')
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Error al guardar cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es muy grande. Máximo 5MB.')
      return
    }

    setIsUploadingAvatar(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setAvatarUrl(data.avatar_url)
        setOriginalAvatarUrl(data.avatar_url)
        setPendingAvatarRemoval(false) // Reset removal flag since we uploaded a new one
        // Update profile state as well
        if (profile) {
          setProfile({ ...profile, avatar_url: data.avatar_url })
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Error al subir la imagen')
      }
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setError('Error al subir la imagen')
    } finally {
      setIsUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = () => {
    // Just update local state - actual deletion happens on save
    setAvatarUrl(null)
    setPendingAvatarRemoval(true)
  }

  const handleRestoreGoogleAvatar = async () => {
    if (!googleAvatarUrl) return

    setIsUploadingAvatar(true)
    setError(null)

    try {
      const response = await fetch('/api/profile/avatar/restore-google', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setAvatarUrl(data.avatar_url)
        setOriginalAvatarUrl(data.avatar_url)
        setPendingAvatarRemoval(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Error al restaurar la imagen')
      }
    } catch (err) {
      console.error('Error restoring Google avatar:', err)
      setError('Error al restaurar la imagen')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#16C7D9] animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/perfil"
        className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#F2F4F6] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al perfil
      </Link>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#F2F4F6] mb-2">
          Editar perfil de <span className="text-[#D4AF37]">cine</span>
        </h1>
        <p className="text-sm sm:text-base text-[#6B7280]">
          Personalizá cómo se ve tu perfil para tus círculos de cine
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl">
          <p className="text-sm text-[#EF4444]">{error}</p>
        </div>
      )}

      {/* Visual Section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-[#F2F4F6] mb-4">Visuales del perfil</h2>

        {/* Banner */}
        <div className="relative mb-12 sm:mb-16">
          <div
            className="relative h-32 sm:h-48 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => setShowBannerSelector(true)}
          >
            <Image
              src={selectedBanner.url}
              alt="Banner"
              fill
              className="object-cover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <span className="text-sm sm:text-base font-medium text-white">Cambiar banner</span>
            </div>
          </div>

          {/* Avatar - Overlapping banner */}
          <div className="absolute -bottom-10 sm:-bottom-12 left-4 sm:left-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#16C7D9] to-[#0EA5E9] p-1">
                <div className="w-full h-full rounded-full bg-[#14181D] flex items-center justify-center overflow-hidden relative">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-8 h-8 text-[#16C7D9] animate-spin" />
                  ) : avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName || 'Avatar'}
                      fill
                      className="object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-2xl sm:text-4xl font-bold text-[#16C7D9]">
                      {(displayName || profile?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {/* Upload avatar button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#16C7D9] hover:bg-[#14B8C9] disabled:bg-[#16C7D9]/50 flex items-center justify-center text-[#0B0D10] transition-all cursor-pointer shadow-lg"
                title="Cambiar foto de perfil"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              {/* Remove avatar button - only show if there's an avatar */}
              {avatarUrl && !isUploadingAvatar && (
                <button
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#EF4444] hover:bg-[#DC2626] flex items-center justify-center text-white transition-all cursor-pointer shadow-lg"
                  title="Eliminar foto de perfil"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Restore Google avatar button - show when no avatar but Google avatar available */}
            {!avatarUrl && googleAvatarUrl && !isUploadingAvatar && (
              <button
                onClick={handleRestoreGoogleAvatar}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-[#1A2026] hover:bg-[#242A32] border border-[#2A3038] rounded-lg text-xs font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all cursor-pointer"
              >
                <Image
                  src={googleAvatarUrl}
                  alt="Google"
                  width={16}
                  height={16}
                  className="rounded-full"
                />
                Usar foto de Google
              </button>
            )}
          </div>
        </div>

        {/* Banner Selector Modal */}
        {showBannerSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#14181D] rounded-2xl border border-[#2A3038] p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#F2F4F6]">Elegí tu banner</h3>
                <button
                  onClick={() => setShowBannerSelector(false)}
                  className="p-2 rounded-lg text-[#6B7280] hover:text-[#F2F4F6] hover:bg-[#1A2026] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {bannerPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedBanner(preset)
                      setShowBannerSelector(false)
                    }}
                    className={cn(
                      'relative aspect-video rounded-xl overflow-hidden group cursor-pointer transition-all',
                      selectedBanner.id === preset.id
                        ? 'ring-2 ring-[#16C7D9] ring-offset-2 ring-offset-[#14181D]'
                        : 'hover:ring-1 hover:ring-[#3A4048]'
                    )}
                  >
                    <Image
                      src={preset.url}
                      alt={preset.label}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-xs font-medium text-white">
                      {preset.label}
                    </span>
                    {selectedBanner.id === preset.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#16C7D9] flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#0B0D10]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Form Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-[#9AA3AD] mb-2">
              Nombre visible
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-[#14181D] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] focus:outline-none focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/30 transition-all"
              placeholder="Tu nombre"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-[#9AA3AD] mb-2">
              Bio cinéfila
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={300}
              className="w-full px-4 py-3 bg-[#14181D] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] resize-none focus:outline-none focus:border-[#16C7D9] focus:ring-1 focus:ring-[#16C7D9]/30 transition-all"
              placeholder="Contá algo sobre tus gustos cinematográficos..."
            />
            <p className="mt-1 text-xs text-[#4A5568] text-right">
              {bio.length}/300
            </p>
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#9AA3AD] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-[#6B7280] cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-[#4A5568]">
              El email no puede ser modificado
            </p>
          </div>
        </div>

        {/* Right Column - Info Card */}
        <div>
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#14181D] to-[#12151A] border border-[#1E2328]/60 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#1A2026] flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-[#6B7280]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F2F4F6] mb-1">Información de cuenta</h3>
                <p className="text-xs text-[#6B7280]">Tu perfil es visible para los miembros de tus círculos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-10 pt-6 border-t border-[#1E2328]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Delete Account */}
          <button className="flex items-center gap-2 text-sm text-[#EF4444]/70 hover:text-[#EF4444] transition-colors cursor-pointer order-2 sm:order-1">
            <Trash2 className="w-4 h-4" />
            Eliminar cuenta
          </button>

          {/* Save / Cancel */}
          <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
            <Link
              href="/perfil"
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-[#1A2026] hover:bg-[#242A32] border border-[#2A3038] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#D4AF37] hover:bg-[#C9A432] disabled:bg-[#D4AF37]/50 rounded-xl text-sm sm:text-base font-bold text-[#0B0D10] transition-all shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
