import { CityInfo, NobarVenue } from '@/types'

export const CITY_LIST: CityInfo[] = [
  { slug: 'yogyakarta', name: 'Yogyakarta', emoji: '🏛️', province: 'DI Yogyakarta', description: 'Tempat nonton bareng di Yogyakarta — dari Alun-alun Kidul sampai kafe Kaliurang.' },
  { slug: 'jakarta', name: 'Jakarta', emoji: '🏙️', province: 'DKI Jakarta', description: 'Venue nonton bareng di Jakarta — GBK fan zone, kafe SCBD, dan banyak lagi.' },
  { slug: 'surabaya', name: 'Surabaya', emoji: '🦈', province: 'Jawa Timur', description: 'Lokasi nonton bareng di Surabaya dan sekitarnya.' },
  { slug: 'bandung', name: 'Bandung', emoji: '🌄', province: 'Jawa Barat', description: 'Tempat nonton bareng di Bandung — Braga, Dago, dan kafe kekinian.' },
  { slug: 'medan', name: 'Medan', emoji: '🌴', province: 'Sumatera Utara', description: 'Venue nonton bareng di Medan.' },
  { slug: 'makassar', name: 'Makassar', emoji: '🌊', province: 'Sulawesi Selatan', description: 'Nonton bareng di Makassar — Pantai Losari dan lainnya.' },
  { slug: 'semarang', name: 'Semarang', emoji: '⛵', province: 'Jawa Tengah', description: 'Tempat nonton bareng di Semarang — Kota Lama dan sekitarnya.' },
  { slug: 'malang', name: 'Malang', emoji: '🍎', province: 'Jawa Timur', description: 'Lokasi nonton bareng di Malang.' },
  { slug: 'solo', name: 'Solo', emoji: '🎭', province: 'Jawa Tengah', description: 'Venue nonton bareng di Solo / Surakarta.' },
  { slug: 'denpasar', name: 'Denpasar', emoji: '🏖️', province: 'Bali', description: 'Tempat nonton bareng di Denpasar dan Bali.' },
]

export function getCityBySlug(slug: string): CityInfo | undefined {
  return CITY_LIST.find(c => c.slug === slug)
}

