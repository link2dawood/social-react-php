import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { User, SiteSettings } from '@/App'
import { Users, Star, CurrencyDollar, Calendar } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface FavoriteUsersDisplayProps {
  profileUser: User
  currentUser: User
}

export function FavoriteUsersDisplay({ profileUser, currentUser }: FavoriteUsersDisplayProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [siteSettings, setSiteSettings] = useKV<SiteSettings | undefined>('siteSettings', undefined)
  const [rentDays, setRentDays] = useState('1')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRentDialog, setShowRentDialog] = useState(false)

  const activeSlots = profileUser.favoriteUsersSlots?.filter(slot => 
    new Date(slot.expiresAt) > new Date()
  ) || []

  const getSlotRate = (slotIndex: number): number => {
    return profileUser.slotRates?.[slotIndex] || profileUser.favoriteUsersRate || 10
  }

  const allSlots = Array.from({ length: 5 }, (_, i) => {
    const activeSlot = activeSlots.find(s => s.slotIndex === i)
    return {
      slotIndex: i,
      rate: getSlotRate(i),
      isRented: !!activeSlot,
      rentalInfo: activeSlot
    }
  })

  const availableSlots = allSlots.filter(s => !s.isRented)

  const handleRentSlot = async () => {
    if (selectedSlot === null) {
      toast.error('Please select a slot')
      return
    }

    const days = parseInt(rentDays)
    if (!days || days < 1 || days > 30) {
      toast.error('Please enter a valid number of days (1-30)')
      return
    }

    const slotRate = getSlotRate(selectedSlot)
    const totalCost = slotRate * days
    
    if (totalCost > currentUser.earnings) {
      toast.error('Insufficient earnings. Please add funds or reduce rental days.')
      return
    }

    setIsProcessing(true)
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)

      const userShare = totalCost * 0.5
      const platformShare = totalCost * 0.5

      const newSlot = {
        slotIndex: selectedSlot,
        userId: currentUser.id,
        expiresAt: expiresAt.toISOString(),
        rate: slotRate
      }

      const updatedProfileUser = {
        ...profileUser,
        favoriteUsersSlots: [...(profileUser.favoriteUsersSlots || []), newSlot],
        earnings: profileUser.earnings + userShare
      }

      const updatedCurrentUser = {
        ...currentUser,
        earnings: currentUser.earnings - totalCost
      }

      const updatedSiteSettings = siteSettings ? {
        ...siteSettings,
        siteFunds: siteSettings.siteFunds + platformShare
      } : undefined

      const updatedUsers = (users || []).map(u => {
        if (u.id === profileUser.id) return updatedProfileUser
        if (u.id === currentUser.id) return updatedCurrentUser
        return u
      })

      await setUsers(updatedUsers)
      if (updatedSiteSettings) {
        await setSiteSettings(updatedSiteSettings)
      }

      toast.success(`Successfully rented slot ${selectedSlot + 1} for ${days} days! You'll be featured on @${profileUser.username}'s profile.`)
      setShowRentDialog(false)
      setSelectedSlot(null)
      setRentDays('1')
    } catch (error) {
      toast.error('Failed to rent slot')
    } finally {
      setIsProcessing(false)
    }
  }

  const getSlotUser = (userId: string) => {
    return users?.find(u => u.id === userId)
  }

  const isOwnProfile = currentUser.id === profileUser.id

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={20} weight="fill" className="text-accent" />
            {isOwnProfile ? 'My Favorite Users' : `${profileUser.username}'s Favorite Users`}
          </div>
          {!isOwnProfile && availableSlots.length > 0 && (
            <Badge variant="secondary">
              {availableSlots.length} {availableSlots.length === 1 ? 'slot' : 'slots'} available
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeSlots.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              {isOwnProfile 
                ? 'No one has rented a slot on your profile yet. Users can rent one of your 5 featured slots for custom fees you set!' 
                : 'No featured users yet. Be the first to appear here!'}
            </p>
            {isOwnProfile && (
              <p className="text-xs text-muted-foreground">
                You earn 50% of rental fees. Set your rates in Settings.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3">
            {activeSlots.map((slot) => {
              const slotUser = getSlotUser(slot.userId)
              if (!slotUser) return null

              return (
                <button
                  key={slot.slotIndex}
                  onClick={() => window.location.href = `#profile-${slotUser.id}`}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <Avatar className="w-12 h-12 border-2 border-accent">
                    <AvatarImage src={slotUser.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {slotUser.displayName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-center">
                    <div className="font-medium truncate w-full">@{slotUser.username}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {!isOwnProfile && availableSlots.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium">Want to be featured here?</div>
                <div className="text-sm text-muted-foreground">
                  Choose from {availableSlots.length} available slot{availableSlots.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <Dialog open={showRentDialog} onOpenChange={setShowRentDialog}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Star />
                  Rent a Favorite User Slot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rent Favorite User Slot</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Profile:</span>
                      <span className="font-medium">@{profileUser.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Your Balance:</span>
                      <span className="font-medium">${currentUser.earnings.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Select a Slot</Label>
                    <div className="space-y-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.slotIndex}
                          onClick={() => setSelectedSlot(slot.slotIndex)}
                          className={`w-full p-3 border rounded-lg text-left transition-colors ${
                            selectedSlot === slot.slotIndex
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={selectedSlot === slot.slotIndex ? "default" : "outline"}>
                                Slot {slot.slotIndex + 1}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 font-medium">
                              <CurrencyDollar size={16} />
                              ${slot.rate.toFixed(2)}/day
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rentDays">Number of Days (1-30)</Label>
                    <Input
                      id="rentDays"
                      type="number"
                      min="1"
                      max="30"
                      value={rentDays}
                      onChange={(e) => setRentDays(e.target.value)}
                    />
                  </div>

                  {selectedSlot !== null && (
                    <div className="p-4 bg-accent/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Cost:</span>
                        <span className="text-2xl font-bold text-accent">
                          ${(getSlotRate(selectedSlot) * parseInt(rentDays || '1')).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Your profile will be featured prominently on @{profileUser.username}'s profile page for {rentDays} day{parseInt(rentDays) !== 1 ? 's' : ''}.
                  </p>

                  <Button
                    onClick={handleRentSlot}
                    disabled={isProcessing || selectedSlot === null || parseInt(rentDays) < 1 || parseInt(rentDays) > 30}
                    className="w-full gap-2"
                  >
                    <CurrencyDollar />
                    Confirm Rental
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
