import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://nobarfinder.com'),
  title: 'NobarFinder — Cari Tempat Nonton Bareng di Indonesia',
  description: 'Direktori tempat nonton bareng (nobar) terlengkap di Indonesia. Temukan venue nobar bola di kotamu — gratis maupun berbayar, outdoor sampai kafe ber-AC.',
  keywords: ['nobar', 'nonton bareng', 'tempat nobar', 'nobar bola', 'venue nobar indonesia'],
  verification: {
    google: 'phEc3qgsve2b7msf_gEXx1dhwLJwyCp1iOzvPY06aJo',
  },
  openGraph: {
    title: 'NobarFinder — Cari Tempat Nobar di Indonesia',
    description: 'Direktori tempat nonton bareng terlengkap di Indonesia 🇮🇩⚽',
    type: 'website',
    url: 'https://nobarfinder.com',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#FAFAF9] text-stone-900 antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
