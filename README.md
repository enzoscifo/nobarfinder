# NobarFinder 📍⚽

Direktori tempat nonton bareng (nobar) terlengkap di Indonesia.

🔗 **Live:** [nobarfinder.com](https://nobarfinder.com)

## Fitur
- 🏙️ Halaman per-kota dengan URL bersih (`/yogyakarta`, `/jakarta`)
- 📄 Halaman detail per venue (SEO long-tail + Schema.org LocalBusiness)
- 📷 Upload foto venue (Vercel Blob) dengan moderasi
- 📨 Form pendaftaran → email moderasi ke java2borneo@gmail.com
- 🗺️ Usulan kota baru oleh pengunjung (dimoderasi)
- 🔍 Sitemap & robots.txt otomatis, OG image dinamis

## Tech Stack
- Next.js 16 (App Router, SSG)
- Tailwind CSS
- Vercel Blob (foto), Web3Forms (email moderasi)

## Environment Variables
```
WEB3FORMS_ACCESS_KEY=   # dari web3forms.com (email: java2borneo@gmail.com)
BLOB_READ_WRITE_TOKEN=  # otomatis saat buat Blob store di Vercel
```

## Moderasi Venue
Submission masuk ke email. Untuk approve: tambahkan venue ke `lib/data.ts` → `git push` (auto-deploy).
