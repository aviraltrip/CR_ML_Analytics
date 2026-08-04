import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Crown, 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  Flame,
  ArrowRight,
  Target,
  Sword,
  BookOpen
} from 'lucide-react'

export function Dashboard() {
  const sections = [
    {
      to: '/leaderboard',
      title: 'Deck Leaderboard',
      icon: Trophy,
      color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40',
      description: 'Explore the meta list. View the top-performing decks in Clash Royale ranked by statistical Wilson score confidence intervals to separate low-sample flukes from genuinely dominant decks.'
    },
    {
      to: '/cards',
      title: 'Card Analytics',
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 hover:border-emerald-400/40',
      description: 'Inspect the database of individual cards. Review use rates, win rates, and meta tier ratings (S to C) to identify overrated trap cards and discover underrated hidden gems.'
    },
    {
      to: '/evaluator',
      title: 'Deck Evaluator',
      icon: Sparkles,
      color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20 hover:border-indigo-400/40',
      description: 'Build your custom 8-card deck, assign card levels, and run predictive evaluations against the meta to estimate win probability and receive optimal single-card swap suggestions.'
    },
    {
      to: '/matchup',
      title: 'Matchup Predictor',
      icon: ShieldCheck,
      color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20 hover:border-cyan-400/40',
      description: 'Simulate head-to-head battle simulations between two custom decks. Predict win probabilities, analyze key advantages, and identify threat counters in the matchup.'
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-10 py-4 md:py-8"
    >
      
      {/* 1. Hero Welcome Intro */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="relative inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 mb-2">
          <Crown className="w-8 h-8 text-yellow-500 animate-pulse" />
          <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-md"></div>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-display">
          CLASH ROYALE META ANALYTICS
        </h2>
        
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Welcome to your ultimate Clash Royale assistant. Harnessing machine learning synergy models trained on thousands of high-level matches, this platform evaluates deck strengths, predicts matchups, and analyzes card effectiveness to give you the competitive edge.
        </p>
      </div>

      {/* Divider line */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>

      {/* 2. Interactive Feature Sections Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 text-center mb-6">
          App Utilities & Sections
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((sec, idx) => {
            const Icon = sec.icon
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
                whileHover={{ y: -3 }}
                key={sec.to}
                className={`glass-panel p-6 rounded-3xl border flex flex-col justify-between h-64 group relative overflow-hidden ${sec.color.split(' ').slice(2).join(' ')}`}
              >
                {/* Decorative background glow */}
                <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-slate-900/40 rounded-full blur-xl group-hover:bg-indigo-500/5 transition-colors duration-500"></div>

                <div className="space-y-3">
                  {/* Icon and title */}
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border ${sec.color.split(' ').slice(0, 2).join(' ')}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-base text-white tracking-tight">
                      {sec.title}
                    </h4>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {sec.description}
                  </p>
                </div>

                {/* Launch CTA */}
                <Link 
                  to={sec.to}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors mt-4 w-fit group/btn"
                >
                  Launch Service 
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

    </motion.div>
  )
}

export default Dashboard
