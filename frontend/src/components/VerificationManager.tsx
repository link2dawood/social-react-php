import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import { CheckCircle, CreditCard, Star } from '@phosphor-icons/react'
import { User } from '@/App'
import { toast } from 'sonner'

interface VerificationManagerProps {
  user: User
  onUserUpdate: (updatedUser: User) => void
}

export function VerificationManager({ user, onUserUpdate }: VerificationManagerProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const verificationPrice = 50 // $50 for verification

  const purchaseVerification = async () => {
    if ((user.earnings || 0) < verificationPrice) {
      toast.error(`Insufficient funds! You need $${verificationPrice} but only have $${(user.earnings || 0).toFixed(2)}`)
      return
    }

    if (user.isVerified) {
      toast.error('You are already verified!')
      return
    }

    setIsProcessing(true)

    try {
      const updatedUser = {
        ...user,
        isVerified: true,
        earnings: (user.earnings || 0) - verificationPrice
      }

      const updatedUsers = users?.map(u => 
        u.id === user.id ? updatedUser : u
      ) || []

      await setUsers(updatedUsers)
      onUserUpdate(updatedUser)
      
      toast.success('Congratulations! You are now verified! ✅')
    } catch (error) {
      toast.error('Failed to process verification. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <VerifiedBadge size="md" />
          Verification Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.isVerified ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Verified Account</p>
              <p className="text-sm text-green-600">
                Your account is verified with a blue checkmark badge
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <VerifiedBadge size="lg" />
                <div>
                  <h4 className="font-semibold text-blue-900">Get Verified</h4>
                  <p className="text-sm text-blue-700">
                    Stand out with the official verification badge
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-blue-800 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Official blue verification badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Increased credibility and trust</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Priority in search results</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Enhanced profile visibility</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-green-600">${verificationPrice}</p>
                  <p className="text-xs text-muted-foreground">One-time payment</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2" disabled={(user.earnings || 0) < verificationPrice}>
                      <VerifiedBadge size="sm" />
                      Get Verified
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <VerifiedBadge size="md" />
                        Purchase Verification
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-center p-6 border rounded-lg">
                        <VerifiedBadge size="lg" className="mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Get Your Blue Checkmark</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Join the verified community and enhance your credibility on the platform
                        </p>
                        
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span>Verification Badge</span>
                          <span className="font-semibold">${verificationPrice}</span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          Your balance: ${(user.earnings || 0).toFixed(2)}
                        </p>
                      </div>
                      
                      <Button 
                        onClick={purchaseVerification}
                        disabled={isProcessing || (user.earnings || 0) < verificationPrice}
                        className="w-full"
                        size="lg"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Processing...' : `Purchase Verification - $${verificationPrice}`}
                      </Button>
                      
                      {(user.earnings || 0) < verificationPrice && (
                        <p className="text-sm text-red-600 text-center">
                          You need ${(verificationPrice - (user.earnings || 0)).toFixed(2)} more to get verified
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}