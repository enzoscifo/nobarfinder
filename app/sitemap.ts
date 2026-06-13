import type { MetadataRoute } from 'next'
import { CITY_LIST, getAllVenues, venueSlug } from '@/lib/data'

const BASE = 'https://nobarfinder.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/tambah`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/tentang`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const cityPages: MetadataRoute.Sitemap = CITY_LIST.map(c => ({
    url: `${BASE}/${c.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  const venuePages: MetadataRoute.Sitemap = getAllVenues().map(v => ({
    url: `${BASE}/${v.city}/${venueSlug(v)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...cityPages, ...venuePages]
}
