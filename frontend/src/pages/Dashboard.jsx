import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Crown, 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react'

// Sub-component for individual spotlight dashboard cards
function DashboardCard({ sec, index }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  
  const handleMouseMove = (e) => {
    const { left, top } = e.currentTarget.getBoundingClientRect()
    setCoords({
      x: e.clientX - left,
      y: e.clientY - top
    })
  }

  const Icon = sec.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link
        to={sec.to}
        onMouseMove={handleMouseMove}
        className="relative flex flex-col justify-between h-[280px] p-8 rounded-[24px] border border-slate-800 bg-[#070c17]/90 hover:border-slate-700/80 transition-colors duration-300 group overflow-hidden"
      >
        {/* Dynamic spotlight glow following mouse cursor */}
        <div
          className="pointer-events-none absolute -inset-px rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
          style={{
            background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, ${sec.glowColor}, transparent 80%)`
          }}
        />

        {/* Card Content Wrapper */}
        <div className="space-y-4 relative z-10">
          
          {/* Neon Icon Container */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border bg-slate-950/80 transition-transform duration-300 group-hover:scale-105 ${sec.iconTheme}`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="space-y-2">
            {/* Title */}
            <h4 className="text-lg font-black text-white tracking-tight font-display transition-colors duration-300 group-hover:text-indigo-200">
              {sec.title}
            </h4>

            {/* Description */}
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {sec.description}
            </p>
          </div>

        </div>

        {/* Action Button Pill */}
        <div className="relative z-10 mt-6 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all duration-300 ${sec.btnTheme}`}>
            Launch Tool
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>

      </Link>
    </motion.div>
  )
}

export function Dashboard() {
  const sections = [
    {
      to: '/leaderboard',
      title: 'Deck Leaderboard',
      icon: Trophy,
      glowColor: 'rgba(234, 179, 8, 0.08)',
      iconTheme: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
      btnTheme: 'text-yellow-400 bg-yellow-950/30 border-yellow-500/20 group-hover:bg-yellow-500 group-hover:text-slate-950 group-hover:border-transparent',
      description: 'Explore the meta list. View the top-performing decks in Clash Royale ranked by statistical Wilson score confidence intervals to separate low-sample flukes from genuinely dominant decks.'
    },
    {
      to: '/cards',
      title: 'Card Analytics',
      icon: TrendingUp,
      glowColor: 'rgba(16, 185, 129, 0.08)',
      iconTheme: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
      btnTheme: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:border-transparent',
      description: 'Inspect the database of individual cards. Review use rates, win rates, and meta tier ratings (S to C) to identify overrated trap cards and discover underrated gems.'
    },
    {
      to: '/evaluator',
      title: 'Deck Evaluator',
      icon: Sparkles,
      glowColor: 'rgba(99, 102, 241, 0.08)',
      iconTheme: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
      btnTheme: 'text-indigo-400 bg-indigo-950/30 border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-transparent',
      description: 'Build your custom 8-card deck, assign card levels, and run predictive evaluations against the meta to estimate win probability and receive optimal single-card swap suggestions.'
    },
    {
      to: '/matchup',
      title: 'Matchup Predictor',
      icon: ShieldCheck,
      glowColor: 'rgba(6, 182, 212, 0.08)',
      iconTheme: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
      btnTheme: 'text-cyan-400 bg-cyan-950/30 border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-transparent',
      description: 'Simulate head-to-head battle simulations between two custom decks. Predict win probabilities, analyze key advantages, and identify threat counters in the matchup.'
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-12 py-6 md:py-10"
    >
      
      {/* Hero Welcome Intro */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="relative inline-flex items-center justify-center p-3.5 bg-yellow-500/10 rounded-full border border-yellow-500/20 text-yellow-500 mb-2">
          <Crown className="w-9 h-9 animate-pulse" />
          <div className="absolute inset-0 bg-yellow-500/5 rounded-full blur-md"></div>
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display uppercase">
          CLASH ROYALE META ANALYTICS
        </h2>
        
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Welcome to your ultimate Clash Royale assistant. Harnessing machine learning synergy models trained on thousands of high-level matches, this platform evaluates deck strengths, predicts matchups, and analyzes card effectiveness to give you the competitive edge.
        </p>
      </div>

      {/* Decorative Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>

      {/* Interactive Spotlight Cards Grid */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((sec, idx) => (
            <DashboardCard 
              key={sec.to}
              sec={sec}
              index={idx}
            />
          ))}
        </div>
      </div>

    </motion.div>
  )
}

export default Dashboard
