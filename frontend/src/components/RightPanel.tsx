import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CurrencyDollar, TrendUp, UserPlus } from '@phosphor-icons/react'
import type { User, Post } from '@/App'

interface RightPanelProps {
  user: User
}

export function RightPanel({ user }: RightPanelProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [posts] = useKV<Post[]>('posts', [])

  const getSuggestedUsers = () => {
    const now = new Date()
    const sponsoredUsers: Array<{ user: User; isSponsored: boolean }> = []
    const usersList = users || []

    const allActiveSlots: Array<{ user: User; slotIndex: number }> = []

    usersList.forEach(u => {
      if (u.id === user.id) return
      if ((user.following || []).includes(u.id)) return
      
      if (u.suggestedFollowsSlots && u.suggestedFollowsSlots.length > 0) {
        u.suggestedFollowsSlots.forEach(slot => {
          const expiresAt = new Date(slot.expiresAt)
          if (expiresAt > now) {
            allActiveSlots.push({ user: u, slotIndex: slot.slotIndex })
          }
        })
      }
    })

    allActiveSlots.sort((a, b) => a.slotIndex - b.slotIndex)
    
    allActiveSlots.forEach(slot => {
      const exists = sponsoredUsers.find(s => s.user.id === slot.user.id)
      if (!exists) {
        sponsoredUsers.push({ user: slot.user, isSponsored: true })
      }
    })

    if (sponsoredUsers.length < 3) {
      const organicUsers = usersList
        .filter(u => {
          if (u.id === user.id) return false
          if ((user.following || []).includes(u.id)) return false
          if (sponsoredUsers.find(s => s.user.id === u.id)) return false
          return true
        })
        .sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0))
        .slice(0, 3 - sponsoredUsers.length)
      
      sponsoredUsers.push(...organicUsers.map(u => ({ user: u, isSponsored: false })))
    }

    return sponsoredUsers.slice(0, 3)
  }

  const suggestedUsers = getSuggestedUsers()

  const trendingTopics = [
    '#Election2024',
    '#PoliticalDebate', 
    '#VoteNow',
    '#PolicyChange',
    '#AmericaFirst'
  ]

  const topEarners = (users || [])
    .sort((a, b) => (b.totalTips || 0) - (a.totalTips || 0))
    .slice(0, 3)

  const handleFollow = async (targetUserId: string) => {
    const updatedUsers = (users || []).map(u => {
      if (u.id === user.id) {
        return { ...u, following: [...(u.following || []), targetUserId] }
      }
      if (u.id === targetUserId) {
        return { 
          ...u, 
          followers: [...(u.followers || []), user.id],
          followerCount: (u.followerCount || 0) + 1
        }
      }
      return u
    })

    await setUsers(updatedUsers)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-accent/10 border-accent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-accent">
            <CurrencyDollar size={20} />
            Daily Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-2xl font-bold text-accent">
              ${(user.earnings || 0).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Your earnings</div>
          </div>
          <div className="text-xs text-muted-foreground">
            Platform fee: 10%
          </div>
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Cash Out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendUp size={20} />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {trendingTopics.map((topic, index) => (
            <div
              key={topic}
              className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
            >
              <span className="font-medium text-primary">{topic}</span>
              <span className="text-xs text-muted-foreground">
                #{index + 1}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Top Earners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topEarners.map((earner, index) => (
            <div key={earner.id} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={earner.avatar} />
                <AvatarFallback className="text-xs">
                  {earner.displayName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-medium">{earner.displayName}</div>
                <div className="text-xs text-accent">
                  ${(earner.totalTips || 0).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus size={20} />
            Suggested Follows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestedUsers.map(({ user: suggestedUser, isSponsored }) => {
            const partyColor = {
              democrat: 'bg-democrat text-democrat-foreground',
              republican: 'bg-republican text-republican-foreground',
              independent: 'bg-independent text-independent-foreground'
            }[suggestedUser.party]

            return (
              <div key={suggestedUser.id} className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={suggestedUser.avatar} />
                  <AvatarFallback className="text-sm">
                    {suggestedUser.displayName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">{suggestedUser.displayName}</div>
                    {isSponsored && (
                      <Badge variant="secondary" className="text-xs">
                        Sponsored
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${partyColor} text-xs`}>
                      {suggestedUser.party}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {(suggestedUser.followerCount || 0).toLocaleString()} followers
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleFollow(suggestedUser.id)}>
                  Follow
                </Button>
              </div>
            )
          })}
          
          {suggestedUsers.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              No suggestions available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
