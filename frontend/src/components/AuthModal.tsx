import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Building, Heart, Scales } from '@phosphor-icons/react'
import type { PoliticalParty, User } from '@/App'
import { toast } from 'sonner'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [, setCurrentUser] = useKV<User | null>('currentUser', null)
  const [, setUsers] = useKV<User[]>('users', [])
  const [step, setStep] = useState<'welcome' | 'signup' | 'login'>('welcome')
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    party: 'independent' as PoliticalParty,
    bio: '',
    autoFollow: true
  })

  const partyOptions = [
    { 
      value: 'democrat', 
      label: 'Democrat', 
      icon: Heart, 
      color: 'bg-democrat text-democrat-foreground',
      description: 'Progressive values, social equality'
    },
    { 
      value: 'republican', 
      label: 'Republican', 
      icon: Building, 
      color: 'bg-republican text-republican-foreground',
      description: 'Traditional values, limited government'
    },
    { 
      value: 'independent', 
      label: 'Independent', 
      icon: Scales, 
      color: 'bg-independent text-independent-foreground',
      description: 'Balanced perspective, issue-focused'
    }
  ]

  const handleSignup = async () => {
    if (!formData.username.trim() || !formData.displayName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    let users: User[] = []
    try {
      const raw = window.localStorage.getItem('users')
      users = raw ? (JSON.parse(raw) as User[]) : []
    } catch {
      users = []
    }
    
    if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
      toast.error('Username already taken')
      return
    }

    const autoFollowUsers = users.filter(u => u.inAutoFollowProgram)

    const newUser: User = {
      id: `user_${Date.now()}`,
      username: formData.username,
      displayName: formData.displayName,
      party: formData.party,
      bio: formData.bio,
      followers: [],
      following: formData.autoFollow ? autoFollowUsers.map(u => u.id) : [],
      friends: [],
      earnings: 0,
      totalTips: 0,
      joinDate: new Date().toISOString(),
      followerCount: 0,
      impressions: 0,
      tokens: 0,
      autoFollow: formData.autoFollow
    }

    await setUsers([...users, newUser])
    await setCurrentUser(newUser)
    toast.success(`Welcome to Lerumos, ${newUser.displayName}!`)
    onClose()
  }

  const handleLogin = async () => {
    let users: User[] = []
    try {
      const raw = window.localStorage.getItem('users')
      users = raw ? (JSON.parse(raw) as User[]) : []
    } catch {
      users = []
    }
    const user = users.find(u => u.username.toLowerCase() === formData.username.toLowerCase())
    
    if (!user) {
      toast.error('User not found')
      return
    }

    await setCurrentUser(user)
    toast.success(`Welcome back, ${user.displayName}!`)
    onClose()
  }

  if (step === 'welcome') {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              🏛️ Lerumos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-center text-muted-foreground">
              Join the political conversation. Share your voice, earn tips, and engage with your community.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => setStep('signup')} 
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
              <Button 
                onClick={() => setStep('login')} 
                variant="outline" 
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (step === 'signup') {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Join Lerumos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="@yourusername"
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div>
              <Label>Political Affiliation</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {partyOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <Card 
                      key={option.value}
                      className={`p-3 cursor-pointer border-2 transition-all ${
                        formData.party === option.value 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, party: option.value as PoliticalParty }))}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={24} className="text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.label}</span>
                            <Badge className={option.color}>{option.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Input
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
              <Checkbox 
                id="autoFollow"
                checked={formData.autoFollow}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoFollow: checked as boolean }))}
              />
              <Label htmlFor="autoFollow" className="cursor-pointer flex-1 text-sm">
                Automatically follow featured users (recommended for discovering popular accounts)
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('welcome')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSignup} className="flex-1">
                Create Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Sign In</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="loginUsername">Username</Label>
            <Input
              id="loginUsername"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep('welcome')} className="flex-1">
              Back
            </Button>
            <Button onClick={handleLogin} className="flex-1">
              Sign In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}