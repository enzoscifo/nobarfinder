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

  const payload: Record<string, string> = {
    access_key: accessKey,
    subject,
    from_name: 'NobarFinder',
    message,
    // botcheck harus false agar tidak diblokir
    botcheck: 'false',
  }

  // Tambah reply-to jika ada kontak pengirim
  if (replyTo) payload.email = replyTo

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({ success: false }))

    if (!res.ok || !data.success) {
      console.error('[notify] Web3Forms error:', res.status, JSON.stringify(data))
      return false
    }

    console.log('[notify] Email terkirim:', subject)
    return true
  } catch (e) {
    console.error('[notify] Fetch error:', e)
    return false
  }
}
