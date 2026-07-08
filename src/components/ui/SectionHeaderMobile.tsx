'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface SectionHeaderMobileProps {
  title: string
  link?: {
    href: string
    text?: string
  }
}

export default function SectionHeaderMobile({ 
  title, 
  link 
}: SectionHeaderMobileProps) {
  return (
    <div className="section-header-mobile">
      <h3>{title}</h3>
      {link && (
        <Link href={link.href} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {link.text || 'Ver mais'}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}
