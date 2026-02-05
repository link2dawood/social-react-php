import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Sidebar } from '@/components/Sidebar'
import { MainFeed } from '@/components/MainFeed'
import { RightPanel } from '@/components/RightPanel'
import { AuthModal } from '@/components/AuthModal'
import { MessagesPanel } from '@/components/MessagesPanel'
import { MemeWall } from '@/components/MemeWall'
import { ProfilePanel } from '@/components/ProfilePanel'
import { HashtagFeed } from '@/components/HashtagFeed'
import { DataSeeder } from '@/components/DataSeeder'
import { SetupWizard } from '@/components/SetupWizard'
import { AdminPanel } from '@/components/AdminPanel'
import { Settings } from '@/components/Settings'
import { Support } from '@/components/Support'
import { NotificationsPanel } from '@/components/NotificationsPanel'
import { Footer } from '@/components/Footer'
import { CookieConsent } from '@/components/CookieConsent'
import { SearchPanel } from '@/components/SearchPanel'
import { PartiesFeed } from '@/components/PartiesFeed'
import { PoliticsStars } from '@/components/PoliticsStars'
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
    scheduledDate: string
    rate: number
  }[]
  suggestedFollowsRate?: number
  isPoliticsStarMember?: boolean
  politicsStarExpiresAt?: string
  autoFollow?: boolean
  inAutoFollowProgram?: boolean
  videoCount?: number
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
  reports?: { userId: string; reason: string; timestamp: string; proofVideo?: string }[]
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
  videoRoyaltiesEnabled?: boolean
  videoRoyaltyPercentage?: number
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
  const [siteSettings] = useKV<SiteSettings | undefined>('siteSettings', {
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
  const [currentView, setCurrentView] = useState<'feed' | 'memes' | 'messages' | 'profile' | 'hashtags' | 'admin' | 'settings' | 'support' | 'search' | 'parties' | 'politics-stars'>('feed')
  const [showAuthModal, setShowAuthModal] = useState(!currentUser)
  const [showSetupWizard, setShowSetupWizard] = useState(!(siteSettings?.isSetupComplete))
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)

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

  if (showSetupWizard) {
    return <SetupWizard isOpen={showSetupWizard} onComplete={() => setShowSetupWizard(false)} />
  }

  if (!currentUser) {
    return <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
  }

  const themeClass = `theme-${currentUser.party}`

  return (
    <div className={`min-h-screen bg-background ${themeClass} flex flex-col`}>
      <DataSeeder />

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
          {currentView === 'parties' && <PartiesFeed user={currentUser} />}
          {currentView === 'messages' && <MessagesPanel user={currentUser} />}
          {currentView === 'profile' && (
            <ProfilePanel 
              user={viewingUserId ? users?.find(u => u.id === viewingUserId) || currentUser : currentUser} 
              currentUser={currentUser}
              onUserUpdate={handleUserUpdate}
            />
          )}
          {currentView === 'politics-stars' && <PoliticsStars user={currentUser} onUserUpdate={handleUserUpdate} />}
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