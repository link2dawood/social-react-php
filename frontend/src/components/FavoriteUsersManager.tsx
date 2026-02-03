import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, SiteSettings } from '@/App'
import { Users, CurrencyDollar, Calendar } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface FavoriteUsersManagerProps {
  user: User
  onUserUpdate: (user: User) => void
}

export function FavoriteUsersManager({ user, onUserUpdate }: FavoriteUsersManagerProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [siteSettings, setSiteSettings] = useKV<SiteSettings | undefined>('siteSettings', undefined)
  const [slotRates, setSlotRates] = useState<{ [key: number]: string }>(() => {
    const rates: { [key: number]: string } = {}
    for (let i = 0; i < 5; i++) {
      rates[i] = (user.slotRates?.[i] || 10).toString()
    }
    return rates
  })
  const [isUpdatingRate, setIsUpdatingRate] = useState(false)

  const activeSlots = user.favoriteUsersSlots?.filter(slot => 
    new Date(slot.expiresAt) > new Date()
  ) || []

  const availableSlots = 5 - activeSlots.length

  const handleUpdateSlotRate = async (slotIndex: number) => {
    const rate = parseFloat(slotRates[slotIndex])
    if (!rate || rate < 1) {
      toast.error('Rate must be at least $1 per day')
      return
    }

    setIsUpdatingRate(true)
    try {
      const updatedSlotRates = { ...(user.slotRates || {}), [slotIndex]: rate }
      const updatedUser = { ...user, slotRates: updatedSlotRates }
      onUserUpdate(updatedUser)
      
      const updatedUsers = (users || []).map(u => 
        u.id === user.id ? updatedUser : u
      )
      await setUsers(updatedUsers)
      
      toast.success(`Slot ${slotIndex + 1} rate set to $${rate.toFixed(2)}/day`)
    } catch (error) {
      toast.error('Failed to update rate')
    } finally {
      setIsUpdatingRate(false)
    }
  }

  const getSlotUser = (userId: string) => {
    return users?.find(u => u.id === userId)
  }

  const getSlotRate = (slotIndex: number): number => {
    return user.slotRates?.[slotIndex] || 10
  }

  const totalDailyEarnings = activeSlots.reduce((sum, slot) => sum + slot.rate, 0)
  const platformShare = totalDailyEarnings * 0.5
  const userShare = totalDailyEarnings * 0.5

  const allSlots = Array.from({ length: 5 }, (_, i) => {
    const activeSlot = activeSlots.find(s => s.slotIndex === i)
    return {
      slotIndex: i,
      rate: getSlotRate(i),
      isRented: !!activeSlot,
      rentalInfo: activeSlot
    }
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Favorite Users Slots Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Rent out spots on your profile for other users to be featured. Set individual rates for each slot. You keep 50% of the rental fee, the platform keeps 50%.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold">{availableSlots}/5</div>
              <div className="text-sm text-muted-foreground">Available Slots</div>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent">${userShare.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Your Daily Share</div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">${totalDailyEarnings.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Daily Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual Slot Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allSlots.map((slot) => {
              const slotUser = slot.rentalInfo ? getSlotUser(slot.rentalInfo.userId) : null
              const daysRemaining = slot.rentalInfo 
                ? Math.ceil((new Date(slot.rentalInfo.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : 0

              return (
                <div key={slot.slotIndex} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={slot.isRented ? "default" : "outline"}>
                        Slot {slot.slotIndex + 1}
                      </Badge>
                      {slot.isRented && slotUser && (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={slotUser.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {slotUser.displayName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">@{slotUser.username}</span>
                        </div>
                      )}
                    </div>
                    {slot.isRented && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Calendar size={12} />
                        {daysRemaining} days left
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`slot-rate-${slot.slotIndex}`} className="text-xs">
                        Daily Rate ($)
                      </Label>
                      <Input
                        id={`slot-rate-${slot.slotIndex}`}
                        type="number"
                        min="1"
                        step="0.01"
                        value={slotRates[slot.slotIndex]}
                        onChange={(e) => setSlotRates(prev => ({ ...prev, [slot.slotIndex]: e.target.value }))}
                        placeholder="10.00"
                        disabled={slot.isRented}
                      />
                    </div>
                    <Button 
                      onClick={() => handleUpdateSlotRate(slot.slotIndex)}
                      disabled={isUpdatingRate || slot.isRented}
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>

                  {slot.isRented && slot.rentalInfo && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Currently earning ${(slot.rentalInfo.rate * 0.5).toFixed(2)}/day from this slot
                    </div>
                  )}
                  {!slot.isRented && (
                    <div className="text-xs text-muted-foreground">
                      Available for rent at ${parseFloat(slotRates[slot.slotIndex] || '10').toFixed(2)}/day
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Set individual daily rates for each of your 5 slots (minimum $1)</p>
          <p>• Users can rent available slots for 1-30 days by visiting your profile</p>
          <p>• Featured users appear above your posts in a "Favorite Users" section</p>
          <p>• You receive 50% of the rental fee, platform keeps 50%</p>
          <p>• Earnings are added to your account automatically each day</p>
          <p>• Rates can only be changed when slots are not rented</p>
        </CardContent>
      </Card>
    </div>
  )
}
