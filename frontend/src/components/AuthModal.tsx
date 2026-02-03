import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, Heart, Scales } from '@phosphor-icons/react'
import type { PoliticalParty, User } from '@/App'
import { toast } from 'sonner'
import api from '@/lib/api'

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
    email: '',
    password: '',
    displayName: '',
    party: 'independent' as PoliticalParty,
    bio: ''
  })
  const [loading, setLoading] = useState(false)

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
    if (!formData.username.trim() || !formData.displayName.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const userData = await api.signup({
      username: formData.username,
        email: formData.email,
        password: formData.password,
      displayName: formData.displayName,
      party: formData.party,
        bio: formData.bio
      })

      // Transform backend user to frontend User format
      const newUser: User = {
        id: String(userData.id),
        username: userData.username || formData.username,
        displayName: userData.displayName || userData.name || formData.displayName,
        party: (userData.party || formData.party) as PoliticalParty,
        bio: userData.bio || formData.bio,
        avatar: userData.avatar,
      followers: [],
      following: [],
      friends: [],
        earnings: userData.earnings || 0,
        totalTips: userData.totalTips || 0,
        joinDate: userData.joinDate || new Date().toISOString(),
        followerCount: userData.followerCount || 0,
        impressions: userData.impressions || 0,
        tokens: userData.tokens || 0,
        isVerified: userData.isVerified || false
      }

    await setCurrentUser(newUser)
    toast.success(`Welcome to Lerumos, ${newUser.displayName}!`)
    onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error('Please enter username/email and password')
      return
    }

    setLoading(true)
    try {
      const userData = await api.login(formData.username, formData.password)

      // Transform backend user to frontend User format
      const user: User = {
        id: String(userData.id),
        username: userData.username || formData.username,
        displayName: userData.displayName || userData.name || '',
        party: (userData.party || 'independent') as PoliticalParty,
        bio: userData.bio,
        avatar: userData.avatar,
        followers: userData.followers || [],
        following: userData.following || [],
        friends: userData.friends || [],
        earnings: userData.earnings || 0,
        totalTips: userData.totalTips || 0,
        joinDate: userData.joinDate || new Date().toISOString(),
        followerCount: userData.followerCount || 0,
        impressions: userData.impressions || 0,
        tokens: userData.tokens || 0,
        isVerified: userData.isVerified || false
    }

    // Set user state - this will trigger App.tsx to re-render
    await setCurrentUser(user)
    
    // Force a small delay to ensure state is persisted
    await new Promise(resolve => setTimeout(resolve, 50))
    
    toast.success(`Welcome back, ${user.displayName}!`)
    
    // Close modal - App.tsx will detect currentUser change and show dashboard
    onClose()
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
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
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="@yourusername"
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your Name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="At least 6 characters"
              />
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

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('welcome')} className="flex-1" disabled={loading}>
                Back
              </Button>
              <Button onClick={handleSignup} className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
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
            <Label htmlFor="loginUsername">Username or Email</Label>
            <Input
              id="loginUsername"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username or email"
            />
          </div>
          <div>
            <Label htmlFor="loginPassword">Password</Label>
            <Input
              id="loginPassword"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep('welcome')} className="flex-1" disabled={loading}>
              Back
            </Button>
            <Button onClick={handleLogin} className="flex-1" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}