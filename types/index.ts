export interface CityInfo {
  slug: string
  name: string
  emoji: string
  province: string
  description: string
}

export interface NobarVenue {
  id: string
  name: string
  city: string // slug
  address: string
  type: 'outdoor' | 'cafe' | 'resto' | 'mall' | 'komunitas'
  icon: string
  tags: string[]
  isFree: boolean
  openTime: string
  mapsUrl: string
  phone?: string
  photoUrl?: string // approved photo
  websiteUrl?: string // link ke web/medsos venue
}

export interface VenueSubmission {
  venueName: string
  city: string
  cityCustom?: string
  address: string
  type: string
  isFree: string
  openTime: string
  description: string
  submitterName: string
  submitterContact: string
  photoUrl?: string
}
