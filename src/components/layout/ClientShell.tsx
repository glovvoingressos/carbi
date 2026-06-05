'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const observeElements = useCallback(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )

    document.querySelectorAll('.scroll-reveal:not(.visible)').forEach((el) => {
      observer.observe(el)
    })

    return observer
  }, [])

  useEffect(() => {
    const observer = observeElements()

    const mutationObserver = new MutationObserver(() => {
      observeElements()
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [pathname, observeElements])

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingBottom: '96px' }} className="md:pb-0 page-shell">
        {children}
      </main>
      <Footer />
    </>
  )
}
