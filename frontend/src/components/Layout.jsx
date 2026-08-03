import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Crown, Home, Trophy, BarChart3 } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/cards', label: 'Card Analysis', icon: BarChart3 },
]

export function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-dark-200/20 bg-dark-50/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-crown-400" />
              <span className="font-display font-extrabold text-xl gradient-text">
                CR Deck Analytics
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-crown-500/10 text-crown-400'
                        : 'text-dark-400 hover:text-white hover:bg-dark-50/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-dark-200/20 overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-crown-500/10 text-crown-400'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-200/20 py-6 text-center text-sm text-dark-400">
        <p>Clash Royale Deck Analytics — Powered by ML Synergy Models</p>
      </footer>
    </div>
  )
}

export default Layout
