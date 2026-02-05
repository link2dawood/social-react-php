import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, PoliticalParty, SiteSettings, Transaction } from '@/App'
import { Gear, User as UserIcon, Shield, Bell, CurrencyDollar, ArrowDown, ArrowUp, Users as UsersIcon, Plus } from '@phosphor-icons/react'
import { FavoriteUsersManager } from '@/components/FavoriteUsersManager'
import { PaymentCheckout } from '@/components/PaymentCheckout'
import { toast } from 'sonner'

interface SettingsProps {
  user: User
  onUserUpdate?: (user: User) => void
}

export function Settings({ user, onUserUpdate }: SettingsProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [siteSettings, setSiteSettings] = useKV<SiteSettings | undefined>('siteSettings', undefined)
  const [transactions, setTransactions] = useKV<Transaction[]>('transactions', [])
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio || '')
  const [usernameForSale, setUsernameForSale] = useState(user.usernameForSale || false)
  const [usernamePrice, setUsernamePrice] = useState(user.usernamePrice?.toString() || '')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  
  const [connectedPayments, setConnectedPayments] = useState({
    stripe: false,
    paypal: false,
    cashapp: false,
    zelle: false,
    bitcoin: false
  })

  const updateUser = async (updates: Partial<User>) => {
    const updatedUser = { ...user, ...updates }
    const updatedUsers = users?.map(u => u.id === user.id ? updatedUser : u) || []
    await setUsers(updatedUsers)
    onUserUpdate?.(updatedUser)
  }

  const handleSaveProfile = async () => {
    await updateUser({ displayName, bio })
    toast.success('Profile updated successfully')
  }

  const handlePartyChange = async (party: PoliticalParty) => {
    await updateUser({ party })
    toast.success(`Switched to ${party}`)
  }

  const handleUsernameForSale = async () => {
    const price = parseFloat(usernamePrice)
    if (usernameForSale && (!price || price <= 0)) {
      toast.error('Please enter a valid price')
      return
    }

    await updateUser({ 
      usernameForSale, 
      usernamePrice: usernameForSale ? price : undefined 
    })
    toast.success(usernameForSale ? 'Username listed for sale' : 'Username removed from sale')
  }

  const handleRedeemTokens = async () => {
    if (!user.tokens || user.tokens <= 0) {
      toast.error('You have no tokens to redeem')
      return
    }

    const earningsToAdd = user.tokens
    await updateUser({
      tokens: 0,
      earnings: user.earnings + earningsToAdd
    })
    toast.success(`Redeemed ${earningsToAdd} tokens for $${earningsToAdd}`)
  }

  const handleWithdrawEarnings = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > user.earnings) {
      toast.error('Insufficient earnings to withdraw')
      return
    }

    const connectedMethod = Object.entries(connectedPayments).find(([_, isConnected]) => isConnected)
    if (!connectedMethod) {
      toast.error('Please connect a payment method first')
      return
    }

    setIsProcessing(true)
    try {
      const transaction: Transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: user.id,
        username: user.username,
        type: 'withdrawal',
        amount: amount,
        paymentMethod: connectedMethod[0] as 'stripe' | 'paypal' | 'cashapp' | 'zelle' | 'bitcoin',
        status: 'completed',
        timestamp: new Date().toISOString(),
        description: `Withdrawal to ${connectedMethod[0]}`
      }

      const updatedSiteSettings = {
        ...siteSettings!,
        siteFunds: (siteSettings?.siteFunds || 0) - amount
      }

      await updateUser({
        earnings: user.earnings - amount
      })
      await setTransactions((prevTransactions) => [...(prevTransactions || []), transaction])
      await setSiteSettings(updatedSiteSettings)
      
      toast.success(`Successfully withdrew $${amount.toFixed(2)} to your payment method`)
      setWithdrawAmount('')
    } catch (error) {
      toast.error('Failed to process withdrawal')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gear size={24} />
            Settings
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="favorites">Favorite Users</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon size={20} />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={user.username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Username cannot be changed (but can be sold below)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full">
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Political Affiliation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Change your political party affiliation
              </p>
              <Select value={user.party} onValueChange={(value: PoliticalParty) => handlePartyChange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="democrat">Democrat</SelectItem>
                  <SelectItem value="republican">Republican</SelectItem>
                  <SelectItem value="independent">Independent</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sell Your Username</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                List your username for sale. Other users can purchase it from you.
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="usernameForSale">Username for sale</Label>
                <Switch
                  id="usernameForSale"
                  checked={usernameForSale}
                  onCheckedChange={setUsernameForSale}
                />
              </div>

              {usernameForSale && (
                <div className="space-y-2">
                  <Label htmlFor="usernamePrice">Price ($)</Label>
                  <Input
                    id="usernamePrice"
                    type="number"
                    value={usernamePrice}
                    onChange={(e) => setUsernamePrice(e.target.value)}
                    placeholder="Enter price"
                  />
                </div>
              )}

              <Button onClick={handleUsernameForSale} className="w-full">
                {usernameForSale ? 'List Username for Sale' : 'Remove from Sale'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollar size={20} />
                Earnings & Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-accent/10 rounded-lg">
                  <div className="text-3xl font-bold text-accent">
                    ${(user.earnings || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    ${(user.totalTips || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Received</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowDepositModal(true)}
                  className="flex-1 gap-2"
                  variant="default"
                >
                  <ArrowUp />
                  Deposit Funds
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Withdraw Earnings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Transfer your earnings to your connected payment method
                </p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="withdrawAmount">Withdrawal Amount ($)</Label>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      max={user.earnings}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: ${(user.earnings || 0).toFixed(2)}
                    </p>
                  </div>

                  <Button 
                    onClick={handleWithdrawEarnings}
                    disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="w-full gap-2"
                  >
                    <ArrowDown />
                    Withdraw to Payment Method
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Connected Payment Methods</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your payment accounts to deposit and withdraw funds
                </p>
                <div className="space-y-3">
                  {siteSettings?.paymentGateways.stripe && (
                    <Card>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${connectedPayments.stripe ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <div className="font-medium">Stripe (Card)</div>
                            <div className="text-xs text-muted-foreground">
                              {connectedPayments.stripe ? 'Connected' : 'Not connected'}
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={connectedPayments.stripe ? 'outline' : 'default'}
                          onClick={() => {
                            setConnectedPayments(prev => ({ ...prev, stripe: !prev.stripe }))
                            toast.success(connectedPayments.stripe ? 'Stripe disconnected' : 'Stripe connected')
                          }}
                        >
                          {connectedPayments.stripe ? 'Disconnect' : 'Connect'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {siteSettings?.paymentGateways.paypal && (
                    <Card>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${connectedPayments.paypal ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <div className="font-medium">PayPal</div>
                            <div className="text-xs text-muted-foreground">
                              {connectedPayments.paypal ? 'Connected' : 'Not connected'}
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={connectedPayments.paypal ? 'outline' : 'default'}
                          onClick={() => {
                            setConnectedPayments(prev => ({ ...prev, paypal: !prev.paypal }))
                            toast.success(connectedPayments.paypal ? 'PayPal disconnected' : 'PayPal connected')
                          }}
                        >
                          {connectedPayments.paypal ? 'Disconnect' : 'Connect'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {siteSettings?.paymentGateways.cashapp && (
                    <Card>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${connectedPayments.cashapp ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <div className="font-medium">Cash App</div>
                            <div className="text-xs text-muted-foreground">
                              {connectedPayments.cashapp ? 'Connected' : 'Not connected'}
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={connectedPayments.cashapp ? 'outline' : 'default'}
                          onClick={() => {
                            setConnectedPayments(prev => ({ ...prev, cashapp: !prev.cashapp }))
                            toast.success(connectedPayments.cashapp ? 'Cash App disconnected' : 'Cash App connected')
                          }}
                        >
                          {connectedPayments.cashapp ? 'Disconnect' : 'Connect'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {siteSettings?.paymentGateways.zelle && (
                    <Card>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${connectedPayments.zelle ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <div className="font-medium">Zelle</div>
                            <div className="text-xs text-muted-foreground">
                              {connectedPayments.zelle ? 'Connected' : 'Not connected'}
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={connectedPayments.zelle ? 'outline' : 'default'}
                          onClick={() => {
                            setConnectedPayments(prev => ({ ...prev, zelle: !prev.zelle }))
                            toast.success(connectedPayments.zelle ? 'Zelle disconnected' : 'Zelle connected')
                          }}
                        >
                          {connectedPayments.zelle ? 'Disconnect' : 'Connect'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {siteSettings?.paymentGateways.bitcoin && (
                    <Card>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${connectedPayments.bitcoin ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <div className="font-medium">Bitcoin</div>
                            <div className="text-xs text-muted-foreground">
                              {connectedPayments.bitcoin ? 'Connected' : 'Not connected'}
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={connectedPayments.bitcoin ? 'outline' : 'default'}
                          onClick={() => {
                            setConnectedPayments(prev => ({ ...prev, bitcoin: !prev.bitcoin }))
                            toast.success(connectedPayments.bitcoin ? 'Bitcoin disconnected' : 'Bitcoin connected')
                          }}
                        >
                          {connectedPayments.bitcoin ? 'Disconnect' : 'Connect'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {!siteSettings?.paymentGateways.stripe && 
                   !siteSettings?.paymentGateways.paypal && 
                   !siteSettings?.paymentGateways.cashapp &&
                   !siteSettings?.paymentGateways.zelle &&
                   !siteSettings?.paymentGateways.bitcoin && (
                    <p className="text-muted-foreground text-center py-4">No payment methods configured by administrator</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollar size={20} />
                Token Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  {user.tokens || 0} Tokens
                </div>
                <p className="text-sm text-muted-foreground">
                  1 token = $1 in platform currency
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="text-sm font-medium">Token Value</div>
                <div className="text-2xl font-bold">
                  ${(user.tokens || 0).toLocaleString()}
                </div>
              </div>

              <Button 
                onClick={handleRedeemTokens} 
                className="w-full"
                disabled={!user.tokens || user.tokens <= 0}
              >
                Redeem All Tokens
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Tokens are given by admins and can be redeemed for platform earnings
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <FavoriteUsersManager user={user} onUserUpdate={(updatedUser) => {
            updateUser(updatedUser)
            onUserUpdate?.(updatedUser)
          }} />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Private Profile</div>
                  <div className="text-sm text-muted-foreground">
                    Only approved followers can see your content
                  </div>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Show Earnings</div>
                  <div className="text-sm text-muted-foreground">
                    Display your earnings publicly
                  </div>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Receive email updates about your activity
                  </div>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PaymentCheckout 
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        user={user}
        onUserUpdate={(updatedUser) => {
          updateUser(updatedUser)
          onUserUpdate?.(updatedUser)
        }}
      />
    </div>
  )
}