export const VENUES: NobarVenue[] = [
  { id: 'yk-1', name: 'Nobar — Alun-alun Kidul', city: 'yogyakarta', address: 'Alun-alun Kidul, Kraton, Yogyakarta', type: 'outdoor', icon: '🏟️', tags: ['LED Besar', 'Food Court', 'Parkir Luas'], isFree: true, openTime: '20:00', mapsUrl: 'https://maps.google.com/?q=Alun-alun+Kidul+Yogyakarta' },
  { id: 'yk-2', name: 'Filosofi Kopi Yogyakarta', city: 'yogyakarta', address: 'Jl. Ndalem Mangkubumen KT III/578', type: 'cafe', icon: '☕', tags: ['AC', 'Proyektor 150"', 'Reservasi'], isFree: false, openTime: '21:00', mapsUrl: 'https://maps.google.com/?q=Filosofi+Kopi+Yogyakarta', phone: '+62 274 123456' },
  { id: 'yk-3', name: 'Angkringan Pak Budi', city: 'yogyakarta', address: 'Jl. Malioboro No. 45', type: 'outdoor', icon: '🍗', tags: ['Outdoor', 'Nasi Kucing', 'Tradisional'], isFree: true, openTime: '19:00', mapsUrl: 'https://maps.google.com/?q=Malioboro+Yogyakarta' },
  { id: 'yk-4', name: 'Warung Kopi Klotok', city: 'yogyakarta', address: 'Jl. Kaliurang KM 16, Sleman', type: 'cafe', icon: '🌄', tags: ['View Merapi', 'Outdoor', 'WiFi'], isFree: true, openTime: '20:00', mapsUrl: 'https://maps.google.com/?q=Warung+Kopi+Klotok+Yogyakarta' },
  { id: 'yk-5', name: 'Timezone Ambarukmo Plaza', city: 'yogyakarta', address: 'Ambarukmo Plaza Lt.3', type: 'mall', icon: '🎮', tags: ['AC', 'Indoor', 'Gaming'], isFree: false, openTime: '20:30', mapsUrl: 'https://maps.google.com/?q=Ambarukmo+Plaza+Yogyakarta' },
  { id: 'yk-6', name: 'Komunitas Bola Jogja', city: 'yogyakarta', address: 'Jl. Colombo No.1', type: 'komunitas', icon: '⚽', tags: ['Komunitas', 'Gratis', 'Discord'], isFree: true, openTime: '19:30', mapsUrl: 'https://maps.google.com/?q=Colombo+Yogyakarta' },
  { id: 'jkt-1', name: 'GBK Fan Zone Senayan', city: 'jakarta', address: 'Komplek GBK, Senayan', type: 'outdoor', icon: '🏟️', tags: ['LED Raksasa', 'Food Festival', '5000+'], isFree: true, openTime: '19:00', mapsUrl: 'https://maps.google.com/?q=GBK+Senayan+Jakarta' },
  { id: 'jkt-2', name: 'Kopi Kenangan SCBD', city: 'jakarta', address: 'Pacific Place, SCBD', type: 'cafe', icon: '☕', tags: ['AC', 'Screen 4K', 'Indoor'], isFree: false, openTime: '21:00', mapsUrl: 'https://maps.google.com/?q=Pacific+Place+Jakarta' },
  { id: 'jkt-3', name: 'M Bloc Space', city: 'jakarta', address: 'Jl. Panglima Polim', type: 'outdoor', icon: '📽️', tags: ['Outdoor', 'Hip', 'Anak Muda'], isFree: true, openTime: '20:00', mapsUrl: 'https://maps.google.com/?q=M+Bloc+Space+Jakarta' },
  { id: 'sby-1', name: 'Taman Bungkul', city: 'surabaya', address: 'Jl. Raya Darmo', type: 'outdoor', icon: '🌳', tags: ['Gratis', 'Outdoor', 'LED'], isFree: true, openTime: '20:00', mapsUrl: 'https://maps.google.com/?q=Taman+Bungkul+Surabaya' },
  { id: 'sby-2', name: 'G-Walk Citraland', city: 'surabaya', address: 'G-Walk, Citraland', type: 'resto', icon: '🍽️', tags: ['Kuliner', 'Outdoor', 'Keluarga'], isFree: true, openTime: '19:30', mapsUrl: 'https://maps.google.com/?q=G-Walk+Citraland+Surabaya' },
  { id: 'bdg-1', name: 'Bandung Soccer Hub', city: 'bandung', address: 'Jl. Braga No.99', type: 'cafe', icon: '⚽', tags: ['Multi Screen', 'Live DJ'], isFree: false, openTime: '20:00', mapsUrl: 'https://maps.google.com/?q=Braga+Bandung' },
  { id: 'bdg-2', name: 'Alun-alun Bandung', city: 'bandung', address: 'Jl. Asia Afrika', type: 'outdoor', icon: '🏟️', tags: ['Gratis', 'Rumput', 'Pusat Kota'], isFree: true, openTime: '19:00', mapsUrl: 'https://maps.google.com/?q=Alun-alun+Bandung' },
  { id: 'mdn-1', name: 'Lapangan Merdeka', city: 'medan', address: 'Jl. Balai Kota', type: 'outdoor', icon: '🏟️', tags: ['Gratis', 'LED', 'Keluarga'], isFree: true, openTime: '19:30', mapsUrl: 'https://maps.google.com/?q=Lapangan+Merdeka+Medan' },
  { id: 'mks-1', name: 'Pantai Losari', city: 'makassar', address: 'Anjungan Pantai Losari', type: 'outdoor', icon: '🌊', tags: ['View Pantai', 'Gratis', 'Sunset'], isFree: true, openTime: '18:00', mapsUrl: 'https://maps.google.com/?q=Pantai+Losari+Makassar' },
  { id: 'smg-1', name: 'Kota Lama Semarang', city: 'semarang', address: 'Kawasan Kota Lama', type: 'outdoor', icon: '🏛️', tags: ['Heritage', 'Gratis', 'Food'], isFree: true, openTime: '20:00', mapsUrl: 'https://maps.google.com/?q=Kota+Lama+Semarang' },
]

export function getVenuesByCity(citySlug: string): NobarVenue[] {
  return VENUES.filter(v => v.city === citySlug)
}
