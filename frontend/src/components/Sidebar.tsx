import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  House, 
  Smiley, 
  ChatCircle, 
  User as UserIcon, 
  SignOut,
  Building,
  Heart,
  Scales,
  Crown,
  Hash,
  Gear,
  ShieldCheck,
  Question,
  MagnifyingGlass
} from '@phosphor-icons/react'
import type { User } from '@/App'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import api from '@/lib/api'

interface SidebarProps {
  user: User
  currentView: 'feed' | 'memes' | 'messages' | 'profile' | 'ads' | 'hashtags' | 'admin' | 'settings' | 'support' | 'search'
  onViewChange: (view: 'feed' | 'memes' | 'messages' | 'profile' | 'ads' | 'hashtags' | 'admin' | 'settings' | 'support' | 'search') => void
}

export function Sidebar({ user, currentView, onViewChange }: SidebarProps) {
  const [, setCurrentUser] = useKV<User | null>('currentUser', null)

  const partyIcon = {
    democrat: Heart,
    republican: Building,
    independent: Scales
  }[user.party]

  const partyColor = {
    democrat: 'bg-democrat text-democrat-foreground',
    republican: 'bg-republican text-republican-foreground', 
    independent: 'bg-independent text-independent-foreground'
  }[user.party]

  const handleSignOut = async () => {
    try {
      // Call backend logout endpoint to destroy session
      await api.logout()
      // Clear local user state
      await setCurrentUser(null)
      toast.success('Signed out successfully')
      // Reload page to show login modal
      window.location.reload()
    } catch (error: any) {
      // Even if logout fails, clear local state
      await setCurrentUser(null)
      toast.error(error.message || 'Logout failed, but local session cleared')
      // Reload page to show login modal
      window.location.reload()
    }
  }

  const menuItems = [
    { id: 'feed', label: 'Home Feed', icon: House },
    { id: 'search', label: 'Search', icon: MagnifyingGlass },
    { id: 'hashtags', label: 'Hashtags', icon: Hash },
    { id: 'memes', label: 'Meme Wall', icon: Smiley },
    { id: 'messages', label: 'Messages', icon: ChatCircle },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'ads', label: 'Ads Manager', icon: Crown },
    { id: 'settings', label: 'Settings', icon: Gear },
    { id: 'support', label: 'Support', icon: Question },
    ...(user.isAdmin ? [{ id: 'admin' as const, label: 'Admin Panel', icon: ShieldCheck }] : [])
  ]

  const PartyIcon = partyIcon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-2xl">🏛️</span>
        <span className="text-xl font-bold">Lerumos Political Party</span>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user.displayName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{user.displayName}</div>
              <div className="text-sm text-muted-foreground">@{user.username}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Badge className={partyColor}>
              <PartyIcon size={14} className="mr-1" />
              {user.party.charAt(0).toUpperCase() + user.party.slice(1)}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            {(user.followerCount || 0).toLocaleString()} followers • {user.following?.length || 0} following
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start gap-3 h-12"
              onClick={() => onViewChange(item.id as any)}
            >
              <Icon size={20} />
              {item.label}
            </Button>
          )
        })}
      </div>

      {/* Sign Out */}
      <div className="pt-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <SignOut size={20} />
          Sign Out
        </Button>
      </div>
    </div>
  )
}