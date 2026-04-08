'use client'

import { useEffect, useCallback } from 'react'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import Footer from './Footer'

export default function ClientShell({ children }: { children: React.ReactNode }) {
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

    // Re-observe on DOM mutations (route changes)
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
  }, [observeElements])

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', paddingBottom: '80px' }} className="md:pb-0">
        {children}
      </div>
      <Footer />
      <BottomNav />
    </>
  )
}
