'use client'

import { ReactNode } from 'react'

interface TooltipProps {
  children: ReactNode
  content: string
}

export default function Tooltip({ children, content }: TooltipProps) {
  return (
    <span className="ref-tooltip-wrap">
      <span className="ref-tooltip-trigger">{children}</span>
      <span className="ref-tooltip-content" role="tooltip">{content}</span>
    </span>
  )
}
