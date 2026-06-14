export interface CityInfo {
  slug: string
  name: string
  emoji: string
  province: string
  description: string // deskripsi kota untuk SEO
}

export interface NobarVenue {
  id: string
  name: string
  city: string        // slug kota
  address: string
  type: 'outdoor' | 'cafe' | 'resto' | 'mall' | 'komunitas'
  icon: string
  tags: string[]
  isFree: boolean
  openTime: string
  mapsUrl: string
  phone?: string
  photoUrl?: string
  websiteUrl?: string
  description?: string // deskripsi & fasilitas venue (tampil publik)
  isClaimed?: boolean
  isVerified?: boolean
}

export interface VenueSubmission {
  venueName: string
  city: string
  cityCustom?: string
  address: string
  type: string
  isFree: string
  openTime: string
  description?: string // opsional
  submitterName: string
  submitterContact: string
  photoUrl?: string
  websiteUrl?: string
}
