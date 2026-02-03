import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Cookie, X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

export function CookieConsent() {
  const [cookieConsent, setCookieConsent] = useKV<boolean | null>('cookieConsent', null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (cookieConsent === null) {
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cookieConsent])

  const handleAccept = () => {
    setCookieConsent(true)
    setShowBanner(false)
  }

  const handleDecline = () => {
    setCookieConsent(false)
    setShowBanner(false)
  }

  if (cookieConsent !== null || !showBanner) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
      >
        <Card className="shadow-lg border-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Cookie size={32} className="text-accent" weight="duotone" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold mb-2">We value your privacy</h3>
                  <p className="text-sm text-muted-foreground">
                    We use cookies to enhance your browsing experience, serve personalized content, 
                    and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleAccept} className="flex-1">
                    Accept All
                  </Button>
                  <Button onClick={handleDecline} variant="outline" className="flex-1">
                    Decline
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDecline}
                    className="text-xs"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={handleDecline}
              >
                <X size={18} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
