import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const DEMO = import.meta.env.VITE_DEMO === '1'

export function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: Location })?.from?.pathname || '/'
  if (user) navigate(from, { replace: true })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(username, password)
    setLoading(false)
    if (error) setError(error)
    else navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <div className="text-4xl">📦</div>
          <h1 className="mt-2 text-xl font-bold text-brand-dark">ระบบจัดการทรัพย์สิน</h1>
          <p className="text-sm text-gray-500">ยืม–คืน–ตรวจนับอุปกรณ์</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">ชื่อผู้ใช้</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label">รหัสผ่าน</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {DEMO && (
          <p className="mt-4 text-center text-xs text-gray-400">
            โหมดสาธิต — พิมพ์อะไรก็เข้าได้ (สิทธิ์แอดมิน)
          </p>
        )}
      </div>
    </div>
  )
}
