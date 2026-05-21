'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import FundHubLogo from '@/components/FundHubLogo'
import Link from 'next/link'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/events', label: 'Events', icon: '📅' },
  { href: '/admin/import', label: 'Import Data', icon: '⬆' },
  { href: '/admin/results', label: 'Results', icon: '★' },
  { href: '/scan', label: 'Registration Scanner', icon: '⊙', external: true },
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setAuthed(sessionStorage.getItem('fh_admin') === '1')
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      sessionStorage.setItem('fh_admin', '1')
      setAuthed(true)
      setError('')
    } else {
      setError('Incorrect password. Please try again.')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen rating-gradient flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <FundHubLogo className="h-14 w-auto" variant="light" />
          </div>
          <div className="card">
            <h1 className="text-xl font-semibold text-navy-DEFAULT mb-1">Admin Access</h1>
            <p className="text-sm text-gray-500 mb-6">Enter your admin password to continue.</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-pink-brand">{error}</p>}
              <button type="submit" className="btn-primary w-full">Sign In</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 rating-gradient flex flex-col
        transform transition-transform duration-200 lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/10">
          <FundHubLogo className="h-10 w-auto" variant="light" />
          <p className="text-white/50 text-xs mt-2 font-medium tracking-wide uppercase">Event Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              target={item.external ? '_blank' : undefined}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => { sessionStorage.removeItem('fh_admin'); setAuthed(false) }}
            className="nav-link w-full text-left"
          >
            <span>→</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-4 p-4 bg-white border-b border-gray-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-navy-DEFAULT text-xl"
            aria-label="Open menu"
          >
            ☰
          </button>
          <FundHubLogo className="h-8 w-auto" />
        </header>
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
