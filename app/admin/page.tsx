import { isAdmin } from '@/lib/auth'
import { getAllVenuesAdmin, getAllEventsAdmin, DB_ENABLED, getPendingClaims } from '@/lib/db'
import { LoginForm, AdminDashboard } from '@/components/AdminClient'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

export default async function AdminPage() {
  if (!DB_ENABLED) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAF9]">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-md text-center">
          <div className="text-3xl mb-3">⚙️</div>
          <h1 className="font-display font-black text-xl text-stone-900 mb-2">Database Belum Aktif</h1>
          <p className="text-sm text-stone-500">
            Buat Postgres database di Vercel (Storage → Create → Postgres), lalu redeploy.
            Variabel <code className="bg-stone-100 px-1 rounded">POSTGRES_URL</code> akan terisi otomatis.
          </p>
        </div>
      </div>
    )
  }

  if (!(await isAdmin())) return <LoginForm />

  const [venues, events, claims] = await Promise.all([
    getAllVenuesAdmin(),
    getAllEventsAdmin(),
    getPendingClaims(),
  ])

  return <AdminDashboard venues={venues} events={events} claims={claims} />
}
