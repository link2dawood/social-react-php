import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { User, TrendingTopic } from '@/App'
import { AdPurchase } from './TopAdsDisplay'
import { VerificationManager } from './VerificationManager'
import { SuggestedFollowsManager } from './SuggestedFollowsManager'
import { AdAnalytics } from './AdAnalytics'
import { Calendar, MapPin, Crown, CreditCard, Users, Eye, TrendUp, Hash, Download, Image as ImageIcon, TextT, ChartLine, PencilSimple, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
]

interface AdsManagerProps {
  user: User
  onUserUpdate?: (user: User) => void
}

export function AdsManager({ user, onUserUpdate }: AdsManagerProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [activeAds, setActiveAds] = useKV<AdPurchase[]>('activeAds', [])
  const [userAds, setUserAds] = useKV<AdPurchase[]>(`userAds-${user.id}`, [])
  const [trendingTopics, setTrendingTopics] = useKV<TrendingTopic[]>('trendingTopics', [])
  const [position, setPosition] = useState<'left' | 'center' | 'right'>('left')
  const [selectedStates, setSelectedStates] = useState<string[]>(['ALL'])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [showCalendar, setShowCalendar] = useState(false)
  
  // Banner ad states
  const [bannerType, setBannerType] = useState<'photo' | 'text' | 'video'>('photo')
  const [bannerPhoto, setBannerPhoto] = useState('')
  const [bannerVideo, setBannerVideo] = useState('')
  const [bannerText, setBannerText] = useState('')
  const [bannerUsername, setBannerUsername] = useState('')
  
  // Trending topic states
  const [trendingHashtag, setTrendingHashtag] = useState('')
  const [trendingImage, setTrendingImage] = useState('')
  
  // Follower and impression purchase states
  const [followerPackage, setFollowerPackage] = useState<string>('1000')
  const [impressionPackage, setImpressionPackage] = useState<string>('10000')

  // Follower packages
  const followerPackages = [
    { count: 1000, price: 5, label: '1K Followers' },
    { count: 5000, price: 20, label: '5K Followers' },
    { count: 10000, price: 35, label: '10K Followers' },
    { count: 50000, price: 150, label: '50K Followers' },
    { count: 100000, price: 250, label: '100K Followers' },
    { count: 1000000, price: 500, label: '1M Followers - PREMIUM DEAL!' }
  ]

  // Impression packages
  const impressionPackages = [
    { count: 10000, price: 3, label: '10K Impressions' },
    { count: 50000, price: 12, label: '50K Impressions' },
    { count: 100000, price: 20, label: '100K Impressions' },
    { count: 500000, price: 85, label: '500K Impressions' },
    { count: 1000000, price: 150, label: '1M Impressions' }
  ]

  const updateUser = async (updatedUser: User) => {
    const updatedUsers = users?.map(u => 
      u.id === user.id ? updatedUser : u
    ) || []
    
    await setUsers(updatedUsers)
    onUserUpdate?.(updatedUser)
  }

  const purchaseFollowers = async () => {
    const selectedPkg = followerPackages.find(p => p.count.toString() === followerPackage)
    if (!selectedPkg) return

    if ((user.earnings || 0) < selectedPkg.price) {
      toast.error(`Insufficient funds! You need $${selectedPkg.price} but only have $${(user.earnings || 0).toFixed(2)}`)
      return
    }

    setIsProcessing(true)

    try {
      const updatedUser = {
        ...user,
        followerCount: (user.followerCount || 0) + selectedPkg.count,
        earnings: (user.earnings || 0) - selectedPkg.price
      }

      await updateUser(updatedUser)
      
      toast.success(`Successfully purchased ${selectedPkg.label}! Your follower count increased by ${selectedPkg.count.toLocaleString()}.`)
    } catch (error) {
      toast.error('Failed to purchase followers. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const purchaseImpressions = async () => {
    const selectedPkg = impressionPackages.find(p => p.count.toString() === impressionPackage)
    if (!selectedPkg) return

    if ((user.earnings || 0) < selectedPkg.price) {
      toast.error(`Insufficient funds! You need $${selectedPkg.price} but only have $${(user.earnings || 0).toFixed(2)}`)
      return
    }

    setIsProcessing(true)

    try {
      const updatedUser = {
        ...user,
        impressions: (user.impressions || 0) + selectedPkg.count,
        earnings: (user.earnings || 0) - selectedPkg.price
      }

      await updateUser(updatedUser)
      
      toast.success(`Successfully purchased ${selectedPkg.label}! Your impression count increased by ${selectedPkg.count.toLocaleString()}.`)
    } catch (error) {
      toast.error('Failed to purchase impressions. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStateChange = (state: string, checked: boolean) => {
    if (state === 'ALL') {
      setSelectedStates(checked ? ['ALL'] : [])
    } else {
      setSelectedStates(prev => {
        const filtered = prev.filter(s => s !== 'ALL')
        if (checked) {
          return [...filtered, state]
        } else {
          return filtered.filter(s => s !== state)
        }
      })
    }
  }

  const calculatePrice = () => {
    const basePrice = 500
    const stateCount = selectedStates.includes('ALL') ? 50 : selectedStates.length
    const stateMultiplier = selectedStates.includes('ALL') ? 2 : Math.max(1, stateCount / 10)
    return Math.round(basePrice * stateMultiplier)
  }

  const isPositionAvailable = (pos: 'left' | 'center' | 'right') => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return !(activeAds || []).some(ad => 
      ad.position === pos && 
      new Date(ad.endDate) > now
    )
  }

  const purchaseAd = async () => {
    if (!isPositionAvailable(position)) {
      toast.error('This position is currently occupied!')
      return
    }

    if (selectedStates.length === 0) {
      toast.error('Please select at least one state!')
      return
    }

    const price = calculatePrice()
    if ((user.earnings || 0) < price) {
      toast.error(`Insufficient funds! You need $${price} but only have $${(user.earnings || 0).toFixed(2)}`)
      return
    }

    setIsProcessing(true)

    try {
      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + 1)

      const newAd: AdPurchase = {
        id: `ad-${Date.now()}`,
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        party: user.party,
        avatar: user.avatar,
        position,
        states: selectedStates,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        amount: price,
        bannerType,
        bannerPhoto: bannerType === 'photo' ? bannerPhoto : undefined,
        bannerVideo: bannerType === 'video' ? bannerVideo : undefined,
        bannerText: bannerType === 'text' ? bannerText : undefined,
        bannerUsername: bannerUsername || user.username
      }

      setActiveAds(prev => [...(prev || []), newAd])
      setUserAds(prev => [...(prev || []), newAd])

      const updatedUser = { ...user, earnings: (user.earnings || 0) - price }
      await updateUser(updatedUser)

      toast.success(`Ad purchased successfully for $${price}! Your ad is now live for 24 hours.`)
      
      setPosition('left')
      setSelectedStates(['ALL'])
      setBannerPhoto('')
      setBannerVideo('')
      setBannerText('')
    } catch (error) {
      toast.error('Failed to purchase ad. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const purchaseTrendingTopic = async () => {
    if (!trendingHashtag.trim() || !trendingHashtag.startsWith('#')) {
      toast.error('Please enter a valid hashtag starting with #')
      return
    }

    const price = 250
    if ((user.earnings || 0) < price) {
      toast.error(`Insufficient funds! You need $${price}`)
      return
    }

    setIsProcessing(true)

    try {
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setHours(expiresAt.getHours() + 24)

      const newTrending: TrendingTopic = {
        id: `trending_${Date.now()}`,
        hashtag: trendingHashtag,
        userId: user.id,
        image: trendingImage,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString()
      }

      await setTrendingTopics([...(trendingTopics || []), newTrending])

      const updatedUser = { ...user, earnings: (user.earnings || 0) - price }
      await updateUser(updatedUser)

      toast.success(`Trending topic created! ${trendingHashtag} will appear for 24 hours.`)
      setTrendingHashtag('')
      setTrendingImage('')
    } catch (error) {
      toast.error('Failed to create trending topic')
    } finally {
      setIsProcessing(false)
    }
  }

  const deleteAd = async (adId: string) => {
    const ad = userAds?.find(a => a.id === adId)
    if (!ad) return

    const now = new Date()
    const startDate = new Date(ad.startDate)
    const isLive = startDate <= now

    if (isLive) {
      toast.error('Cannot delete a live ad. You can only delete ads that haven\'t started yet.')
      return
    }

    const refundAmount = Math.floor(ad.amount * 0.85)
    
    const updatedActiveAds = (activeAds || []).filter(a => a.id !== adId)
    const updatedUserAds = (userAds || []).filter(a => a.id !== adId)
    
    await setActiveAds(updatedActiveAds)
    await setUserAds(updatedUserAds)

    const updatedUser = { ...user, earnings: (user.earnings || 0) + refundAmount }
    await updateUser(updatedUser)

    toast.success(`Ad deleted! You received a refund of $${refundAmount} (85% of original price)`)
  }

  const [editingAd, setEditingAd] = useState<AdPurchase | null>(null)
  const [editBannerType, setEditBannerType] = useState<'photo' | 'text' | 'video'>('photo')
  const [editBannerPhoto, setEditBannerPhoto] = useState('')
  const [editBannerVideo, setEditBannerVideo] = useState('')
  const [editBannerText, setEditBannerText] = useState('')
  const [editBannerUsername, setEditBannerUsername] = useState('')

  const openEditDialog = (ad: AdPurchase) => {
    const now = new Date()
    const startDate = new Date(ad.startDate)
    
    if (startDate <= now) {
      toast.error('Cannot edit a live ad. You can only edit ads that haven\'t started yet.')
      return
    }

    setEditingAd(ad)
    setEditBannerType(ad.bannerType || 'photo')
    setEditBannerPhoto(ad.bannerPhoto || '')
    setEditBannerVideo(ad.bannerVideo || '')
    setEditBannerText(ad.bannerText || '')
    setEditBannerUsername(ad.bannerUsername || user.username)
  }

  const saveEditedAd = async () => {
    if (!editingAd) return

    setIsProcessing(true)

    try {
      const updatedAd: AdPurchase = {
        ...editingAd,
        bannerType: editBannerType,
        bannerPhoto: editBannerType === 'photo' ? editBannerPhoto : undefined,
        bannerVideo: editBannerType === 'video' ? editBannerVideo : undefined,
        bannerText: editBannerType === 'text' ? editBannerText : undefined,
        bannerUsername: editBannerUsername || user.username
      }

      const updatedActiveAds = (activeAds || []).map(ad => 
        ad.id === editingAd.id ? updatedAd : ad
      )
      const updatedUserAds = (userAds || []).map(ad => 
        ad.id === editingAd.id ? updatedAd : ad
      )

      await setActiveAds(updatedActiveAds)
      await setUserAds(updatedUserAds)

      toast.success('Ad updated successfully!')
      setEditingAd(null)
    } catch (error) {
      toast.error('Failed to update ad')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadCertificate = (ad: AdPurchase) => {
    const certificate = `
═══════════════════════════════════════════════
        LERUMOS POLITICAL PARTY
        CHART PLACEMENT CERTIFICATE
═══════════════════════════════════════════════

This certifies that

        @${ad.username}
        (${ad.displayName})

Successfully charted on Lerumos Political Party

Position: ${ad.position.toUpperCase()}
Date: ${new Date(ad.startDate).toLocaleDateString()}
Duration: 24 hours
States: ${ad.states.includes('ALL') ? 'Nationwide (All 50 States)' : ad.states.join(', ')}

ANALYTICS:
═══════════════════════════════════════════════
Amount Invested: $${ad.amount}
Est. Impressions: ${(ad.amount * 100).toLocaleString()}
Est. Reach: ${(ad.amount * 50).toLocaleString()} users
Engagement Rate: ${((Math.random() * 5) + 2).toFixed(2)}%

Certificate ID: ${ad.id}
Generated: ${new Date().toLocaleString()}

═══════════════════════════════════════════════
    `

    const blob = new Blob([certificate], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lerumos-certificate-${ad.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Certificate downloaded!')
  }

  const getNextAvailableDate = (pos: 'left' | 'center' | 'right') => {
    const occupied = (activeAds || [])
      .filter(ad => ad.position === pos)
      .map(ad => new Date(ad.startDate).toDateString())
    
    const dates: string[] = []
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toDateString()
      if (!occupied.includes(dateStr)) {
        dates.push(date.toISOString().split('T')[0])
      }
    }
    return dates
  }

  const userActiveAds = (userAds || []).filter(ad => new Date(ad.endDate) > new Date())
  const userExpiredAds = (userAds || []).filter(ad => new Date(ad.endDate) <= new Date())

  return (
    <div className="space-y-6">
      <Tabs defaultValue="top-ads" className="space-y-4">
        <div className="relative">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full">
              <TabsTrigger value="top-ads" className="whitespace-nowrap">Top User Ads</TabsTrigger>
              <TabsTrigger value="analytics" className="whitespace-nowrap">
                <ChartLine className="h-4 w-4 mr-1" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="trending" className="whitespace-nowrap">Trending</TabsTrigger>
              <TabsTrigger value="followers" className="whitespace-nowrap">Followers</TabsTrigger>
              <TabsTrigger value="impressions" className="whitespace-nowrap">Impressions</TabsTrigger>
              <TabsTrigger value="suggested" className="whitespace-nowrap">Suggested</TabsTrigger>
              <TabsTrigger value="verification" className="whitespace-nowrap">Verification</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="top-ads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                Purchase Top User Ad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Ad Policy:</strong> You can edit or cancel scheduled ads before they go live and receive an 85% refund. Once an ad is live, it cannot be modified or refunded.
                </p>
              </div>

              <div>
                <Label htmlFor="position">Ad Position</Label>
                <Select value={position} onValueChange={(value: 'left' | 'center' | 'right') => setPosition(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left" disabled={!isPositionAvailable('left')}>
                      Left Position {!isPositionAvailable('left') && '(Occupied)'}
                    </SelectItem>
                    <SelectItem value="center" disabled={!isPositionAvailable('center')}>
                      Center Position {!isPositionAvailable('center') && '(Occupied)'}
                    </SelectItem>
                    <SelectItem value="right" disabled={!isPositionAvailable('right')}>
                      Right Position {!isPositionAvailable('right') && '(Occupied)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Banner Type</Label>
                <Select value={bannerType} onValueChange={(value: 'photo' | 'text' | 'video') => setBannerType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo Banner</SelectItem>
                    <SelectItem value="video">Video Banner (Muted)</SelectItem>
                    <SelectItem value="text">Text Banner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bannerType === 'photo' ? (
                <div className="space-y-2">
                  <Label htmlFor="bannerPhoto">Banner Photo URL</Label>
                  <Input
                    id="bannerPhoto"
                    value={bannerPhoto}
                    onChange={(e) => setBannerPhoto(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                  {bannerPhoto && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <img src={bannerPhoto} alt="Banner preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ) : bannerType === 'video' ? (
                <div className="space-y-2">
                  <Label htmlFor="bannerVideo">Banner Video URL</Label>
                  <Input
                    id="bannerVideo"
                    value={bannerVideo}
                    onChange={(e) => setBannerVideo(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                  />
                  {bannerVideo && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <video src={bannerVideo} className="w-full h-full object-cover" muted loop autoPlay />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Video will play on mute and loop automatically
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="bannerUsername">Username to Display</Label>
                    <Input
                      id="bannerUsername"
                      value={bannerUsername}
                      onChange={(e) => setBannerUsername(e.target.value)}
                      placeholder={`@${user.username}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bannerText">Banner Text</Label>
                    <Input
                      id="bannerText"
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder='Example: "Vote for change" or "Follow for updates"'
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bannerUsername">Username to Display</Label>
                    <Input
                      id="bannerUsername"
                      value={bannerUsername}
                      onChange={(e) => setBannerUsername(e.target.value)}
                      placeholder={`@${user.username}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format examples: "quote - @username" or "follow @username because ________"
                    </p>
                  </div>
                </div>
              )}

              <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Calendar />
                    View Available Dates
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Available Dates for {position} Position</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getNextAvailableDate(position).map(date => (
                      <div key={date} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedDate(date)
                          setShowCalendar(false)
                          toast.success(`Selected date: ${new Date(date).toLocaleDateString()}`)
                        }}
                      >
                        <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Available</Badge>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <div>
                <Label>Target States</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-states"
                      checked={selectedStates.includes('ALL')}
                      onCheckedChange={(checked) => handleStateChange('ALL', checked as boolean)}
                    />
                    <Label htmlFor="all-states" className="font-semibold text-primary">
                      All States (Nationwide) - 2x Price
                    </Label>
                  </div>
                  
                  {!selectedStates.includes('ALL') && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                      {US_STATES.map(state => (
                        <div key={state} className="flex items-center space-x-2">
                          <Checkbox
                            id={state}
                            checked={selectedStates.includes(state)}
                            onCheckedChange={(checked) => handleStateChange(state, checked as boolean)}
                          />
                          <Label htmlFor={state} className="text-sm">{state}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Duration: 24 hours</p>
                  <p className="text-sm text-muted-foreground">
                    States: {selectedStates.includes('ALL') ? 'All 50 States' : `${selectedStates.length} selected`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">${calculatePrice()}</p>
                  <p className="text-sm text-muted-foreground">Your balance: ${(user.earnings || 0).toFixed(2)}</p>
                </div>
              </div>

              <Button 
                onClick={purchaseAd}
                disabled={isProcessing || !isPositionAvailable(position) || selectedStates.length === 0 || (user.earnings || 0) < calculatePrice()}
                className="w-full"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : `Purchase Ad - $${calculatePrice()}`}
              </Button>
            </CardContent>
          </Card>

          {/* User's Active Ads with Certificate Download */}
          {userActiveAds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Your Active & Scheduled Ads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userActiveAds.map(ad => {
                    const now = new Date()
                    const startDate = new Date(ad.startDate)
                    const isLive = startDate <= now
                    const isScheduled = startDate > now

                    return (
                      <div key={ad.id} className={`flex items-center justify-between p-3 border rounded-lg ${isLive ? 'bg-green-50' : 'bg-blue-50'}`}>
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-1">{ad.position.toUpperCase()} POSITION</Badge>
                          <p className="text-sm font-medium">
                            States: {ad.states.includes('ALL') ? 'Nationwide' : ad.states.join(', ')}
                          </p>
                          {isScheduled ? (
                            <p className="text-xs text-muted-foreground">
                              Starts: {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString()}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Expires: {new Date(ad.endDate).toLocaleDateString()} at {new Date(ad.endDate).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <p className="font-semibold text-green-600">${ad.amount}</p>
                          <Badge className={isLive ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {isLive ? 'LIVE' : 'SCHEDULED'}
                          </Badge>
                          <div className="flex gap-1">
                            {isScheduled && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => openEditDialog(ad)} 
                                  className="gap-1"
                                >
                                  <PencilSimple size={14} />
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    if (confirm(`Delete this ad and receive an 85% refund ($${Math.floor(ad.amount * 0.85)})?`)) {
                                      deleteAd(ad.id)
                                    }
                                  }}
                                  className="gap-1 text-red-600 hover:text-red-700"
                                >
                                  <Trash size={14} />
                                  Delete
                                </Button>
                              </>
                            )}
                            {isLive && (
                              <Button size="sm" variant="outline" onClick={() => downloadCertificate(ad)} className="gap-1">
                                <Download size={14} />
                                Certificate
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User's Ad History */}
          {userExpiredAds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ad History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userExpiredAds.slice(-5).map(ad => (
                    <div key={ad.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm">
                          {ad.position.toUpperCase()} - {ad.states.includes('ALL') ? 'Nationwide' : `${ad.states.length} states`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ad.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm font-medium">${ad.amount}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AdAnalytics user={user} />
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-orange-600" />
                Purchase Trending Topic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 mb-2">
                  <strong>Make your hashtag trend for 24 hours!</strong>
                </p>
                <p className="text-xs text-orange-700">
                  Your hashtag will appear in the trending topics section with your custom image and profile.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trendingHashtag">Hashtag</Label>
                <Input
                  id="trendingHashtag"
                  value={trendingHashtag}
                  onChange={(e) => setTrendingHashtag(e.target.value)}
                  placeholder="#YourTrendingTopic"
                />
                <p className="text-xs text-muted-foreground">
                  Must start with # and be unique
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trendingImage">Banner Image URL (Optional)</Label>
                <Input
                  id="trendingImage"
                  value={trendingImage}
                  onChange={(e) => setTrendingImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {trendingImage && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                    <img src={trendingImage} alt="Trending preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Duration: 24 hours</p>
                  <p className="text-sm text-muted-foreground">
                    Your username and photo will be displayed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">$250</p>
                  <p className="text-sm text-muted-foreground">Your balance: ${(user.earnings || 0).toFixed(2)}</p>
                </div>
              </div>

              <Button 
                onClick={purchaseTrendingTopic}
                disabled={isProcessing || !trendingHashtag.trim() || (user.earnings || 0) < 250}
                className="w-full"
                size="lg"
              >
                <Hash className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Purchase Trending Topic - $250'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Trending Topics</CardTitle>
            </CardHeader>
            <CardContent>
              {(trendingTopics || []).filter(t => new Date(t.expiresAt) > new Date()).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active trending topics
                </p>
              ) : (
                <div className="space-y-3">
                  {(trendingTopics || [])
                    .filter(t => new Date(t.expiresAt) > new Date())
                    .map(topic => {
                      const topicUser = users?.find(u => u.id === topic.userId)
                      return (
                        <div key={topic.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-orange-600">{topic.hashtag}</h3>
                            <Badge variant="outline">Trending</Badge>
                          </div>
                          {topic.image && (
                            <img src={topic.image} alt={topic.hashtag} className="w-full h-24 object-cover rounded-lg" />
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Created by</span>
                            <span className="font-medium">@{topicUser?.username || 'Unknown'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(topic.expiresAt).toLocaleString()}
                          </p>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Buy Followers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>More followers = More engagement!</strong>
                </p>
                <p className="text-xs text-blue-700">
                  Users with more followers receive significantly more likes, comments, and visibility on their posts.
                </p>
              </div>

              <div>
                <Label htmlFor="follower-package">Select Package</Label>
                <Select value={followerPackage} onValueChange={setFollowerPackage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {followerPackages.map(pkg => (
                      <SelectItem key={pkg.count} value={pkg.count.toString()}>
                        {pkg.label} - ${pkg.price}
                        {pkg.count === 1000000 && ' 🔥'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Followers</p>
                  <p className="text-xl font-bold">{(user.followerCount || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">After Purchase</p>
                  <p className="text-xl font-bold text-green-600">
                    {((user.followerCount || 0) + parseInt(followerPackage)).toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Package: {followerPackages.find(p => p.count.toString() === followerPackage)?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your balance: ${(user.earnings || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ${followerPackages.find(p => p.count.toString() === followerPackage)?.price}
                  </p>
                </div>
              </div>

              <Button
                onClick={purchaseFollowers}
                disabled={isProcessing || (user.earnings || 0) < (followerPackages.find(p => p.count.toString() === followerPackage)?.price || 0)}
                className="w-full"
                size="lg"
              >
                <Users className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : `Purchase ${followerPackages.find(p => p.count.toString() === followerPackage)?.label}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impressions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                Buy Impressions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800 mb-2">
                  <strong>Boost your reach and visibility!</strong>
                </p>
                <p className="text-xs text-purple-700">
                  Higher impression counts make your posts appear higher in feeds and searches.
                </p>
              </div>

              <div>
                <Label htmlFor="impression-package">Select Package</Label>
                <Select value={impressionPackage} onValueChange={setImpressionPackage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {impressionPackages.map(pkg => (
                      <SelectItem key={pkg.count} value={pkg.count.toString()}>
                        {pkg.label} - ${pkg.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Impressions</p>
                  <p className="text-xl font-bold">{(user.impressions || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">After Purchase</p>
                  <p className="text-xl font-bold text-purple-600">
                    {((user.impressions || 0) + parseInt(impressionPackage)).toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Package: {impressionPackages.find(p => p.count.toString() === impressionPackage)?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your balance: ${(user.earnings || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ${impressionPackages.find(p => p.count.toString() === impressionPackage)?.price}
                  </p>
                </div>
              </div>

              <Button
                onClick={purchaseImpressions}
                disabled={isProcessing || (user.earnings || 0) < (impressionPackages.find(p => p.count.toString() === impressionPackage)?.price || 0)}
                className="w-full"
                size="lg"
              >
                <TrendUp className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : `Purchase ${impressionPackages.find(p => p.count.toString() === impressionPackage)?.label}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggested">
          <SuggestedFollowsManager user={user} onUserUpdate={onUserUpdate || (() => {})} />
        </TabsContent>

        <TabsContent value="verification">
          <VerificationManager user={user} onUserUpdate={onUserUpdate || (() => {})} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingAd} onOpenChange={(open) => !open && setEditingAd(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Ad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Editing Ad:</strong> {editingAd?.position.toUpperCase()} Position
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Scheduled for: {editingAd && new Date(editingAd.startDate).toLocaleString()}
              </p>
            </div>

            <div>
              <Label>Banner Type</Label>
              <Select value={editBannerType} onValueChange={(value: 'photo' | 'text' | 'video') => setEditBannerType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Photo Banner</SelectItem>
                  <SelectItem value="video">Video Banner (Muted)</SelectItem>
                  <SelectItem value="text">Text Banner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editBannerType === 'photo' ? (
              <div className="space-y-2">
                <Label htmlFor="editBannerPhoto">Banner Photo URL</Label>
                <Input
                  id="editBannerPhoto"
                  value={editBannerPhoto}
                  onChange={(e) => setEditBannerPhoto(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                />
                {editBannerPhoto && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                    <img src={editBannerPhoto} alt="Banner preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ) : editBannerType === 'video' ? (
              <div className="space-y-2">
                <Label htmlFor="editBannerVideo">Banner Video URL</Label>
                <Input
                  id="editBannerVideo"
                  value={editBannerVideo}
                  onChange={(e) => setEditBannerVideo(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                />
                {editBannerVideo && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                    <video src={editBannerVideo} className="w-full h-full object-cover" muted loop autoPlay />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Video will play on mute and loop automatically
                </p>
                <div className="space-y-2">
                  <Label htmlFor="editBannerUsername">Username to Display</Label>
                  <Input
                    id="editBannerUsername"
                    value={editBannerUsername}
                    onChange={(e) => setEditBannerUsername(e.target.value)}
                    placeholder={`@${user.username}`}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editBannerText">Banner Text</Label>
                  <Input
                    id="editBannerText"
                    value={editBannerText}
                    onChange={(e) => setEditBannerText(e.target.value)}
                    placeholder='Example: "Vote for change" or "Follow for updates"'
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editBannerUsername">Username to Display</Label>
                  <Input
                    id="editBannerUsername"
                    value={editBannerUsername}
                    onChange={(e) => setEditBannerUsername(e.target.value)}
                    placeholder={`@${user.username}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format examples: "quote - @username" or "follow @username because ________"
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingAd(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedAd} disabled={isProcessing}>
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}