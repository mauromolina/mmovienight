'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acceptInvitation } from './actions'

interface JoinGroupButtonProps {
  groupId: string
  inviteId: string
  token: string
}

export function JoinGroupButton({ groupId, inviteId, token }: JoinGroupButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async () => {
    setIsLoading(true)
    setError(null)

    const result = await acceptInvitation(inviteId, token, groupId)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push(`/grupos/${groupId}`)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      <Button
        onClick={handleJoin}
        isLoading={isLoading}
        size="lg"
        className="w-full sm:w-auto"
        leftIcon={<Users className="w-5 h-5" />}
      >
        Unirme al grupo
      </Button>
    </div>
  )
}
