import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Trophy, 
  BarChart3, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  BrainCircuit,
  Menu,
  X
} from 'lucide-react'
import { api } from '../services/api'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/leaderboard', label: 'Deck Leaderboard', icon: Trophy },
  { path: '/cards', label: 'Card Analytics', icon: BarChart3 },
  { path: '/evaluator', label: 'Deck Evaluator', icon: Sparkles },
  { path: '/matchup', label: 'Matchup Predictor', icon: ShieldCheck },
]

export function Layout({ children }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [status, setStatus] = useState({ online: false, modelLoaded: false, loading: true })

  useEffect(() => {
    
    api.health()
      .then((res) => {
        setStatus({
          online: true,
          modelLoaded: !!res.model_loaded,
          loading: false
        })
      })
      .catch(() => {
        setStatus({
          online: false,
          modelLoaded: false,
          loading: false
        })
      })
  }, [])

  
  const activeItem = navItems.find((item) => item.path === location.pathname) || navItems[0]

  return (
    <div className="flex min-h-screen bg-[#070b13] text-slate-100 overflow-x-hidden">
      
      
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#0c1220] border-r border-slate-800/60 z-30 justify-between">
        <div>
          
          <div className="h-20 flex items-center px-6 border-b border-slate-800/40 gap-3">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-indigo-500/15 blur-md rounded-full"></div>
              <img src="/logo.png" alt="Royale Analytics Logo" className="w-9 h-9 object-contain relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm tracking-wider text-yellow-500 font-mono">
                ROYALE
              </span>
              <span className="font-extrabold text-sm tracking-tight text-white -mt-1">
                Analytics
              </span>
              <span className="text-[9px] font-semibold text-slate-500 tracking-tight leading-none mt-1.5 max-w-[150px]">
                ML Matchup & Deck Assistant
              </span>
            </div>
          </div>

          
          <nav className="p-4 space-y-1.5 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all group overflow-hidden"
                >
                  
                  {isActive && (
                    <m.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-indigo-600/10 border-l-[3px] border-indigo-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 z-10 ${
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'
                  }`} />
                  
                  <span className={`z-10 transition-colors duration-300 ${
                    isActive ? 'text-white font-bold' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        
        <div className="p-4 border-t border-slate-800/40 bg-slate-950/20 space-y-3.5">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                API Server
              </span>
              {status.loading ? (
                <span className="h-2 w-2 rounded-full bg-slate-500 animate-pulse"></span>
              ) : status.online ? (
                <span className="text-emerald-400 font-bold">
                  ONLINE
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                  OFFLINE
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-slate-500" />
                ML Synergy
              </span>
              {status.loading ? (
                <span className="h-2 w-2 rounded-full bg-slate-500 animate-pulse"></span>
              ) : status.modelLoaded ? (
                <span className="text-cyan-400 font-bold tracking-wider">LOADED</span>
              ) : (
                <span className="text-red-400 font-bold tracking-wider">MISSING</span>
              )}
            </div>
          </div>

        </div>
      </aside>

      
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        
        <header className="h-20 border-b border-slate-800/40 bg-[#070b13]/85 backdrop-blur-md flex items-center justify-between px-6 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-white leading-none">
                {activeItem.label}
              </h1>

            </div>
          </div>

          
          <div className="flex items-center gap-3">

            
            <div className="lg:hidden flex items-center gap-2 bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-800">
              <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
              <span className="text-xs font-black text-white">CR</span>
            </div>
          </div>
        </header>

        
        <AnimatePresence>
          {mobileMenuOpen && (
            <m.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed top-20 left-0 right-0 bg-[#0c1220] border-b border-slate-800 z-30 shadow-2xl p-4 flex flex-col gap-2"
            >
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-indigo-600/10 border-l-4 border-indigo-500 text-white' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0c1220]/95 backdrop-blur-lg border-t border-slate-800/80 z-30 flex justify-around py-3 px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 text-center"
            >
              <div className={`p-1 rounded-md transition-all ${
                isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-bold ${
                isActive ? 'text-white' : 'text-slate-500'
              }`}>
                {item.label.split(' ')[0]}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default Layout
