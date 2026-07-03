import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { roleLabels } from '@/lib/labels'
import type { UserRole } from '@/types/database'

interface NavItem {
  to: string
  label: string
  icon: string
  roles?: UserRole[] // ถ้าไม่ระบุ = ทุก role เห็นได้
}

const navItems: NavItem[] = [
  { to: '/', label: 'แดชบอร์ด', icon: '📊' },
  { to: '/shops', label: 'ร้านค้า', icon: '🏪' },
  { to: '/assets', label: 'ทรัพย์สิน', icon: '📦' },
  { to: '/loans', label: 'ใบยืม', icon: '📄' },
  { to: '/movements', label: 'เคลื่อนย้าย', icon: '🔁' },
  { to: '/audit', label: 'ตรวจนับ', icon: '📋' },
  { to: '/approvals', label: 'อนุมัติ', icon: '✅', roles: ['admin'] },
  { to: '/reports', label: 'รายงาน', icon: '📈', roles: ['admin', 'executive'] },
]

export function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  )

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (เดสก์ท็อป) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <Brand />
        <nav className="flex-1 space-y-1 p-3">
          {visibleItems.map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
        </nav>
        <UserBox onSignOut={handleSignOut} />
      </aside>

      <div className="flex flex-1 flex-col">
        {/* หัวบนมือถือ */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <Brand compact />
          <button
            className="btn-secondary !min-h-touch !px-3"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="เมนู"
          >
            ☰
          </button>
        </header>

        {menuOpen && (
          <div className="border-b border-gray-200 bg-white p-3 md:hidden">
            <div className="space-y-1">
              {visibleItems.map((item) => (
                <SideLink key={item.to} item={item} onClick={() => setMenuOpen(false)} />
              ))}
            </div>
            <UserBox onSignOut={handleSignOut} />
          </div>
        )}

        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
          <Outlet />
        </main>

        {/* Bottom nav (มือถือ) — ปุ่มใหญ่ แตะง่ายหน้างาน */}
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-gray-200 bg-white md:hidden">
          {visibleItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-h-touch flex-col items-center justify-center gap-0.5 py-2 text-xs ${
                  isActive ? 'text-brand font-semibold' : 'text-gray-500'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'border-b border-gray-200 p-4'}`}>
      <span className="text-2xl">📦</span>
      <div className="leading-tight">
        <div className="font-semibold text-brand-dark">จัดการทรัพย์สิน</div>
        {!compact && <div className="text-xs text-gray-500">ระบบยืม–คืนอุปกรณ์</div>}
      </div>
    </div>
  )
}

function SideLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex min-h-touch items-center gap-3 rounded-lg px-3 py-2 text-sm ${
          isActive
            ? 'bg-brand/10 font-semibold text-brand-dark'
            : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      <span className="text-lg">{item.icon}</span>
      {item.label}
    </NavLink>
  )
}

function UserBox({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useAuth()
  return (
    <div className="border-t border-gray-200 p-3">
      <div className="mb-2 px-1">
        <div className="truncate text-sm font-medium">{user?.full_name ?? user?.username}</div>
        <div className="text-xs text-gray-500">{user ? roleLabels[user.role] : ''}</div>
      </div>
      <button className="btn-secondary w-full" onClick={onSignOut}>
        ออกจากระบบ
      </button>
    </div>
  )
}
