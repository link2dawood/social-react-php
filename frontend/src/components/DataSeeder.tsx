import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, PoliticalParty } from '@/App'
import { AdPurchase } from './TopAdsDisplay'

export function DataSeeder() {
  const [currentUser, setCurrentUser] = useKV<User | null>('currentUser', null)
  const [activeAds, setActiveAds] = useKV<AdPurchase[]>('activeAds', [])

  useEffect(() => {
    const seedData = async () => {
      // Only seed if we have a current user but they don't have proper stats
      if (currentUser && (currentUser.earnings === 0 || !currentUser.hasOwnProperty('followerCount'))) {
        // Give the current user some starting stats to test with
        const updatedUser: User = {
          ...currentUser,
          earnings: 2500, // Give them $2500 to test with
          followerCount: currentUser.followerCount || Math.floor(Math.random() * 1000) + 100, // Random followers 100-1100
          impressions: currentUser.impressions || Math.floor(Math.random() * 10000) + 1000 // Random impressions
        }
        setCurrentUser(updatedUser)
      }

      // Add some sample active ads if none exist
      if (!activeAds || activeAds.length === 0) {
        const now = new Date()
        const endDate = new Date(now)
        endDate.setDate(endDate.getDate() + 1)

        const sampleAds: AdPurchase[] = [
          {
            id: 'sample-ad-1',
            userId: 'sample-user-1',
            username: 'politicalleader1',
            displayName: 'Sarah Johnson',
            party: 'democrat',
            position: 'left',
            states: ['California', 'New York', 'Illinois'],
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            amount: 750
          }
        ]

        setActiveAds(sampleAds)
      }
    }

    seedData()
  }, [currentUser, activeAds, setCurrentUser, setActiveAds])

  return null // This component doesn't render anything
}