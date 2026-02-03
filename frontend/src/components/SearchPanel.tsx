import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PostCard } from '@/components/PostCard'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import { 
  MagnifyingGlass, 
  User as UserIcon, 
  Heart,
  Building,
  Scales,
  UserPlus,
  Users
} from '@phosphor-icons/react'
import type { User, Post } from '@/App'
import { toast } from 'sonner'

interface SearchPanelProps {
  user: User
}

export function SearchPanel({ user }: SearchPanelProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [posts] = useKV<Post[]>('posts', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users')

  const filteredUsers = (users || [])
    .filter(u => u.id !== user.id)
    .filter(u => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        u.username.toLowerCase().includes(query) ||
        u.displayName.toLowerCase().includes(query) ||
        u.bio?.toLowerCase().includes(query)
      )
    })

  const filteredPosts = (posts || [])
    .filter(p => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return p.content.toLowerCase().includes(query)
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const handleFollow = async (targetUser: User) => {
    const isFollowing = user.following.includes(targetUser.id)
    
    const updatedUsers = (users || []).map(u => {
      if (u.id === user.id) {
        const following = isFollowing
          ? u.following.filter(id => id !== targetUser.id)
          : [...u.following, targetUser.id]
        return { ...u, following }
      }
      if (u.id === targetUser.id) {
        const followers = isFollowing
          ? u.followers.filter(id => id !== user.id)
          : [...u.followers, user.id]
        const followerCount = isFollowing 
          ? Math.max(0, (u.followerCount || 0) - 1)
          : (u.followerCount || 0) + 1
        return { ...u, followers, followerCount }
      }
      return u
    })

    await setUsers(updatedUsers)
    toast.success(isFollowing ? `Unfollowed @${targetUser.username}` : `Following @${targetUser.username}`)
  }

  const getPartyIcon = (party: string) => {
    return {
      democrat: Heart,
      republican: Building,
      independent: Scales
    }[party] || Scales
  }

  const getPartyColor = (party: string) => {
    return {
      democrat: 'bg-democrat text-democrat-foreground',
      republican: 'bg-republican text-republican-foreground',
      independent: 'bg-independent text-independent-foreground'
    }[party] || 'bg-independent text-independent-foreground'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MagnifyingGlass size={24} />
            Search
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Find users and posts across the political spectrum
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search users or posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <MagnifyingGlass size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'posts')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">
            Users ({filteredUsers.length})
          </TabsTrigger>
          <TabsTrigger value="posts">
            Posts ({filteredPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-6">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <UserIcon size={48} className="mx-auto mb-4 text-muted-foreground" />
                <div className="text-muted-foreground">
                  {searchQuery ? 'No users found matching your search' : 'No users to display'}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((targetUser) => {
              const PartyIcon = getPartyIcon(targetUser.party)
              const partyColor = getPartyColor(targetUser.party)
              const isFollowing = user.following.includes(targetUser.id)

              return (
                <Card key={targetUser.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={targetUser.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {targetUser.displayName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{targetUser.displayName}</span>
                            {targetUser.isVerified && <VerifiedBadge size="sm" />}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{targetUser.username}
                          </div>
                          <Badge className={`${partyColor} text-xs mt-1 w-fit`}>
                            <PartyIcon size={12} className="mr-1" />
                            {targetUser.party}
                          </Badge>
                          {targetUser.bio && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {targetUser.bio}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users size={14} />
                              <span className="font-medium">{(targetUser.followerCount || 0).toLocaleString()}</span> followers
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleFollow(targetUser)}
                      >
                        <UserPlus size={16} className="mr-1" />
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4 mt-6">
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MagnifyingGlass size={48} className="mx-auto mb-4 text-muted-foreground" />
                <div className="text-muted-foreground">
                  {searchQuery ? 'No posts found matching your search' : 'No posts to display'}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUser={user} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
