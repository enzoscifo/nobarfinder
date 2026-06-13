import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NobarFinder — Tempat Nobar Indonesia',
    short_name: 'NobarFinder',
    description: 'Cari tempat nonton bareng terbaik di kotamu',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF9',
    theme_color: '#15803d',
    orientation: 'portrait-primary',
    categories: ['entertainment', 'lifestyle', 'sports'],
    lang: 'id',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      {
        name: 'Tambah Venue',
        short_name: 'Tambah',
        description: 'Daftarkan tempat nobar baru',
        url: '/tambah',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
