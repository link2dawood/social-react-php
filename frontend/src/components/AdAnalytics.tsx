import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { User } from '@/App'
import { AdPurchase } from './TopAdsDisplay'
import { Eye, Cursor, ChartLine, Calendar, MapPin, TrendUp } from '@phosphor-icons/react'
import { format } from 'date-fns'

interface AdAnalyticsProps {
  user: User
}

export function AdAnalytics({ user }: AdAnalyticsProps) {
  const [activeAds] = useKV<AdPurchase[]>('activeAds', [])
  const [userAds] = useKV<AdPurchase[]>(`userAds-${user.id}`, [])

  const myActiveAds = (activeAds || []).filter(ad => ad.userId === user.id)
  const myPastAds = (userAds || []).filter(ad => {
    const now = new Date().toISOString()
    return ad.endDate < now
  })

  const allMyAds = [...myActiveAds, ...myPastAds]

  const totalViews = allMyAds.reduce((sum, ad) => sum + (ad.views || 0), 0)
  const totalClicks = allMyAds.reduce((sum, ad) => sum + (ad.clicks || 0), 0)
  const totalSpent = allMyAds.reduce((sum, ad) => sum + ad.amount, 0)
  const clickThroughRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00'

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'left':
        return 'Left Banner'
      case 'center':
        return 'Center Banner'
      case 'right':
        return 'Right Banner'
      default:
        return position
    }
  }

  const getBannerTypeLabel = (type?: string) => {
    switch (type) {
      case 'photo':
        return 'Photo Banner'
      case 'video':
        return 'Video Banner'
      case 'text':
        return 'Text Banner'
      default:
        return 'Standard Banner'
    }
  }

  const getStatusBadge = (ad: AdPurchase) => {
    const now = new Date().toISOString()
    if (ad.startDate > now) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>
    } else if (ad.endDate < now) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Completed</Badge>
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
    }
  }

  if (allMyAds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine className="h-5 w-5" weight="duotone" />
            Ad Performance Analytics
          </CardTitle>
          <CardDescription>Track views, clicks, and engagement for your banner ads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ChartLine className="h-12 w-12 mx-auto text-muted-foreground mb-3" weight="duotone" />
            <p className="text-muted-foreground mb-2">No ad campaigns yet</p>
            <p className="text-sm text-muted-foreground">Purchase banner ads to start tracking performance</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine className="h-5 w-5" weight="duotone" />
            Ad Performance Analytics
          </CardTitle>
          <CardDescription>Track views, clicks, and engagement for your banner ads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <p className="text-xs font-medium">Total Views</p>
              </div>
              <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cursor className="h-4 w-4" />
                <p className="text-xs font-medium">Total Clicks</p>
              </div>
              <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendUp className="h-4 w-4" />
                <p className="text-xs font-medium">Click Rate</p>
              </div>
              <p className="text-2xl font-bold">{clickThroughRate}%</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ChartLine className="h-4 w-4" />
                <p className="text-xs font-medium">Total Spent</p>
              </div>
              <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Campaign Performance</h3>
            <div className="space-y-4">
              {allMyAds.map(ad => {
                const adViews = ad.views || 0
                const adClicks = ad.clicks || 0
                const adCTR = adViews > 0 ? ((adClicks / adViews) * 100).toFixed(2) : '0.00'
                const maxViews = Math.max(...allMyAds.map(a => a.views || 0), 1)
                const viewsProgress = (adViews / maxViews) * 100

                return (
                  <Card key={ad.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{getPositionLabel(ad.position)}</p>
                            {getStatusBadge(ad)}
                          </div>
                          <p className="text-xs text-muted-foreground">{getBannerTypeLabel(ad.bannerType)}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(ad.startDate), 'MMM d, yyyy')}
                            </div>
                            {ad.states.length > 0 && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {ad.states.includes('ALL') ? 'All States' : `${ad.states.length} states`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Views</span>
                            <span className="font-semibold">{adViews.toLocaleString()}</span>
                          </div>
                          <Progress value={viewsProgress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Clicks</p>
                            <p className="font-semibold">{adClicks.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">CTR</p>
                            <p className="font-semibold">{adCTR}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Spent</p>
                            <p className="font-semibold">${ad.amount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
