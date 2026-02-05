import { useEffect } from 'react'
import { useKV } from '@/hooks/use-kv'
import { User } from '@/App'

export function DataSeeder() {
  const [currentUser, setCurrentUser] = useKV<User | null>('currentUser', null)

  useEffect(() => {
    const seedData = async () => {
      // Only seed if we have a current user but they don't have proper stats
      if (currentUser && (currentUser.earnings === 0 || !currentUser.hasOwnProperty('followerCount'))) {
        const updatedUser: User = {
          ...currentUser,
          earnings: 2500,
          followerCount: currentUser.followerCount || Math.floor(Math.random() * 1000) + 100,
          impressions: currentUser.impressions || Math.floor(Math.random() * 10000) + 1000
        }
        setCurrentUser(updatedUser)
      }
    }

    seedData()
  }, [currentUser, setCurrentUser])

  return null // This component doesn't render anything
}