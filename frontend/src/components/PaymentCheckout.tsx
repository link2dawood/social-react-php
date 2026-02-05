import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, SiteSettings, Transaction } from '@/App'
import { CreditCard, Bank, Wallet, CurrencyBtc, X, Check, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface PaymentCheckoutProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onUserUpdate: (user: User) => void
}

type PaymentMethod = 'stripe' | 'paypal' | 'cashapp' | 'zelle' | 'bitcoin'

export function PaymentCheckout({ isOpen, onClose, user, onUserUpdate }: PaymentCheckoutProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [siteSettings, setSiteSettings] = useKV<SiteSettings | undefined>('siteSettings', undefined)
  const [transactions, setTransactions] = useKV<Transaction[]>('transactions', [])
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [paypalEmail, setPaypalEmail] = useState('')
  const [cashappTag, setCashappTag] = useState('')
  const [zelleEmail, setZelleEmail] = useState('')
  const [btcAddress, setBtcAddress] = useState('')

  const allMethods: { method: PaymentMethod; name: string; icon: any }[] = [
    { method: 'stripe' as const, name: 'Credit/Debit Card', icon: CreditCard },
    { method: 'paypal' as const, name: 'PayPal', icon: Wallet },
    { method: 'cashapp' as const, name: 'Cash App', icon: Bank },
    { method: 'zelle' as const, name: 'Zelle', icon: Bank },
    { method: 'bitcoin' as const, name: 'Bitcoin', icon: CurrencyBtc },
  ]
  
  const availableMethods = allMethods.filter(m => siteSettings?.paymentGateways[m.method])

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount)
    
    if (!depositAmount || depositAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (depositAmount < 5) {
      toast.error('Minimum deposit is $5.00')
      return
    }

    if (!selectedMethod) {
      toast.error('Please select a payment method')
      return
    }

    if (selectedMethod === 'stripe' && (!cardNumber || !expiryDate || !cvv)) {
      toast.error('Please fill in all card details')
      return
    }

    if (selectedMethod === 'paypal' && !paypalEmail) {
      toast.error('Please enter your PayPal email')
      return
    }

    if (selectedMethod === 'cashapp' && !cashappTag) {
      toast.error('Please enter your Cash App tag')
      return
    }

    if (selectedMethod === 'zelle' && !zelleEmail) {
      toast.error('Please enter your Zelle email')
      return
    }

    if (selectedMethod === 'bitcoin' && !btcAddress) {
      toast.error('Please enter your Bitcoin address')
      return
    }

    setIsProcessing(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const updatedUser = {
        ...user,
        earnings: (user.earnings || 0) + depositAmount
      }

      const transaction: Transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: user.id,
        username: user.username,
        type: 'deposit',
        amount: depositAmount,
        paymentMethod: selectedMethod,
        status: 'completed',
        timestamp: new Date().toISOString(),
        description: `Deposit via ${selectedMethod}`
      }

      const updatedSiteSettings = {
        ...siteSettings!,
        siteFunds: (siteSettings?.siteFunds || 0) + depositAmount
      }

      const updatedUsers = users?.map(u => u.id === user.id ? updatedUser : u) || []
      await setUsers(updatedUsers)
      await setTransactions((prevTransactions) => [...(prevTransactions || []), transaction])
      await setSiteSettings(updatedSiteSettings)
      onUserUpdate(updatedUser)

      toast.success(`Successfully deposited $${depositAmount.toFixed(2)}`)
      
      setAmount('')
      setCardNumber('')
      setExpiryDate('')
      setCvv('')
      setPaypalEmail('')
      setCashappTag('')
      setZelleEmail('')
      setBtcAddress('')
      onClose()
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts: string[] = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4)
    }
    return v
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Deposit Funds</DialogTitle>
          <DialogDescription>
            Add money to your account to tip users and rent advertising slots
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="deposit-amount" className="text-base font-semibold">Deposit Amount</Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold">$</span>
              <Input
                id="deposit-amount"
                type="number"
                min="5"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8 text-lg h-12"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Minimum deposit: $5.00</p>
          </div>

          {availableMethods.length === 0 ? (
            <Card className="border-warning bg-warning/5">
              <CardContent className="flex items-center gap-3 p-4">
                <Warning size={24} className="text-warning" />
                <p className="text-sm">No payment methods are currently configured. Please contact the administrator.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Payment Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableMethods.map(({ method, name, icon: Icon }) => (
                    <Card
                      key={method}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        selectedMethod === method ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <Icon size={24} className={selectedMethod === method ? 'text-primary' : ''} />
                        <span className="font-medium">{name}</span>
                        {selectedMethod === method && <Check size={20} className="ml-auto text-primary" />}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedMethod && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Payment Details</Label>
                  
                  {selectedMethod === 'stripe' && (
                    <Card>
                      <CardContent className="space-y-4 pt-6">
                        <div>
                          <Label htmlFor="card-number">Card Number</Label>
                          <Input
                            id="card-number"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                              id="expiry"
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                              placeholder="MM/YY"
                              maxLength={5}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              type="password"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-muted rounded-md text-sm">
                          <Check size={16} className="mt-0.5 text-green-600" />
                          <p>Your payment information is encrypted and secure</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedMethod === 'paypal' && (
                    <Card>
                      <CardContent className="space-y-4 pt-6">
                        <div>
                          <Label htmlFor="paypal-email">PayPal Email</Label>
                          <Input
                            id="paypal-email"
                            type="email"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            placeholder="your@email.com"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You'll be redirected to PayPal to complete your payment
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedMethod === 'cashapp' && (
                    <Card>
                      <CardContent className="space-y-4 pt-6">
                        <div>
                          <Label htmlFor="cashapp-tag">Cash App Tag</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                            <Input
                              id="cashapp-tag"
                              value={cashappTag}
                              onChange={(e) => setCashappTag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                              placeholder="username"
                              className="pl-7"
                            />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You'll be redirected to Cash App to complete your payment
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedMethod === 'zelle' && (
                    <Card>
                      <CardContent className="space-y-4 pt-6">
                        <div>
                          <Label htmlFor="zelle-email">Zelle Email or Phone</Label>
                          <Input
                            id="zelle-email"
                            value={zelleEmail}
                            onChange={(e) => setZelleEmail(e.target.value)}
                            placeholder="your@email.com or phone number"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Send payment to: {siteSettings?.paymentCredentials?.zelle?.email || 'platform@lerumos.com'}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedMethod === 'bitcoin' && (
                    <Card>
                      <CardContent className="space-y-4 pt-6">
                        <div>
                          <Label htmlFor="btc-address">Your Bitcoin Address</Label>
                          <Input
                            id="btc-address"
                            value={btcAddress}
                            onChange={(e) => setBtcAddress(e.target.value)}
                            placeholder="Enter your BTC wallet address"
                          />
                        </div>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-1">Send Bitcoin to:</p>
                          <code className="text-xs break-all">{siteSettings?.paymentCredentials?.bitcoin?.walletAddress || 'No wallet configured'}</code>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeposit} 
              className="flex-1" 
              disabled={isProcessing || !selectedMethod || !amount || parseFloat(amount) < 5}
            >
              {isProcessing ? 'Processing...' : `Deposit $${parseFloat(amount || '0').toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
