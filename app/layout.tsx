import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#15803d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://nobarfinder.com'),
  title: 'NobarFinder — Cari Tempat Nonton Bareng di Indonesia',
  description: 'Direktori tempat nonton bareng (nobar) terlengkap di Indonesia. Temukan venue nobar bola di kotamu — gratis maupun berbayar, outdoor sampai kafe ber-AC.',
  keywords: ['nobar', 'nonton bareng', 'tempat nobar', 'nobar bola', 'venue nobar indonesia'],
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'NobarFinder' },
  verification: { google: 'phEc3qgsve2b7msf_gEXx1dhwLJwyCp1iOzvPY06aJo' },
  openGraph: {
    title: 'NobarFinder — Cari Tempat Nobar di Indonesia',
    description: 'Direktori tempat nonton bareng terlengkap di Indonesia 🇮🇩⚽',
    type: 'website', url: 'https://nobarfinder.com',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* Preconnect ke font origins — reduce latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Load font async — display=swap mencegah FOIT */}
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NobarFinder" />
      </head>
      <body className="bg-[#FAFAF9] text-stone-900 antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
