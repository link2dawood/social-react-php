import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import api from '@/lib/api'
import { Sidebar } from '@/components/Sidebar'
import { MainFeed } from '@/components/MainFeed'
import { RightPanel } from '@/components/RightPanel'
import { AuthModal } from '@/components/AuthModal'
import { MessagesPanel } from '@/components/MessagesPanel'
import { MemeWall } from '@/components/MemeWall'
import { ProfilePanel } from '@/components/ProfilePanel'
import { AdsManager } from '@/components/AdsManager'
import { HashtagFeed } from '@/components/HashtagFeed'
import { TopAdsDisplay } from '@/components/TopAdsDisplay'
import { DataSeeder } from '@/components/DataSeeder'
import { SetupWizard } from '@/components/SetupWizard'
import { AdminPanel } from '@/components/AdminPanel'
import { Settings } from '@/components/Settings'
import { Support } from '@/components/Support'
import { NotificationsPanel } from '@/components/NotificationsPanel'
import { Footer } from '@/components/Footer'
import { CookieConsent } from '@/components/CookieConsent'
import { SearchPanel } from '@/components/SearchPanel'
import { Toaster } from '@/components/ui/sonner'

export type PoliticalParty = 'democrat' | 'republican' | 'independent'

export interface User {
  id: string
  username: string
  displayName: string
  party: PoliticalParty
  avatar?: string
  banner?: string
  bio?: string
  followers: string[]
  following: string[]
  friends: string[]
  earnings: number
  totalTips: number
  joinDate: string
  isVerified?: boolean
  followerCount: number
  impressions: number
  tokens: number
  usernameForSale?: boolean
  usernamePrice?: number
  isAdmin?: boolean
  permissions?: string[]
  profileAdSlots?: { slotIndex: number; postId: string; expiresAt: string; userId: string; rate: number }[]
  favoriteUsersSlots?: {
    slotIndex: number
    userId: string
    expiresAt: string
    rate: number
  }[]
  favoriteUsersRate?: number
  slotRates?: { [slotIndex: number]: number }
  suggestedFollowsSlots?: {
    slotIndex: number
    userId: string
    expiresAt: string
    rate: number
  }[]
  suggestedFollowsRate?: number
}

export interface Post {
  id: string
  userId: string
  content: string
  image?: string
  video?: string
  type: 'post' | 'meme'
  party: PoliticalParty
  timestamp: string
  likes: { userId: string; party: PoliticalParty }[]
  comments: { id: string; userId: string; content: string; timestamp: string }[]
  tips: { userId: string; amount: number; timestamp: string }[]
  shares: number
  reports?: { userId: string; reason: string; timestamp: string }[]
}

export interface TrendingTopic {
  id: string
  hashtag: string
  userId: string
  image?: string
  expiresAt: string
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  username: string
  type: 'deposit' | 'withdrawal'
  amount: number
  paymentMethod: 'stripe' | 'paypal' | 'cashapp' | 'zelle' | 'bitcoin'
  status: 'completed' | 'pending' | 'failed'
  timestamp: string
  description?: string
}

export interface SiteSettings {
  ageRestriction: number
  termsAndConditions: string
  privacyPolicy: string
  paymentGateways: {
    stripe: boolean
    applePay: boolean
    paypal: boolean
    cashapp: boolean
    zelle: boolean
    bitcoin: boolean
  }
  paymentCredentials?: {
    stripe?: { clientId: string; secretKey: string }
    paypal?: { clientId: string; secretKey: string }
    cashapp?: { apiKey: string }
    zelle?: { email: string }
    bitcoin?: { walletAddress: string }
  }
  adminInfo: {
    name: string
    email: string
  }
  siteFunds: number
  isSetupComplete: boolean
  footerPages?: {
    name: string
    url: string
    category: 'platform' | 'legal' | 'connect'
    content?: string
  }[]
}

