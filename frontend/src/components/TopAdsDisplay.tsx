import { useKV } from '@/hooks/use-kv'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { User, PoliticalParty } from '@/App'
import { Crown, SpeakerHigh, SpeakerX, Play, Pause } from '@phosphor-icons/react'
import { useState, useEffect, useRef } from 'react'

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
  bannerType?: 'photo' | 'text' | 'video'
  bannerPhoto?: string
  bannerVideo?: string
  bannerText?: string
  bannerUsername?: string
  views?: number
  clicks?: number
}

interface TopAdsDisplayProps {
  userState?: string
}

export function TopAdsDisplay({ userState = 'CA' }: TopAdsDisplayProps) {
  const [activeAds, setActiveAds] = useKV<AdPurchase[]>('activeAds', [])
  const [rotationIndex, setRotationIndex] = useState(0)

  const now = new Date().toISOString()
  const currentAds = (activeAds || []).filter(ad => {
    const isActive = ad.startDate <= now && ad.endDate >= now
    const isInUserState = ad.states.includes(userState) || ad.states.includes('ALL')
    return isActive && isInUserState
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setRotationIndex(prev => prev + 1)
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    currentAds.forEach(ad => {
      const updatedAds = (activeAds || []).map(a => 
        a.id === ad.id ? { ...a, views: (a.views || 0) + 1 } : a
      )
      setActiveAds(updatedAds)
    })
  }, [rotationIndex])

  const handleAdClick = (adId: string) => {
    const updatedAds = (activeAds || []).map(ad => 
      ad.id === adId ? { ...ad, clicks: (ad.clicks || 0) + 1 } : ad
    )
    setActiveAds(updatedAds)
  }

  const getAdsForPosition = (pos: 'left' | 'center' | 'right') => {
    return currentAds.filter(ad => ad.position === pos)
  }

  const getRotatedAd = (pos: 'left' | 'center' | 'right') => {
    const positionAds = getAdsForPosition(pos)
    if (positionAds.length === 0) return undefined
    return positionAds[rotationIndex % positionAds.length]
  }

  const leftAd = getRotatedAd('left')
  const centerAd = getRotatedAd('center')
  const rightAd = getRotatedAd('right')

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

  const AdCard = ({ ad }: { ad: AdPurchase }) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isMuted, setIsMuted] = useState(true)
    const [isPlaying, setIsPlaying] = useState(true)

    const toggleMute = () => {
      if (videoRef.current) {
        videoRef.current.muted = !isMuted
        setIsMuted(!isMuted)
      }
    }

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause()
        } else {
          videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
      }
    }

    if (ad.bannerType === 'photo' && ad.bannerPhoto) {
      return (
        <Card 
          className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleAdClick(ad.id)}
        >
          <CardContent className="p-0 relative">
            <img 
              src={ad.bannerPhoto} 
              alt={`Ad by @${ad.bannerUsername || ad.username}`}
              className="w-full h-32 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-400" weight="fill" />
                  <p className="font-semibold text-white text-xs">@{ad.bannerUsername || ad.username}</p>
                </div>
                <Badge className={getPartyColor(ad.party)} variant="secondary">
                  {getPartyLabel(ad.party)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (ad.bannerType === 'video' && ad.bannerVideo) {
      return (
        <Card 
          className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleAdClick(ad.id)}
        >
          <CardContent className="p-0 relative group">
            <video 
              ref={videoRef}
              src={ad.bannerVideo}
              className="w-full h-32 object-cover"
              autoPlay
              loop
              muted={isMuted}
              playsInline
            />
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0 bg-black/70 hover:bg-black/90 border-0"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay()
                }}
              >
                {isPlaying ? (
                  <Pause className="h-3 w-3 text-white" weight="fill" />
                ) : (
                  <Play className="h-3 w-3 text-white" weight="fill" />
                )}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0 bg-black/70 hover:bg-black/90 border-0"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                }}
              >
                {isMuted ? (
                  <SpeakerX className="h-3 w-3 text-white" weight="fill" />
                ) : (
                  <SpeakerHigh className="h-3 w-3 text-white" weight="fill" />
                )}
              </Button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-400" weight="fill" />
                  <p className="font-semibold text-white text-xs">@{ad.bannerUsername || ad.username}</p>
                </div>
                <Badge className={getPartyColor(ad.party)} variant="secondary">
                  {getPartyLabel(ad.party)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (ad.bannerType === 'text' && ad.bannerText) {
      return (
        <Card 
          className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleAdClick(ad.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-yellow-600" weight="fill" />
              <Badge className={getPartyColor(ad.party)}>
                {getPartyLabel(ad.party)}
              </Badge>
            </div>
            <p className="text-sm font-medium text-center italic text-foreground mb-1">"{ad.bannerText}"</p>
            <p className="text-xs text-muted-foreground text-center">- @{ad.bannerUsername || ad.username}</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card 
        className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => handleAdClick(ad.id)}
      >
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
  }

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