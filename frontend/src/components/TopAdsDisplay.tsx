import { useKV } from '@github/spark/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { User, PoliticalParty } from '@/App'
import { Crown } from '@phosphor-icons/react'

export interface AdPurchase {
  id: string
  userId: string
  username: string
  displayName: string
  party: PoliticalParty
  avatar?: string
  position: 'left' | 'center' | 'right'
  states: string[]
  startDate: string
  endDate: string
  amount: number
  bannerType?: 'photo' | 'text'
  bannerPhoto?: string
  bannerText?: string
  bannerUsername?: string
}

interface TopAdsDisplayProps {
  userState?: string
}

export function TopAdsDisplay({ userState = 'CA' }: TopAdsDisplayProps) {
  const [activeAds] = useKV<AdPurchase[]>('activeAds', [])

  const now = new Date().toISOString()
  const currentAds = (activeAds || []).filter(ad => {
    const isActive = ad.startDate <= now && ad.endDate >= now
    const isInUserState = ad.states.includes(userState) || ad.states.includes('ALL')
    return isActive && isInUserState
  })

  const leftAd = currentAds.find(ad => ad.position === 'left')
  const centerAd = currentAds.find(ad => ad.position === 'center')
  const rightAd = currentAds.find(ad => ad.position === 'right')

  const getPartyLabel = (party: PoliticalParty) => {
    switch (party) {
      case 'democrat':
        return 'Top Democrat'
      case 'republican':
        return 'Top Republican'
      case 'independent':
        return 'Top Independent'
    }
  }

  const getPartyColor = (party: PoliticalParty) => {
    switch (party) {
      case 'democrat':
        return 'bg-blue-600 text-white'
      case 'republican':
        return 'bg-red-600 text-white'
      case 'independent':
        return 'bg-gray-600 text-white'
    }
  }

  const AdCard = ({ ad }: { ad: AdPurchase }) => (
    <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg">
      <CardContent className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="h-5 w-5 text-yellow-600" weight="fill" />
          <Badge className={getPartyColor(ad.party)}>
            {getPartyLabel(ad.party)}
          </Badge>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={ad.avatar} />
            <AvatarFallback>{ad.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{ad.displayName}</p>
            <p className="text-xs text-muted-foreground">@{ad.username}</p>
          </div>
        </div>
        <p className="text-xs text-yellow-700 mt-1 font-medium">Featured Today</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full bg-background/95 backdrop-blur border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Ad */}
          <div className="flex justify-center">
            {leftAd ? (
              <AdCard ad={leftAd} />
            ) : (
              <Card className="bg-muted/50 border-dashed border-2 border-muted-foreground/30">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground text-sm">Ad Space Available</p>
                  <p className="text-xs text-muted-foreground">$500/day</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center Ad */}
          <div className="flex justify-center">
            {centerAd ? (
              <AdCard ad={centerAd} />
            ) : (
              <Card className="bg-muted/50 border-dashed border-2 border-muted-foreground/30">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground text-sm">Premium Center Spot</p>
                  <p className="text-xs text-muted-foreground">$500/day</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Ad */}
          <div className="flex justify-center">
            {rightAd ? (
              <AdCard ad={rightAd} />
            ) : (
              <Card className="bg-muted/50 border-dashed border-2 border-muted-foreground/30">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground text-sm">Ad Space Available</p>
                  <p className="text-xs text-muted-foreground">$500/day</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}