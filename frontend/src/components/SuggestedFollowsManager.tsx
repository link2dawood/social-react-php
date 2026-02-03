import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyDollar, Star, Clock, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User } from '@/App'

interface SuggestedFollowsManagerProps {
  user: User
  onUserUpdate: (user: User) => void
}

export function SuggestedFollowsManager({ user, onUserUpdate }: SuggestedFollowsManagerProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [selectedSlot, setSelectedSlot] = useState<number>(0)
  const [duration, setDuration] = useState<'1' | '7' | '30'>('1')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const defaultRate = 50
  const rate = user.suggestedFollowsRate || defaultRate

  const durationMultipliers = {
    '1': 1,
    '7': 6,
    '30': 20
  }

  const activeSlots = user.suggestedFollowsSlots || []
  const totalSlots = 3

  const calculateCost = () => {
    return rate * durationMultipliers[duration]
  }

  const handlePurchaseSlot = async () => {
    const cost = calculateCost()

    if (user.tokens < cost) {
      toast.error('Insufficient tokens')
      return
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + parseInt(duration))

    const updatedUsers = (users || []).map(u => {
      if (u.id === user.id) {
        const existingSlot = activeSlots.find(s => s.slotIndex === selectedSlot)
        let newSlots = [...activeSlots]
        
        if (existingSlot) {
          newSlots = newSlots.filter(s => s.slotIndex !== selectedSlot)
        }

        newSlots.push({
          slotIndex: selectedSlot,
          userId: user.id,
          expiresAt: expiresAt.toISOString(),
          rate: rate
        })

        return {
          ...u,
          tokens: u.tokens - cost,
          suggestedFollowsSlots: newSlots
        }
      }
      return u
    })

    await setUsers(updatedUsers)
    const updatedUser = updatedUsers.find(u => u.id === user.id)
    if (updatedUser) {
      onUserUpdate(updatedUser)
    }

    toast.success(`Purchased slot ${selectedSlot + 1} for ${duration} day(s)!`)
    setIsDialogOpen(false)
  }

  const getSlotStatus = (slotIndex: number) => {
    const slot = activeSlots.find(s => s.slotIndex === slotIndex)
    if (!slot) return { status: 'available', user: null, daysLeft: 0 }

    const expiresAt = new Date(slot.expiresAt)
    const now = new Date()
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft <= 0) {
      return { status: 'expired', user: null, daysLeft: 0 }
    }

    const slotUser = (users || []).find(u => u.id === slot.userId)
    return { status: 'occupied', user: slotUser, daysLeft }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={20} />
          Suggested Follows Promotion
        </CardTitle>
        <CardDescription>
          Purchase slots to feature in the "Suggested Follows" section site-wide
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent">
          <div className="flex items-center gap-3">
            <CurrencyDollar size={24} className="text-accent" />
            <div>
              <div className="font-semibold text-accent">Current Rate</div>
              <div className="text-sm text-muted-foreground">
                {rate} tokens per day
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-accent">{rate}</div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold">Available Slots ({totalSlots})</Label>
          <div className="space-y-3">
            {Array.from({ length: totalSlots }).map((_, index) => {
              const slotStatus = getSlotStatus(index)
              const isOwned = slotStatus.user?.id === user.id

              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    slotStatus.status === 'available' 
                      ? 'border-green-500/50 bg-green-500/5'
                      : isOwned
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">Slot {index + 1}</div>
                        {slotStatus.status === 'available' && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Available
                          </Badge>
                        )}
                        {slotStatus.status === 'occupied' && slotStatus.user && (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={slotStatus.user.avatar} />
                              <AvatarFallback className="text-xs">
                                {slotStatus.user.displayName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{slotStatus.user.displayName}</span>
                            {isOwned && (
                              <Badge variant="default">Your Slot</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {slotStatus.status === 'occupied' && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock size={16} />
                          <span>{slotStatus.daysLeft}d left</span>
                        </div>
                      )}
                      <Dialog open={isDialogOpen && selectedSlot === index} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedSlot(index)}
                            variant={slotStatus.status === 'available' ? 'default' : 'outline'}
                          >
                            {slotStatus.status === 'available' ? 'Purchase' : isOwned ? 'Extend' : 'Takeover'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Purchase Slot {index + 1}</DialogTitle>
                            <DialogDescription>
                              Appear in the "Suggested Follows" section for all users
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Duration</Label>
                              <Select value={duration} onValueChange={(v) => setDuration(v as '1' | '7' | '30')}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 Day - {rate} tokens</SelectItem>
                                  <SelectItem value="7">7 Days - {rate * 6} tokens (Save 1 day!)</SelectItem>
                                  <SelectItem value="30">30 Days - {rate * 20} tokens (Save 10 days!)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="p-4 bg-muted rounded-lg space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Rate per day</span>
                                <span className="font-medium">{rate} tokens</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Duration</span>
                                <span className="font-medium">{duration} day(s)</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between">
                                <span className="font-semibold">Total Cost</span>
                                <span className="font-bold text-lg">{calculateCost()} tokens</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Star size={16} className="text-accent" />
                              <span>Your balance: {user.tokens} tokens</span>
                            </div>

                            <Button 
                              className="w-full" 
                              onClick={handlePurchaseSlot}
                              disabled={user.tokens < calculateCost()}
                            >
                              Purchase for {calculateCost()} tokens
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold">How It Works</Label>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                1
              </div>
              <p>Purchase a slot to appear in "Suggested Follows" for all users</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                2
              </div>
              <p>Choose your duration: 1, 7, or 30 days (longer = better value)</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                3
              </div>
              <p>Gain visibility and grow your follower count across the platform</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
