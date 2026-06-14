/**
 * lib/notify.ts
 * Helper notifikasi email via Web3Forms.
 *
 * Web3Forms mengirim ke email yang didaftarkan saat buat access key.
 * Field 'email' di payload = reply-to (bukan tujuan).
 *
 * Setup:
 * 1. Daftar di web3forms.com dengan email java2borneo@gmail.com
 * 2. Salin access key yang dikirim ke email
 * 3. Di Vercel: Settings → Environment Variables → WEB3FORMS_ACCESS_KEY = <key>
 *
 * Cek apakah email masuk / tidak: lihat dashboard web3forms.com
 * atau cek folder Spam di gmail.
 */

interface NotifyOptions {
  subject: string
  message: string
  replyTo?: string   // email/kontak pengirim (optional, untuk reply langsung)
}

export async function notify({ subject, message, replyTo }: NotifyOptions): Promise<boolean> {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY

  if (!accessKey) {
    console.warn('[notify] WEB3FORMS_ACCESS_KEY tidak diset — email tidak dikirim')
    return false
  }

  // botcheck harus boolean false (bukan string) agar tidak diblokir spam filter
  const payload = {
    access_key: accessKey,
    subject,
    from_name: 'NobarFinder',
    message,
    botcheck: false,           // boolean, bukan string "false"
    ...(replyTo ? { email: replyTo } : {}),
  }

  try {
    console.log('[notify] Mengirim ke Web3Forms, subject:', subject)
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    })

    // Log raw response text dulu sebelum parse JSON
    const text = await res.text()
    console.log('[notify] Web3Forms raw response:', res.status, text.slice(0, 300))

    let data: { success?: boolean; message?: string } = {}
    try { data = JSON.parse(text) } catch { /* bukan JSON */ }

    if (!res.ok || !data.success) {
      console.error('[notify] GAGAL:', res.status, data.message || text.slice(0, 200))
      return false
    }

    console.log('[notify] ✓ Email terkirim:', subject)
    return true
  } catch (e) {
    console.error('[notify] Fetch exception:', e)
    return false
  }
}
