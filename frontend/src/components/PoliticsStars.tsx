import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Star, Check, Crown, Users, Heart, ChatCircle, Eye } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User } from '@/App'

interface PoliticsStarsProps {
  user: User
  onUserUpdate: (user: User) => void
}

export function PoliticsStars({ user, onUserUpdate }: PoliticsStarsProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [isProcessing, setIsProcessing] = useState(false)

  const MONTHLY_COST = 3000

  const benefits = [
    { icon: Users, label: '100M Followers per Month', color: 'text-blue-600' },
    { icon: Heart, label: '100M Likes Across 100 Posts', color: 'text-red-600' },
    { icon: ChatCircle, label: '100K AI Comments per Post', color: 'text-green-600' },
    { icon: Eye, label: '100M Views Across 100 Videos', color: 'text-purple-600' },
    { icon: Star, label: 'Politics Stars Badge', color: 'text-yellow-600' },
    { icon: Crown, label: 'Premium Profile Badge', color: 'text-amber-600' }
  ]

  const isPoliticsStar = user.isPoliticsStarMember && user.politicsStarExpiresAt && new Date(user.politicsStarExpiresAt) > new Date()

  const purchaseMembership = async () => {
    if ((user.earnings || 0) < MONTHLY_COST) {
      toast.error(`Insufficient funds! You need $${MONTHLY_COST}`)
      return
    }

    setIsProcessing(true)

    try {
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)

      const updatedUser: User = {
        ...user,
        earnings: (user.earnings || 0) - MONTHLY_COST,
        isPoliticsStarMember: true,
        politicsStarExpiresAt: expiresAt.toISOString(),
        followerCount: (user.followerCount || 0) + 100000000,
        tokens: (user.tokens || 0)
      }

      const updatedUsers = (users || []).map(u => 
        u.id === user.id ? updatedUser : u
      )
      
      await setUsers(updatedUsers)
      onUserUpdate(updatedUser)

      toast.success('🌟 Welcome to Politics Stars! Your benefits are now active!')
    } catch (error) {
      toast.error('Failed to purchase membership')
    } finally {
      setIsProcessing(false)
    }
  }

  const renewMembership = async () => {
    if ((user.earnings || 0) < MONTHLY_COST) {
      toast.error(`Insufficient funds! You need $${MONTHLY_COST}`)
      return
    }

    setIsProcessing(true)

    try {
      const currentExpiry = user.politicsStarExpiresAt ? new Date(user.politicsStarExpiresAt) : new Date()
      const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()))
      newExpiry.setMonth(newExpiry.getMonth() + 1)

      const updatedUser: User = {
        ...user,
        earnings: (user.earnings || 0) - MONTHLY_COST,
        isPoliticsStarMember: true,
        politicsStarExpiresAt: newExpiry.toISOString(),
        followerCount: (user.followerCount || 0) + 100000000
      }

      const updatedUsers = (users || []).map(u => 
        u.id === user.id ? updatedUser : u
      )
      
      await setUsers(updatedUsers)
      onUserUpdate(updatedUser)

      toast.success('🌟 Membership renewed! Your benefits extended for another month!')
    } catch (error) {
      toast.error('Failed to renew membership')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-yellow-400 rounded-full">
              <Star size={32} weight="fill" className="text-yellow-900" />
            </div>
            <div>
              <div>Politics Stars</div>
              <div className="text-sm font-normal text-muted-foreground">
                Premium Membership Program
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isPoliticsStar && (
            <div className="p-4 bg-green-100 border-2 border-green-400 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star size={24} weight="fill" className="text-green-700" />
                <span className="font-semibold text-green-900">Active Member</span>
              </div>
              <p className="text-sm text-green-800">
                Your membership expires on{' '}
                <strong>{new Date(user.politicsStarExpiresAt!).toLocaleDateString()}</strong>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Membership Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg border"
                  >
                    <Icon size={24} className={benefit.color} />
                    <div>
                      <p className="text-sm font-medium">{benefit.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold mb-3">How It Works</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check size={18} className="text-green-600 mt-0.5" />
                <span>Receive 100M followers immediately upon membership activation</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="text-green-600 mt-0.5" />
                <span>Get 100M likes distributed across your next 100 posts</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="text-green-600 mt-0.5" />
                <span>Each post receives 100K positive AI-generated comments</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="text-green-600 mt-0.5" />
                <span>100M views distributed across your next 100 videos</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="text-green-600 mt-0.5" />
                <span>Exclusive Politics Stars badge on your profile</span>
              </li>
            </ul>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-yellow-700">${MONTHLY_COST}/month</p>
              <p className="text-sm text-muted-foreground">Your balance: ${(user.earnings || 0).toFixed(2)}</p>
            </div>
          </div>

          {isPoliticsStar ? (
            <Button
              onClick={renewMembership}
              disabled={isProcessing || (user.earnings || 0) < MONTHLY_COST}
              className="w-full h-12 text-lg gap-2 bg-yellow-600 hover:bg-yellow-700"
              size="lg"
            >
              <Crown size={24} />
              {isProcessing ? 'Processing...' : `Renew Membership - $${MONTHLY_COST}`}
            </Button>
          ) : (
            <Button
              onClick={purchaseMembership}
              disabled={isProcessing || (user.earnings || 0) < MONTHLY_COST}
              className="w-full h-12 text-lg gap-2 bg-yellow-600 hover:bg-yellow-700"
              size="lg"
            >
              <Star size={24} />
              {isProcessing ? 'Processing...' : `Join Politics Stars - $${MONTHLY_COST}/mo`}
            </Button>
          )}

          {!isPoliticsStar && (user.earnings || 0) < MONTHLY_COST && (
            <p className="text-sm text-destructive text-center">
              You need ${(MONTHLY_COST - (user.earnings || 0)).toFixed(2)} more to purchase this membership
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
