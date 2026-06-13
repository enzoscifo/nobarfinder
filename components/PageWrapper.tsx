'use client'

import { useEffect, useRef } from 'react'

export default function PageWrapper({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Set initial state
    el.style.opacity = '0'
    el.style.transform = 'translateY(6px)'
    // rAF: pastikan browser sudah paint sebelum animasi
    const id = requestAnimationFrame(() => {
      if (!el) return
      el.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
