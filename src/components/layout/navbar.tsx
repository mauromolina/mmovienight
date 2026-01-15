'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Film, LogOut, Menu, X, Search, User, Loader2, Users } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/(auth)/actions'
import type { Profile } from '@/types'

interface GroupSearchResult {
  id: string
  name: string
  image_url: string | null
}

interface NavbarProps {
  user: Profile | null
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GroupSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)

  // Close user menu and search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node) &&
          mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    const query = searchQuery.trim()

    if (query.length < 1) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/groups/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.groups || [])
        }
      } catch (error) {
        console.error('Error searching groups:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 200)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleGroupSelect = (groupId: string) => {
    setSearchQuery('')
    setShowSearchResults(false)
    setIsMobileMenuOpen(false)
    router.push(`/grupos/${groupId}`)
  }

  const navigation = [
    { name: 'Dashboard', href: '/grupos' },
    { name: 'Explorar', href: '/explorar' },
    { name: 'Actividad', href: '/actividad' },
    { name: 'Watchlist', href: '/watchlist' },
  ]

  const isActive = (href: string) => {
    if (href === '/grupos') {
      return pathname === '/grupos' || pathname.startsWith('/grupos/')
    }
    if (href === '/actividad') {
      return pathname === '/actividad' || pathname.startsWith('/actividad/')
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="sticky top-0 z-40 bg-[#0B0D10]/80 backdrop-blur-xl border-b border-[#1A2026]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/grupos" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#16C7D9] to-[#0EA5E9] flex items-center justify-center shadow-lg shadow-[#16C7D9]/50">
              <Film className="w-5 h-5 text-[#0B0D10]" />
            </div>
            <span className="italic text-lg font-bold tracking-wide">
              <span className="text-[#16C7D9] drop-shadow-[0_0_15px_rgba(22,199,217,0.7)]">
                MM
              </span>
              <span className="text-[#F2F4F6] drop-shadow-[0_0_12px_rgba(242,244,246,0.4)]">
                OVIENIGHT
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'text-[#16C7D9]'
                    : 'text-[#9AA3AD] hover:text-[#F2F4F6]'
                )}
              >
                {item.name}
                {isActive(item.href) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#16C7D9] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search - Desktop only */}
            <div className="hidden md:flex items-center" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSearchResults(true)
                  }}
                  onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
                  placeholder="Buscar grupos..."
                  className="w-48 lg:w-56 pl-9 pr-4 py-2 bg-[#14181D] border border-[#2A3038] rounded-xl text-sm text-[#F2F4F6] placeholder-[#4A5568] focus:outline-none focus:border-[#16C7D9] transition-colors"
                />

                {/* Search Results Dropdown */}
                {showSearchResults && searchQuery.length >= 1 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#14181D] border border-[#2A3038] rounded-xl overflow-hidden z-50 shadow-xl">
                    {isSearching ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-3">
                        <Loader2 className="w-4 h-4 text-[#16C7D9] animate-spin" />
                        <span className="text-sm text-[#6B7280]">Buscando...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => handleGroupSelect(group.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1A2026] transition-colors text-left cursor-pointer"
                        >
                          {group.image_url ? (
                            <Image
                              src={group.image_url}
                              alt={group.name}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#16C7D9]/40 to-[#0EA5E9]/40 flex items-center justify-center">
                              <Users className="w-4 h-4 text-[#16C7D9]" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-[#F2F4F6] truncate">{group.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center">
                        <p className="text-sm text-[#6B7280]">No se encontraron grupos</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User Avatar & Dropdown Menu */}
            {user && (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    'w-9 h-9 rounded-full overflow-hidden border-2 transition-colors cursor-pointer',
                    isUserMenuOpen ? 'border-[#16C7D9]' : 'border-[#2A3038] hover:border-[#16C7D9]'
                  )}
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.display_name || user.email}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#16C7D9] to-[#0EA5E9] flex items-center justify-center text-[#0B0D10] font-bold text-sm">
                      {(user.display_name || user.email)[0].toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                <div
                  className={cn(
                    'absolute right-0 top-full mt-2 w-48 py-2 bg-[#14181D] border border-[#2A3038] rounded-xl shadow-xl shadow-black/40 transition-all duration-200 origin-top-right z-[100]',
                    isUserMenuOpen
                      ? 'opacity-100 scale-100 pointer-events-auto'
                      : 'opacity-0 scale-95 pointer-events-none'
                  )}
                >
                  <Link
                    href="/perfil"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#9AA3AD] hover:text-[#F2F4F6] hover:bg-[#1A2026] transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Mi perfil
                  </Link>
                  <div className="my-1 border-t border-[#2A3038]" />
                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9AA3AD] hover:text-[#F2F4F6] hover:bg-[#1A2026] transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#9AA3AD] hover:text-[#F2F4F6] hover:bg-[#14181D] transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#1A2026] bg-[#0B0D10]">
          {/* Mobile Search */}
          <div className="px-4 py-3 border-b border-[#1A2026]" ref={mobileSearchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(true)
                }}
                onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
                placeholder="Buscar grupos..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#14181D] border border-[#2A3038] rounded-xl text-sm text-[#F2F4F6] placeholder-[#4A5568] focus:outline-none focus:border-[#16C7D9]"
              />

              {/* Mobile Search Results Dropdown */}
              {showSearchResults && searchQuery.length >= 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#14181D] border border-[#2A3038] rounded-xl overflow-hidden z-50 shadow-xl">
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-3">
                      <Loader2 className="w-4 h-4 text-[#16C7D9] animate-spin" />
                      <span className="text-sm text-[#6B7280]">Buscando...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleGroupSelect(group.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1A2026] transition-colors text-left cursor-pointer"
                      >
                        {group.image_url ? (
                          <Image
                            src={group.image_url}
                            alt={group.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#16C7D9]/40 to-[#0EA5E9]/40 flex items-center justify-center">
                            <Users className="w-4 h-4 text-[#16C7D9]" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-[#F2F4F6] truncate">{group.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center">
                      <p className="text-sm text-[#6B7280]">No se encontraron grupos</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Nav Links */}
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-[#16C7D9]/10 text-[#16C7D9]'
                    : 'text-[#9AA3AD] hover:text-[#F2F4F6] hover:bg-[#14181D]'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile User Section */}
          {user && (
            <div className="px-4 py-4 border-t border-[#1A2026]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#2A3038]">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.display_name || user.email}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#16C7D9] to-[#0EA5E9] flex items-center justify-center text-[#0B0D10] font-bold">
                      {(user.display_name || user.email)[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F2F4F6]">
                    {user.display_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-[#9AA3AD]">{user.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  href="/perfil"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-[#F2F4F6] bg-[#14181D] hover:bg-[#1A2026] transition-colors"
                >
                  <User className="w-4 h-4" />
                  Mi perfil
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] bg-[#14181D] hover:bg-[#1A2026] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
