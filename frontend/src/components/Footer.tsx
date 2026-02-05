import { useKV } from '@/hooks/use-kv'
import { SiteSettings } from '@/App'

export function Footer() {
  const [siteSettings] = useKV<SiteSettings | undefined>('siteSettings', undefined)

  const customPages = siteSettings?.footerPages || []

  const termsPage = customPages.find(p => p.name.toLowerCase().includes('terms'))
  const privacyPage = customPages.find(p => p.name.toLowerCase().includes('privacy'))
  const contactPage = customPages.find(p => p.name.toLowerCase().includes('contact'))

  return (
    <footer className="border-t bg-card mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <div>
              <span className="font-bold">Lerumos</span>
              <p className="text-sm text-muted-foreground">
                The premier political social platform for engaging discourse and community building.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {termsPage && (
              <a href={termsPage.url} className="hover:text-foreground transition-colors">
                Terms
              </a>
            )}
            {privacyPage && (
              <a href={privacyPage.url} className="hover:text-foreground transition-colors">
                Privacy
              </a>
            )}
            {contactPage && (
              <a href={contactPage.url} className="hover:text-foreground transition-colors">
                Contact Us
              </a>
            )}
            {customPages.filter(p => 
              !p.name.toLowerCase().includes('terms') && 
              !p.name.toLowerCase().includes('privacy') && 
              !p.name.toLowerCase().includes('contact')
            ).map((page, index) => (
              <a key={index} href={page.url} className="hover:text-foreground transition-colors">
                {page.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
