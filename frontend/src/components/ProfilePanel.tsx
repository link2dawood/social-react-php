import { useState, useRef } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PostCard } from '@/components/PostCard'
import { FavoriteUsersDisplay } from '@/components/FavoriteUsersDisplay'
import { 
  User as UserIcon, 
  PencilSimple, 
  CurrencyDollar, 
  Heart,
  Users,
  FileText,
  Building,
  Scales,
  Camera,
  Image as ImageIcon,
  UserPlus,
  UserMinus
} from '@phosphor-icons/react'
import type { User, Post } from '@/App'
import { toast } from 'sonner'

interface ProfilePanelProps {
  user: User
  currentUser?: User
  onUserUpdate?: (user: User) => void
}

export function ProfilePanel({ user, currentUser, onUserUpdate }: ProfilePanelProps) {
  const actualCurrentUser = currentUser || user
  const isOwnProfile = user.id === actualCurrentUser.id
  
  const [, setCurrentUser] = useKV<User | null>('currentUser', null)
  const [users, setUsers] = useKV<User[]>('users', [])
  const [posts] = useKV<Post[]>('posts', [])
  const [isEditing, setIsEditing] = useState(false)
  const [showFollowersDialog, setShowFollowersDialog] = useState(false)
  const [showFollowingDialog, setShowFollowingDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: user.displayName,
    bio: user.bio || '',
    party: user.party,
    avatar: user.avatar || '',
    banner: user.banner || ''
  })
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const isFollowing = actualCurrentUser.following?.includes(user.id) || false

  const handleFollowToggle = async () => {
    if (isOwnProfile) return

    const updatedUsers = (users || []).map(u => {
      if (u.id === actualCurrentUser.id) {
        const following = u.following || []
        return {
          ...u,
          following: isFollowing
            ? following.filter(id => id !== user.id)
            : [...following, user.id]
        }
      }
      if (u.id === user.id) {
        const followers = u.followers || []
        return {
          ...u,
          followers: isFollowing
            ? followers.filter(id => id !== actualCurrentUser.id)
            : [...followers, actualCurrentUser.id],
          followerCount: isFollowing
            ? Math.max(0, (u.followerCount || 0) - 1)
            : (u.followerCount || 0) + 1
        }
      }
      return u
    })

    await setUsers(updatedUsers)
    if (onUserUpdate) {
      const updatedUser = updatedUsers.find(u => u.id === user.id)
      if (updatedUser) onUserUpdate(updatedUser)
    }
    toast.success(isFollowing ? `Unfollowed @${user.username}` : `Following @${user.username}`)
  }

  const getFollowers = () => {
    return (users || []).filter(u => (user.followers || []).includes(u.id))
  }

  const getFollowing = () => {
    return (users || []).filter(u => (user.following || []).includes(u.id))
  }

  const userPosts = (posts || []).filter(post => post.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setEditForm(prev => ({ ...prev, avatar: result }))
      toast.success('Avatar uploaded!')
    }
    reader.readAsDataURL(file)
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setEditForm(prev => ({ ...prev, banner: result }))
      toast.success('Banner uploaded!')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    const updatedUser = {
      ...user,
      displayName: editForm.displayName,
      bio: editForm.bio,
      party: editForm.party,
      avatar: editForm.avatar,
      banner: editForm.banner
    }

    const updatedUsers = (users || []).map(u => 
      u.id === user.id ? updatedUser : u
    )

    await setUsers(updatedUsers)
    if (isOwnProfile) {
      await setCurrentUser(updatedUser)
    }
    if (onUserUpdate) {
      onUserUpdate(updatedUser)
    }
    setIsEditing(false)
    toast.success('Profile updated!')
  }

  const PartyIcon = partyIcon
  const totalEngagement = userPosts.reduce((sum, post) => 
    sum + post.likes.length + post.comments.length, 0
  )

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        {user.banner && !isEditing && (
          <div className="h-32 md:h-48 overflow-hidden rounded-t-lg relative">
            <img 
              src={user.banner} 
              alt="Profile banner" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {isEditing && editForm.banner && (
          <div className="h-32 md:h-48 overflow-hidden rounded-t-lg relative group">
            <img 
              src={editForm.banner} 
              alt="Profile banner" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => bannerInputRef.current?.click()}
              >
                <ImageIcon size={16} className="mr-2" />
                Change Banner
              </Button>
            </div>
          </div>
        )}
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserIcon size={24} />
              {isOwnProfile ? 'Profile' : `@${user.username}'s Profile`}
            </CardTitle>
            {isOwnProfile && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <PencilSimple size={16} className="mr-1" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing && isOwnProfile ? (
            <div className="space-y-4">
              <input 
                type="file" 
                ref={avatarInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <input 
                type="file" 
                ref={bannerInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleBannerUpload}
              />
              
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={editForm.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                      {editForm.displayName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}>
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera size={16} className="mr-2" />
                    Upload Avatar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <ImageIcon size={16} className="mr-2" />
                    Upload Banner
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({...prev, displayName: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({...prev, bio: e.target.value}))}
                  placeholder="Tell us about your political views..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {user.displayName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-2xl font-bold">{user.displayName}</h2>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
                
                <Badge className={`${partyColor} w-fit`}>
                  <PartyIcon size={14} className="mr-1" />
                  {user.party.charAt(0).toUpperCase() + user.party.slice(1)}
                </Badge>

                {user.bio && (
                  <p className="text-sm leading-relaxed">{user.bio}</p>
                )}

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Users size={16} />
                        <span className="font-medium text-foreground">{(user.followerCount || 0).toLocaleString()}</span> followers
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Followers</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {getFollowers().length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No followers yet</p>
                        ) : (
                          getFollowers().map(follower => (
                            <div key={follower.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={follower.avatar} />
                                <AvatarFallback>
                                  {follower.displayName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-semibold">{follower.displayName}</div>
                                <div className="text-sm text-muted-foreground">@{follower.username}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Users size={16} />
                        <span className="font-medium text-foreground">{user.following?.length || 0}</span> following
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Following</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {getFollowing().length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Not following anyone yet</p>
                        ) : (
                          getFollowing().map(following => (
                            <div key={following.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={following.avatar} />
                                <AvatarFallback>
                                  {following.displayName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-semibold">{following.displayName}</div>
                                <div className="text-sm text-muted-foreground">@{following.username}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex items-center gap-1">
                    <FileText size={16} />
                    <span className="font-medium text-foreground">{userPosts.length}</span> posts
                  </div>
                </div>

                {!isOwnProfile && (
                  <Button
                    onClick={handleFollowToggle}
                    variant={isFollowing ? "outline" : "default"}
                    className="gap-2"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus size={18} />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Follow
                      </>
                    )}
                  </Button>
                )}

                <div className="text-xs text-muted-foreground">
                  Member since {new Date(user.joinDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">${(user.earnings || 0).toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Current Earnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">${(user.totalTips || 0).toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Tips Received</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalEngagement}</div>
            <div className="text-sm text-muted-foreground">Total Engagement</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{(user.impressions || 0).toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Impressions</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts ({userPosts.filter(p => p.type === 'post').length})</TabsTrigger>
          <TabsTrigger value="memes">Memes ({userPosts.filter(p => p.type === 'meme').length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="space-y-4">
          <FavoriteUsersDisplay profileUser={user} currentUser={actualCurrentUser} />
          
          {userPosts.filter(p => p.type === 'post').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
                <div className="text-muted-foreground">No posts yet</div>
              </CardContent>
            </Card>
          ) : (
            userPosts.filter(p => p.type === 'post').map((post) => (
              <PostCard key={post.id} post={post} currentUser={actualCurrentUser} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="memes" className="space-y-4">
          {userPosts.filter(p => p.type === 'meme').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">😄</div>
                <div className="text-muted-foreground">No memes yet</div>
              </CardContent>
            </Card>
          ) : (
            userPosts.filter(p => p.type === 'meme').map((post) => (
              <PostCard key={post.id} post={post} currentUser={actualCurrentUser} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">Activity feed coming soon</div>
              <div className="text-sm text-muted-foreground mt-2">
                Track your likes, comments, and tips
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}