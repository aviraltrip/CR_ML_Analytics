import React from 'react'
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

export function Dashboard() {
  const sections = [
    {
      to: '/leaderboard',
      title: 'Deck Leaderboard',
      icon: Trophy,
      colorClass: 'text-amber-400 border-amber-500/10 bg-amber-500/5',
      hoverBorder: 'hover:border-amber-500/20 hover:bg-amber-950/5',
      description: 'Browse the top-performing Clash Royale decks ranked using Wilson score confidence intervals to filter out low-sample flukes.'
    },
    {
      to: '/cards',
      title: 'Card Analytics',
      icon: TrendingUp,
      colorClass: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5',
      hoverBorder: 'hover:border-emerald-500/20 hover:bg-emerald-950/5',
      description: 'Inspect win rates, popularity, and meta tier ratings of all 122 cards to identify underrated gems and overrated traps.'
    },
    {
      to: '/evaluator',
      title: 'Deck Evaluator',
      icon: Sparkles,
      colorClass: 'text-indigo-400 border-indigo-500/10 bg-indigo-500/5',
      hoverBorder: 'hover:border-indigo-500/20 hover:bg-indigo-950/5',
      description: 'Build a custom deck, set card levels, and calculate meta win probability with optimal single-card swap suggestions.'
    },
    {
      to: '/matchup',
      title: 'Matchup Predictor',
      icon: ShieldCheck,
      colorClass: 'text-cyan-400 border-cyan-500/10 bg-cyan-500/5',
      hoverBorder: 'hover:border-cyan-500/20 hover:bg-cyan-950/5',
      description: 'Simulate head-to-head battles between two decks to predict win rate splits and identify key counter advantages.'
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-12 py-8 md:py-14"
    >
      
      {/* 1. Sleek Header Title */}
      <div className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-[10px] font-black uppercase tracking-wider text-yellow-500">
          <Crown className="w-3.5 h-3.5" />
          Meta Analytics Factory
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-display uppercase leading-tight">
          Clash Royale Analysis Engine
        </h2>
        
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
          A collection of machine learning synergy utilities trained on thousands of competitive 1v1 ladder battles. Choose a tool below to optimize card combos, evaluate counter matchups, or review current rankings.
        </p>
      </div>

      {/* 2. Minimalist Horizontal Stack */}
      <div className="space-y-3.5">
        {sections.map((sec, idx) => {
          const Icon = sec.icon
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              key={sec.to}
            >
              <Link
                to={sec.to}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-900/60 bg-slate-950/20 transition-all duration-300 group ${sec.hoverBorder}`}
              >
                
                {/* Left Side: Icon & Info */}
                <div className="flex items-start md:items-center gap-4 flex-1">
                  
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 transition-all duration-300 ${sec.colorClass}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-slate-200 group-hover:text-white transition-colors duration-300">
                      {sec.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-xl">
                      {sec.description}
                    </p>
                  </div>

                </div>

                {/* Right Side: Simple circular action button */}
                <div className="w-9 h-9 rounded-full border border-slate-900 bg-slate-950 flex items-center justify-center text-slate-500 transition-all duration-300 group-hover:text-white group-hover:border-slate-700 group-hover:translate-x-1 flex-shrink-0 self-end md:self-auto">
                  <ArrowRight className="w-4 h-4" />
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
