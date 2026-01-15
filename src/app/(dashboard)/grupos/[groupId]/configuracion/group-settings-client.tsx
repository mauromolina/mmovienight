'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  User,
  Crown,
  Trash2,
  UserMinus,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Save,
  Link2,
  Users,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Group, Profile, InviteCode } from '@/types'

interface GroupSettingsClientProps {
  group: Group
  members: (Profile & { role: string })[]
  inviteCodes: InviteCode[]
  currentUserId: string
}

type Tab = 'general' | 'members' | 'invites' | 'danger'

export function GroupSettingsClient({
  group,
  members,
  inviteCodes,
  currentUserId,
}: GroupSettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('general')

  // General settings state
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Members state
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  // Invite codes state
  const [codes, setCodes] = useState(inviteCodes)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)

  // Delete group state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: Shield },
    { id: 'members' as Tab, label: 'Miembros', icon: Users },
    { id: 'invites' as Tab, label: 'Invitaciones', icon: Link2 },
    { id: 'danger' as Tab, label: 'Zona peligrosa', icon: AlertTriangle },
  ]

  // Save general settings
  const handleSaveGeneral = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || null }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    if (memberId === currentUserId) return // Can't remove yourself

    setRemovingMemberId(memberId)
    try {
      const response = await fetch(`/api/groups/${group.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error removing member:', error)
    } finally {
      setRemovingMemberId(null)
    }
  }

  // Copy invite code
  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Generate new invite code
  const handleGenerateCode = async () => {
    setIsGeneratingCode(true)
    try {
      const response = await fetch(`/api/groups/${group.id}/invite-code`, {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok && data.code) {
        // Add to list if not already there
        if (!codes.find((c) => c.code === data.code)) {
          setCodes([{ code: data.code, id: '', group_id: group.id, created_by: currentUserId, is_active: true, use_count: 0, created_at: new Date().toISOString() } as InviteCode, ...codes])
        }
      }
    } catch (error) {
      console.error('Error generating code:', error)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  // Delete group
  const handleDeleteGroup = async () => {
    if (deleteConfirmText !== group.name) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/grupos')
      }
    } catch (error) {
      console.error('Error deleting group:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Sidebar - Tabs */}
      <div className="lg:col-span-1">
        <nav className="flex lg:flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer text-left',
                activeTab === tab.id
                  ? tab.id === 'danger'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-[#16C7D9]/10 text-[#16C7D9] border border-[#16C7D9]/20'
                  : 'text-[#6B7280] hover:text-[#9AA3AD] hover:bg-[#14181D]'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="lg:col-span-3">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#14181D] border border-[#1E2328]">
              <h2 className="text-lg font-bold text-[#F2F4F6] mb-6">Información del grupo</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                    Nombre del grupo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] focus:outline-none focus:border-[#16C7D9] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="¿De qué se trata este grupo?"
                    className="w-full px-4 py-3 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#4A5568] focus:outline-none focus:border-[#16C7D9] transition-colors resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveGeneral}
                  disabled={isSaving || name.trim() === ''}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#16C7D9] hover:bg-[#14B8C9] disabled:bg-[#16C7D9]/50 rounded-xl text-sm font-semibold text-[#0B0D10] transition-all cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      Guardado
                    </>
                  ) : isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members Management */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#14181D] border border-[#1E2328]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#F2F4F6]">
                  Miembros ({members.length})
                </h2>
              </div>

              <div className="space-y-3">
                {members.map((member) => {
                  const isOwner = member.role === 'owner'
                  const isCurrentUser = member.id === currentUserId

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#0B0D10]/50 border border-[#1E2328]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1A2026] overflow-hidden flex items-center justify-center">
                          {member.avatar_url ? (
                            <Image
                              src={member.avatar_url}
                              alt={member.display_name || ''}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-[#4A5568]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#F2F4F6]">
                              {member.display_name || member.email}
                            </span>
                            {isOwner && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/20 rounded text-[10px] font-bold text-[#D4AF37]">
                                <Crown className="w-3 h-3" />
                                Admin
                              </span>
                            )}
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 bg-[#16C7D9]/20 rounded text-[10px] font-bold text-[#16C7D9]">
                                Vos
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#6B7280]">{member.email}</span>
                        </div>
                      </div>

                      {!isOwner && !isCurrentUser && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removingMemberId === member.id}
                          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-medium text-red-400 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {removingMemberId === member.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserMinus className="w-3.5 h-3.5" />
                          )}
                          Eliminar
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Invite Codes */}
        {activeTab === 'invites' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#14181D] border border-[#1E2328]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#F2F4F6]">Códigos de invitación</h2>
                <button
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                  className="flex items-center gap-2 px-4 py-2 bg-[#16C7D9]/10 hover:bg-[#16C7D9]/20 border border-[#16C7D9]/30 rounded-lg text-sm font-medium text-[#16C7D9] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingCode ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Generar nuevo
                </button>
              </div>

              {codes.length === 0 ? (
                <div className="text-center py-8">
                  <Link2 className="w-12 h-12 text-[#2A3038] mx-auto mb-3" />
                  <p className="text-sm text-[#6B7280]">No hay códigos activos</p>
                  <p className="text-xs text-[#4A5568] mt-1">
                    Generá uno para invitar gente al grupo
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {codes.map((code) => (
                    <div
                      key={code.code}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#0B0D10]/50 border border-[#1E2328]"
                    >
                      <div>
                        <span className="text-xl font-mono font-bold text-[#16C7D9] tracking-widest">
                          {code.code}
                        </span>
                        <p className="text-xs text-[#6B7280] mt-1">
                          Usado {code.use_count || 0} veces
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyCode(code.code)}
                        className="flex items-center gap-2 px-3 py-2 bg-[#1A2026] hover:bg-[#242A32] border border-[#2A3038] rounded-lg text-sm text-[#9AA3AD] hover:text-[#F2F4F6] transition-all cursor-pointer"
                      >
                        {copiedCode === code.code ? (
                          <>
                            <Check className="w-4 h-4 text-[#10B981]" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        {activeTab === 'danger' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-400">Eliminar grupo</h2>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Esta acción es irreversible. Se eliminarán todas las películas, calificaciones y datos del grupo.
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar este grupo
                </button>
              ) : (
                <div className="space-y-4 p-4 rounded-xl bg-[#0B0D10]/50 border border-red-500/20">
                  <p className="text-sm text-[#9AA3AD]">
                    Para confirmar, escribí el nombre del grupo: <strong className="text-[#F2F4F6]">{group.name}</strong>
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Nombre del grupo"
                    className="w-full px-4 py-3 bg-[#0B0D10] border border-red-500/30 rounded-xl text-[#F2F4F6] placeholder-[#4A5568] focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
                      className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#9AA3AD] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeleteGroup}
                      disabled={deleteConfirmText !== group.name || isDeleting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Eliminar permanentemente
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
