'use client'

import { useEffect, useRef } from 'react'

/**
 * Bungkus konten halaman dengan animasi fade-in saat mount.
 * Dipakai di halaman yang sudah server-rendered supaya tetap ada
 * transisi visual yang halus.
 */
export default function PageWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(8px)'
    // Satu frame delay supaya browser sempat paint dulu
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.22s ease-out, transform 0.22s ease-out'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
