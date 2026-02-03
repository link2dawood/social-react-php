import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { User, PoliticalParty, SiteSettings, Transaction } from '@/App'
import { 
  CurrencyDollar, 
  UserPlus, 
  ShieldCheck, 
  Gear,
  FileText,
  Coins,
  ArrowDown,
  ArrowUp,
  Link as LinkIcon,
  Trash,
  Receipt
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AdminPanelProps {
  user: User
}

export function AdminPanel({ user }: AdminPanelProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [siteSettings, setSiteSettings] = useKV<SiteSettings | undefined>('siteSettings', undefined)
  const [transactions, setTransactions] = useKV<Transaction[]>('transactions', [])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [tokenUsername, setTokenUsername] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    displayName: '',
    party: 'independent' as PoliticalParty,
    isAdmin: false
  })
  const [selectedUserId, setSelectedUserId] = useState('')
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [apiCallForm, setApiCallForm] = useState({
    endpoint: '',
    method: 'GET',
    description: ''
  })
  const [footerPageForm, setFooterPageForm] = useState({
    name: '',
    url: '',
    content: ''
  })
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all')
  const [searchUsername, setSearchUsername] = useState('')

  const availablePermissions = [
    'manage_users',
    'manage_posts',
    'manage_payments',
    'manage_ads',
    'manage_content',
    'view_analytics'
  ]

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!siteSettings || amount > siteSettings.siteFunds) {
      toast.error('Insufficient site funds')
      return
    }

    setIsProcessing(true)
    try {
      await setSiteSettings({
        ...siteSettings,
        siteFunds: siteSettings.siteFunds - amount
      })
      toast.success(`Successfully withdrew $${amount.toLocaleString()}`)
      setWithdrawAmount('')
    } catch (error) {
      toast.error('Failed to process withdrawal')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGiveTokens = async () => {
    const amount = parseFloat(tokenAmount)
    if (!tokenUsername || !amount || amount <= 0) {
      toast.error('Please fill in all fields')
      return
    }

    const targetUser = users?.find(u => u.username.toLowerCase() === tokenUsername.toLowerCase())
    if (!targetUser) {
      toast.error('User not found')
      return
    }

    setIsProcessing(true)
    try {
      const updatedUsers = users?.map(u => 
        u.id === targetUser.id 
          ? { ...u, tokens: (u.tokens || 0) + amount }
          : u
      )
      await setUsers(updatedUsers || [])
      toast.success(`Gave ${amount} tokens to @${targetUser.username}`)
      setTokenUsername('')
      setTokenAmount('')
    } catch (error) {
      toast.error('Failed to give tokens')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserForm.username || !newUserForm.displayName) {
      toast.error('Please fill in all required fields')
      return
    }

    if (users?.some(u => u.username.toLowerCase() === newUserForm.username.toLowerCase())) {
      toast.error('Username already exists')
      return
    }

    setIsProcessing(true)
    try {
      const newUser: User = {
        id: `user_${Date.now()}`,
        username: newUserForm.username,
        displayName: newUserForm.displayName,
        party: newUserForm.party,
        followers: [],
        following: [],
        friends: [],
        earnings: 0,
        totalTips: 0,
        joinDate: new Date().toISOString(),
        followerCount: 0,
        impressions: 0,
        tokens: 0,
        isAdmin: newUserForm.isAdmin
      }

      await setUsers([...(users || []), newUser])
      toast.success(`Created user @${newUser.username}`)
      setNewUserForm({
        username: '',
        displayName: '',
        party: 'independent',
        isAdmin: false
      })
    } catch (error) {
      toast.error('Failed to create user')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdatePermissions = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    setIsProcessing(true)
    try {
      const updatedUsers = users?.map(u => 
        u.id === selectedUserId 
          ? { ...u, permissions: userPermissions }
          : u
      )
      await setUsers(updatedUsers || [])
      toast.success('User permissions updated')
    } catch (error) {
      toast.error('Failed to update permissions')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveSettings = async (field: 'termsAndConditions' | 'privacyPolicy', value: string) => {
    if (!siteSettings) return

    try {
      await setSiteSettings({
        ...siteSettings,
        [field]: value
      })
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }

  const handleAddFooterPage = async () => {
    if (!footerPageForm.name) {
      toast.error('Please enter a page name')
      return
    }

    if (!siteSettings) return

    const pageUrl = footerPageForm.url || `#page-${Date.now()}`

    const updatedPages = [
      ...(siteSettings.footerPages || []),
      { 
        name: footerPageForm.name, 
        url: pageUrl,
        content: footerPageForm.content,
        category: 'platform' as 'platform' | 'legal' | 'connect'
      }
    ]

    try {
      await setSiteSettings({
        ...siteSettings,
        footerPages: updatedPages
      })
      toast.success('Footer page added')
      setFooterPageForm({
        name: '',
        url: '',
        content: ''
      })
    } catch (error) {
      toast.error('Failed to add footer page')
    }
  }

  const handleDeleteFooterPage = async (index: number) => {
    if (!siteSettings) return

    const updatedPages = siteSettings.footerPages?.filter((_, i) => i !== index) || []

    try {
      await setSiteSettings({
        ...siteSettings,
        footerPages: updatedPages
      })
      toast.success('Footer page removed')
    } catch (error) {
      toast.error('Failed to remove footer page')
    }
  }

  const filteredTransactions = (transactions || [])
    .filter(txn => {
      if (filterType !== 'all' && txn.type !== filterType) return false
      if (searchUsername && !txn.username.toLowerCase().includes(searchUsername.toLowerCase())) return false
      return true
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const totalDeposits = (transactions || [])
    .filter(txn => txn.type === 'deposit' && txn.status === 'completed')
    .reduce((sum, txn) => sum + txn.amount, 0)

  const totalWithdrawals = (transactions || [])
    .filter(txn => txn.type === 'withdrawal' && txn.status === 'completed')
    .reduce((sum, txn) => sum + txn.amount, 0)

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (!user.isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ShieldCheck size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You need admin privileges to access this panel.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={24} />
            Admin Control Panel
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="funds" className="space-y-4">
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="funds">Funds</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollar size={20} />
                Site Funds Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">
                  ${(siteSettings?.siteFunds || 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total available funds</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawAmount">Withdrawal Amount</Label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                />
              </div>

              <Button 
                onClick={handleWithdraw}
                disabled={isProcessing}
                className="w-full gap-2"
              >
                <ArrowDown />
                Withdraw Funds
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ArrowUp size={20} className="text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    ${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(transactions || []).filter(t => t.type === 'deposit').length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ArrowDown size={20} className="text-red-600" />
                  <div className="text-2xl font-bold text-red-600">
                    ${totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(transactions || []).filter(t => t.type === 'withdrawal').length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CurrencyDollar size={20} className="text-primary" />
                  <div className="text-2xl font-bold text-primary">
                    ${(totalDeposits - totalWithdrawals).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current balance in system
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt size={20} />
                All Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search by username..."
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={(value: 'all' | 'deposit' | 'withdrawal') => setFilterType(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits Only</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                  <p className="text-muted-foreground">
                    {searchUsername || filterType !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'Transactions will appear here once users make deposits or withdrawals'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredTransactions.map((txn) => (
                    <Card key={txn.id} className={`border-l-4 ${
                      txn.type === 'deposit' ? 'border-l-green-600' : 'border-l-red-600'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${
                              txn.type === 'deposit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {txn.type === 'deposit' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">@{txn.username}</span>
                                <Badge variant={txn.status === 'completed' ? 'default' : txn.status === 'pending' ? 'secondary' : 'destructive'}>
                                  {txn.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mb-1">
                                {txn.description || `${txn.type} via ${txn.paymentMethod}`}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatDate(txn.timestamp)}</span>
                                <span className="capitalize">{txn.paymentMethod}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              txn.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {txn.type === 'deposit' ? '+' : '-'}${txn.amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {txn.id.substring(0, 12)}...
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins size={20} />
                Token Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Give users tokens that can be redeemed for platform currency. 1 token = $1
              </p>

              <div className="space-y-2">
                <Label htmlFor="tokenUsername">Username</Label>
                <Input
                  id="tokenUsername"
                  value={tokenUsername}
                  onChange={(e) => setTokenUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenAmount">Token Amount</Label>
                <Input
                  id="tokenAmount"
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="Number of tokens"
                />
              </div>

              <Button 
                onClick={handleGiveTokens}
                disabled={isProcessing}
                className="w-full gap-2"
              >
                <Coins />
                Give Tokens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus size={20} />
                Create Alternate User Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newUsername">Username</Label>
                  <Input
                    id="newUsername"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newDisplayName">Display Name</Label>
                  <Input
                    id="newDisplayName"
                    value={newUserForm.displayName}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Display Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newParty">Political Party</Label>
                <Select 
                  value={newUserForm.party} 
                  onValueChange={(value: PoliticalParty) => setNewUserForm(prev => ({ ...prev, party: value }))}
                >
                  <SelectTrigger id="newParty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="democrat">Democrat</SelectItem>
                    <SelectItem value="republican">Republican</SelectItem>
                    <SelectItem value="independent">Independent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isAdmin"
                  checked={newUserForm.isAdmin}
                  onCheckedChange={(checked) => setNewUserForm(prev => ({ ...prev, isAdmin: checked as boolean }))}
                />
                <Label htmlFor="isAdmin">Make this user an admin</Label>
              </div>

              <Button 
                onClick={handleCreateUser}
                disabled={isProcessing}
                className="w-full gap-2"
              >
                <UserPlus />
                Create User Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Users ({users?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users?.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">@{u.username}</div>
                        <div className="text-sm text-muted-foreground">{u.displayName}</div>
                      </div>
                      {u.isAdmin && <Badge variant="destructive">Admin</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {u.tokens || 0} tokens
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck size={20} />
                User Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="selectUser">Select User</Label>
                <Select value={selectedUserId} onValueChange={(value) => {
                  setSelectedUserId(value)
                  const selectedUser = users?.find(u => u.id === value)
                  setUserPermissions(selectedUser?.permissions || [])
                }}>
                  <SelectTrigger id="selectUser">
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map(u => (
                      <SelectItem key={u.id} value={u.id}>@{u.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUserId && (
                <>
                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    {availablePermissions.map(perm => (
                      <div key={perm} className="flex items-center gap-2">
                        <Checkbox
                          id={perm}
                          checked={userPermissions.includes(perm)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setUserPermissions([...userPermissions, perm])
                            } else {
                              setUserPermissions(userPermissions.filter(p => p !== perm))
                            }
                          }}
                        />
                        <Label htmlFor={perm} className="capitalize cursor-pointer">
                          {perm.replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleUpdatePermissions}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    Update Permissions
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gear size={20} />
                Site Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="terms">Terms and Conditions</Label>
                <textarea
                  id="terms"
                  className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background"
                  defaultValue={siteSettings?.termsAndConditions}
                  onBlur={(e) => handleSaveSettings('termsAndConditions', e.target.value)}
                  placeholder="Enter terms and conditions..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy">Privacy Policy</Label>
                <textarea
                  id="privacy"
                  className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background"
                  defaultValue={siteSettings?.privacyPolicy}
                  onBlur={(e) => handleSaveSettings('privacyPolicy', e.target.value)}
                  placeholder="Enter privacy policy..."
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Gateways</Label>
                <div className="grid grid-cols-2 gap-3">
                  {siteSettings && Object.entries(siteSettings.paymentGateways).map(([gateway, enabled]) => (
                    <div key={gateway} className="flex items-center gap-2">
                      <Checkbox
                        id={`gateway-${gateway}`}
                        checked={enabled}
                        onCheckedChange={(checked) => {
                          if (siteSettings) {
                            setSiteSettings({
                              ...siteSettings,
                              paymentGateways: {
                                ...siteSettings.paymentGateways,
                                [gateway]: checked as boolean
                              }
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`gateway-${gateway}`} className="capitalize cursor-pointer">
                        {gateway === 'cashapp' ? 'Cash App' : 
                         gateway === 'applePay' ? 'Apple Pay' : 
                         gateway}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon size={20} />
                Footer Page Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create custom pages that appear in the footer. Write the content for each page and they'll be linked automatically.
              </p>

              <div className="space-y-2">
                <Label htmlFor="pageName">Page Name</Label>
                <Input
                  id="pageName"
                  value={footerPageForm.name}
                  onChange={(e) => setFooterPageForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Terms, Privacy, Contact Us"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageUrl">Page URL (optional)</Label>
                <Input
                  id="pageUrl"
                  value={footerPageForm.url}
                  onChange={(e) => setFooterPageForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Leave blank for auto-generated"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageContent">Page Content</Label>
                <textarea
                  id="pageContent"
                  className="w-full min-h-[200px] p-3 rounded-md border border-input bg-background"
                  value={footerPageForm.content}
                  onChange={(e) => setFooterPageForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write the content for this page..."
                />
              </div>

              <Button 
                onClick={handleAddFooterPage}
                className="w-full gap-2"
              >
                <LinkIcon />
                Add Footer Page
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Footer Pages</CardTitle>
            </CardHeader>
            <CardContent>
              {!siteSettings?.footerPages || siteSettings.footerPages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom footer pages added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {siteSettings.footerPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{page.name}</div>
                        <div className="text-sm text-muted-foreground">{page.url}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFooterPage(index)}
                      >
                        <Trash size={16} className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Custom API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create custom API calls to control engagement and platform features
              </p>

              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint Name</Label>
                <Input
                  id="endpoint"
                  value={apiCallForm.endpoint}
                  onChange={(e) => setApiCallForm(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="/api/custom-action"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">HTTP Method</Label>
                <Select 
                  value={apiCallForm.method} 
                  onValueChange={(value) => setApiCallForm(prev => ({ ...prev, method: value }))}
                >
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={apiCallForm.description}
                  onChange={(e) => setApiCallForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this API do?"
                />
              </div>

              <Button 
                onClick={() => {
                  toast.success('API endpoint configuration saved')
                  setApiCallForm({ endpoint: '', method: 'GET', description: '' })
                }}
                className="w-full"
              >
                Create API Endpoint
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
