import { useEffect } from 'react'
import { useStore } from '@nanostores/react'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import AuthModal from '@/components/auth/AuthModal'
import CreditsModal from '@/components/auth/CreditsModal'
import AppOverlay from '@/components/tools/AppOverlay'
import Hero from '@/components/sections/Hero'
import TrustStrip from '@/components/sections/TrustStrip'
import StatsBand from '@/components/sections/StatsBand'
import HowItWorks from '@/components/sections/HowItWorks'
import Showcase from '@/components/sections/Showcase'
import Standards from '@/components/sections/Standards'
import Pricing from '@/components/sections/Pricing'
import Testimonials from '@/components/sections/Testimonials'
import Comparison from '@/components/sections/Comparison'
import FAQ from '@/components/sections/FAQ'
import CTA from '@/components/sections/CTA'
import { loadSession } from '@/lib/auth'
import { langStore } from '@/stores/lang-store'
import { initRouter } from '@/stores/ui-store'

export default function App() {
  const lang = useStore(langStore)

  useEffect(() => {
    loadSession()
    initRouter()
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <>
      <Nav />
      <Hero />
      <TrustStrip />
      <StatsBand />
      <HowItWorks />
      <Showcase />
      <Standards />
      <Pricing />
      <Testimonials />
      <Comparison />
      <FAQ />
      <CTA />
      <Footer />
      <AuthModal />
      <CreditsModal />
      <AppOverlay />
    </>
  )
}
