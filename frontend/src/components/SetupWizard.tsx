import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { SiteSettings } from '@/App'
import { ArrowRight, ArrowLeft, Check, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface SetupWizardProps {
  isOpen: boolean
  onComplete: () => void
}

export function SetupWizard({ isOpen, onComplete }: SetupWizardProps) {
  const [, setSiteSettings] = useKV<SiteSettings>('siteSettings', {} as SiteSettings)
  const [step, setStep] = useState(1)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<SiteSettings>({
    ageRestriction: 18,
    termsAndConditions: 'By using this platform, you agree to follow all applicable laws and regulations.',
    privacyPolicy: 'We collect minimal user data necessary for platform operation.',
    paymentGateways: {
      stripe: false,
      applePay: false,
      paypal: false,
      cashapp: false,
      zelle: false,
      bitcoin: false
    },
    paymentCredentials: {},
    adminInfo: {
      name: '',
      email: ''
    },
    siteFunds: 0,
    isSetupComplete: false
  })

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const handleComplete = async () => {
    if (!formData.adminInfo.name || !formData.adminInfo.email) {
      toast.error('Please fill in admin information')
      return
    }

    const completedSettings = { ...formData, isSetupComplete: true }
    
    try {
      // Save to database first
      await api.saveSiteSettings(completedSettings)
      
      // Then save to localStorage
      await setSiteSettings(completedSettings)
      // Also save directly to localStorage as backup
      try {
        localStorage.setItem('siteSettings', JSON.stringify(completedSettings))
      } catch (e) {
        console.error('Failed to save siteSettings to localStorage:', e)
      }
      
      toast.success('Setup complete! Welcome to Lerumos.')
      // Small delay to ensure state is saved before closing
      setTimeout(() => {
        onComplete()
      }, 200)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save setup. Please try again.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Lerumos Setup Wizard</DialogTitle>
        </DialogHeader>
        
        <Progress value={progress} className="mb-4" />
        
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Admin Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adminName">Admin Name</Label>
                  <Input
                    id="adminName"
                    value={formData.adminInfo.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      adminInfo: { ...prev.adminInfo, name: e.target.value }
                    }))}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminInfo.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      adminInfo: { ...prev.adminInfo, email: e.target.value }
                    }))}
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="ageRestriction">Age Restriction</Label>
                  <Input
                    id="ageRestriction"
                    type="number"
                    value={formData.ageRestriction}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ageRestriction: parseInt(e.target.value) || 18
                    }))}
                    placeholder="18"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum age requirement for users
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
                Next <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Gateways</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select which payment methods to enable for your platform
              </p>
              <div className="space-y-3">
                {Object.entries(formData.paymentGateways).map(([gateway, enabled]) => (
                  <Card key={gateway} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={gateway}
                          checked={enabled}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            paymentGateways: {
                              ...prev.paymentGateways,
                              [gateway]: checked as boolean
                            }
                          }))}
                        />
                        <Label htmlFor={gateway} className="text-base font-medium capitalize cursor-pointer">
                          {gateway === 'cashapp' ? 'Cash App' : 
                           gateway === 'applePay' ? 'Apple Pay' : 
                           gateway.charAt(0).toUpperCase() + gateway.slice(1)}
                        </Label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2" /> Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Credentials</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add API keys and credentials for enabled payment methods
              </p>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {formData.paymentGateways.stripe && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Stripe</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="stripe-client-id">Client ID</Label>
                        <Input
                          id="stripe-client-id"
                          value={formData.paymentCredentials?.stripe?.clientId || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            paymentCredentials: {
                              ...prev.paymentCredentials,
                              stripe: {
                                ...prev.paymentCredentials?.stripe,
                                clientId: e.target.value,
                                secretKey: prev.paymentCredentials?.stripe?.secretKey || ''
                              }
                            }
                          }))}
                          placeholder="pk_live_..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="stripe-secret-key">Secret Key</Label>
                        <div className="relative">
                          <Input
                            id="stripe-secret-key"
                            type={showSecrets['stripe'] ? 'text' : 'password'}
                            value={formData.paymentCredentials?.stripe?.secretKey || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              paymentCredentials: {
                                ...prev.paymentCredentials,
                                stripe: {
                                  ...prev.paymentCredentials?.stripe,
                                  clientId: prev.paymentCredentials?.stripe?.clientId || '',
                                  secretKey: e.target.value
                                }
                              }
                            }))}
                            placeholder="sk_live_..."
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowSecrets(prev => ({ ...prev, stripe: !prev.stripe }))}
                          >
                            {showSecrets['stripe'] ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {formData.paymentGateways.paypal && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">PayPal</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="paypal-client-id">Client ID</Label>
                        <Input
                          id="paypal-client-id"
                          value={formData.paymentCredentials?.paypal?.clientId || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            paymentCredentials: {
                              ...prev.paymentCredentials,
                              paypal: {
                                ...prev.paymentCredentials?.paypal,
                                clientId: e.target.value,
                                secretKey: prev.paymentCredentials?.paypal?.secretKey || ''
                              }
                            }
                          }))}
                          placeholder="Enter PayPal Client ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="paypal-secret-key">Secret Key</Label>
                        <div className="relative">
                          <Input
                            id="paypal-secret-key"
                            type={showSecrets['paypal'] ? 'text' : 'password'}
                            value={formData.paymentCredentials?.paypal?.secretKey || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              paymentCredentials: {
                                ...prev.paymentCredentials,
                                paypal: {
                                  ...prev.paymentCredentials?.paypal,
                                  clientId: prev.paymentCredentials?.paypal?.clientId || '',
                                  secretKey: e.target.value
                                }
                              }
                            }))}
                            placeholder="Enter PayPal Secret"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowSecrets(prev => ({ ...prev, paypal: !prev.paypal }))}
                          >
                            {showSecrets['paypal'] ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {formData.paymentGateways.cashapp && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Cash App</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="cashapp-api-key">API Key</Label>
                        <div className="relative">
                          <Input
                            id="cashapp-api-key"
                            type={showSecrets['cashapp'] ? 'text' : 'password'}
                            value={formData.paymentCredentials?.cashapp?.apiKey || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              paymentCredentials: {
                                ...prev.paymentCredentials,
                                cashapp: { apiKey: e.target.value }
                              }
                            }))}
                            placeholder="Enter Cash App API Key"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowSecrets(prev => ({ ...prev, cashapp: !prev.cashapp }))}
                          >
                            {showSecrets['cashapp'] ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {formData.paymentGateways.zelle && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Zelle</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="zelle-email">Email Address</Label>
                        <Input
                          id="zelle-email"
                          type="email"
                          value={formData.paymentCredentials?.zelle?.email || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            paymentCredentials: {
                              ...prev.paymentCredentials,
                              zelle: { email: e.target.value }
                            }
                          }))}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {formData.paymentGateways.bitcoin && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Bitcoin</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="bitcoin-wallet">Wallet Address</Label>
                        <Input
                          id="bitcoin-wallet"
                          value={formData.paymentCredentials?.bitcoin?.walletAddress || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            paymentCredentials: {
                              ...prev.paymentCredentials,
                              bitcoin: { walletAddress: e.target.value }
                            }
                          }))}
                          placeholder="Enter Bitcoin wallet address"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {!Object.values(formData.paymentGateways).some(v => v) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment gateways enabled. Go back to enable payment methods.
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2" /> Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal & Policies</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="terms">Terms and Conditions</Label>
                  <textarea
                    id="terms"
                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                    value={formData.termsAndConditions}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      termsAndConditions: e.target.value
                    }))}
                    placeholder="Enter your terms and conditions..."
                  />
                </div>
                <div>
                  <Label htmlFor="privacy">Privacy Policy</Label>
                  <textarea
                    id="privacy"
                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                    value={formData.privacyPolicy}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      privacyPolicy: e.target.value
                    }))}
                    placeholder="Enter your privacy policy..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2" /> Back
              </Button>
              <Button onClick={handleComplete} className="gap-2">
                Complete Setup <Check />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