function App() {
  const [currentUser, setCurrentUser] = useKV<User | null>('currentUser', null)
  const [users, setUsers] = useKV<User[]>('users', [])
  const [siteSettings, setSiteSettings] = useKV<SiteSettings | undefined>('siteSettings', {
    ageRestriction: 18,
    termsAndConditions: '',
    privacyPolicy: '',
    paymentGateways: {
      stripe: false,
      applePay: false,
      paypal: false,
      cashapp: false,
      zelle: false,
      bitcoin: false
    },
    paymentCredentials: {},
    adminInfo: { name: '', email: '' },
    siteFunds: 0,
    isSetupComplete: false
  })
  const [currentView, setCurrentView] = useState<'feed' | 'memes' | 'messages' | 'profile' | 'ads' | 'hashtags' | 'admin' | 'settings' | 'support' | 'search'>('feed')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  
  // Check if setup is complete on mount - only show wizard if explicitly not complete
  useEffect(() => {
    // Only show wizard if:
    // 1. No current user (not logged in)
    // 2. siteSettings exists
    // 3. isSetupComplete is explicitly false
    // Don't show wizard if user is logged in OR if setup is already complete
    if (!currentUser && siteSettings && siteSettings.isSetupComplete === false) {
      setShowSetupWizard(true)
    } else {
      setShowSetupWizard(false)
    }
  }, [siteSettings, currentUser])
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load current user from API on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.getCurrentUser()
        if (userData) {
          const user: User = {
            id: String(userData.id),
            username: userData.username || '',
            displayName: userData.displayName || userData.name || '',
            party: (userData.party || 'independent') as PoliticalParty,
            bio: userData.bio,
            avatar: userData.avatar,
            followers: userData.followers || [],
            following: userData.following || [],
            friends: userData.friends || [],
            earnings: userData.earnings || 0,
            totalTips: userData.totalTips || 0,
            joinDate: userData.joinDate || new Date().toISOString(),
            followerCount: userData.followerCount || 0,
            impressions: userData.impressions || 0,
            tokens: userData.tokens || 0,
            isVerified: userData.isVerified || false
          }
          setCurrentUser(user)
          // Ensure we're on the feed view when user loads
          setCurrentView('feed')
        }
      } catch (error) {
        // User not authenticated
        setShowAuthModal(true)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  // When currentUser changes (e.g., after login), ensure we're on feed view
  useEffect(() => {
    if (currentUser) {
      // Always set to feed view when user logs in
      setCurrentView('feed')
      // Close auth modal if it was open
      setShowAuthModal(false)
    } else {
      // If no user, ensure auth modal is shown
      setShowAuthModal(true)
    }
  }, [currentUser])

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser)
    const updatedUsers = users?.map(u => 
      u.id === updatedUser.id ? updatedUser : u
    ) || []
    setUsers(updatedUsers)
  }

  const handleHashtagClick = (hashtag: string) => {
    setCurrentView('hashtags')
  }

  const handleViewProfile = (userId: string) => {
    setViewingUserId(userId)
    setCurrentView('profile')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (showSetupWizard) {
    return <SetupWizard isOpen={showSetupWizard} onComplete={() => {
      setShowSetupWizard(false)
      // Ensure siteSettings is updated
      if (siteSettings) {
        setSiteSettings({ ...siteSettings, isSetupComplete: true })
      }
    }} />
  }

  if (!currentUser) {
    return (
      <AuthModal 
        isOpen={true} 
        onClose={() => {
          // Modal will close when currentUser is set
          // The useEffect will handle redirecting to feed
        }} 
      />
    )
  }

  const themeClass = `theme-${currentUser.party}`

  return (
    <div className={`min-h-screen bg-background ${themeClass} flex flex-col`}>
      <DataSeeder />
      <TopAdsDisplay />
      
      <div className="fixed top-4 right-4 z-50">
        <NotificationsPanel user={currentUser} />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 flex-1">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <Sidebar 
            user={currentUser} 
            currentView={currentView}
            onViewChange={(view) => setCurrentView(view)}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-6">
          {currentView === 'feed' && <MainFeed user={currentUser} onHashtagClick={handleHashtagClick} />}
          {currentView === 'search' && <SearchPanel user={currentUser} />}
          {currentView === 'hashtags' && <HashtagFeed user={currentUser} />}
          {currentView === 'memes' && <MemeWall user={currentUser} />}
          {currentView === 'messages' && <MessagesPanel user={currentUser} />}
          {currentView === 'profile' && (
            <ProfilePanel 
              user={viewingUserId ? users?.find(u => u.id === viewingUserId) || currentUser : currentUser} 
              currentUser={currentUser}
              onUserUpdate={handleUserUpdate}
            />
          )}
          {currentView === 'ads' && <AdsManager user={currentUser} onUserUpdate={handleUserUpdate} />}
          {currentView === 'admin' && <AdminPanel user={currentUser} />}
          {currentView === 'settings' && <Settings user={currentUser} onUserUpdate={handleUserUpdate} />}
          {currentView === 'support' && <Support user={currentUser} />}
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3">
          <RightPanel user={currentUser} />
        </div>
      </div>

      <Footer />
      <CookieConsent />
      <Toaster />
    </div>
  )
}

export default App