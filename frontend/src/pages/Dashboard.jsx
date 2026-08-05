import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react'

export function Dashboard() {
  const sections = [
    {
      to: '/leaderboard',
      title: 'Deck Leaderboard',
      icon: Trophy,
      color: 'amber',
      gradientClass: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
      glowColor: 'rgba(245,158,11,0.15)',
      hoverBorder: 'hover:border-amber-500/30',
      description: 'Browse the top-performing Clash Royale decks ranked using Wilson score confidence intervals to filter out low-sample flukes.'
    },
    {
      to: '/cards',
      title: 'Card Analytics',
      icon: TrendingUp,
      color: 'emerald',
      gradientClass: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
      glowColor: 'rgba(16,185,129,0.15)',
      hoverBorder: 'hover:border-emerald-500/30',
      description: 'Inspect win rates, popularity, and meta tier ratings of all 123 cards to identify underrated gems and overrated traps.'
    },
    {
      to: '/evaluator',
      title: 'Deck Evaluator',
      icon: Sparkles,
      color: 'indigo',
      gradientClass: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
      glowColor: 'rgba(99,102,241,0.15)',
      hoverBorder: 'hover:border-indigo-500/30',
      description: 'Build a custom deck, set card levels, and calculate meta win probability with optimal single-card swap suggestions.'
    },
    {
      to: '/matchup',
      title: 'Matchup Predictor',
      icon: ShieldCheck,
      color: 'cyan',
      gradientClass: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
      glowColor: 'rgba(6,182,212,0.15)',
      hoverBorder: 'hover:border-cyan-500/30',
      description: 'Simulate head-to-head battles between two decks to predict win rate splits and identify key counter advantages.'
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-8 pt-2 pb-10 md:pt-4 md:pb-12"
    >
      
      {/* 1. Sleek Header Title */}
      <div className="space-y-3.5 text-center md:text-left max-w-3xl">
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-display uppercase leading-tight">
          Clash Royale <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Analysis Engine</span>
        </h2>
        
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
          A collection of machine learning synergy utilities trained on thousands of competitive 1v1 ladder battles. Choose a tool below to optimize card combos, evaluate counter matchups, or review current rankings.
        </p>
      </div>

      {/* 2. Premium 2x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec, idx) => {
          const Icon = sec.icon
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.005 }}
              key={sec.to}
              className="flex"
            >
              <Link
                to={sec.to}
                className={`relative flex flex-col justify-between w-full p-6 rounded-2xl bg-[#0c1220]/40 border border-slate-800/60 transition-all duration-300 group overflow-hidden ${sec.hoverBorder}`}
              >
                {/* Decorative background glow on hover */}
                <div 
                  className="absolute -right-16 -top-16 w-36 h-36 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none"
                  style={{ backgroundColor: sec.color === 'amber' ? 'rgba(245,158,11,0.15)' : sec.color === 'emerald' ? 'rgba(16,185,129,0.15)' : sec.color === 'indigo' ? 'rgba(99,102,241,0.15)' : 'rgba(6,182,212,0.15)' }}
                />

                <div className="space-y-4">
                  {/* Icon Block with subtle gradient and inner border */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border bg-gradient-to-b ${sec.gradientClass} transition-transform duration-300 group-hover:scale-110 shadow-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Text Description block */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold text-white tracking-tight font-display uppercase group-hover:text-yellow-500/90 transition-colors">
                      {sec.title}
                    </h3>
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                      {sec.description}
                    </p>
                  </div>
                </div>

                {/* Footer Link Button */}
                <div className="flex items-center gap-2 mt-6 pt-3 border-t border-slate-800/30 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors duration-300">
                  <span>Launch Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default Dashboard
