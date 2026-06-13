import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'NobarFinder — Cari Tempat Nonton Bareng di Indonesia'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#FAFAF9',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 20 }}>📍⚽</div>
        <div style={{ display: 'flex', fontSize: 130, fontWeight: 900, letterSpacing: -4, lineHeight: 1 }}>
          <span style={{ color: '#1c1917' }}>NOBAR</span>
          <span style={{ color: '#15803d' }}>FINDER</span>
        </div>
        <div style={{ fontSize: 32, color: '#78716c', marginTop: 24 }}>
          Cari Tempat Nonton Bareng di Indonesia
        </div>
        <div style={{
          marginTop: 40, fontSize: 22, color: '#15803d', fontWeight: 600,
          background: '#dcfce7', padding: '10px 28px', borderRadius: 100,
        }}>
          nobarfinder.com
        </div>
      </div>
    ),
    { ...size }
  )
}
