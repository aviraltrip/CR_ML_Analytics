import React from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const DASHBOARD_SECTIONS = [
  {
    to: '/leaderboard',
    title: 'Deck Leaderboard',
    image: '/mockups/leaderboard.jpg?v=3',
    description: 'Explore statistically validated deck performance rankings using Wilson interval scoring to filter out low-sample flukes.'
  },
  {
    to: '/cards',
    title: 'Card Analytics',
    image: '/mockups/cards.jpg?v=3',
    description: 'Inspect popularity Win Rate vs. Usage dynamics and meta ratings of all 123 Clash Royale cards.'
  },
  {
    to: '/evaluator',
    title: 'Deck Evaluator',
    image: '/mockups/evaluator.jpg?v=3',
    description: 'Build any custom deck and receive optimal single-card swap recommendations powered by our ML neural networks.'
  },
  {
    to: '/matchup',
    title: 'Matchup Predictor',
    image: '/mockups/matchup.jpg?v=3',
    description: 'Predict win rate splits and analyze key counter-matching advantages between any two custom decks.'
  }
]

export function Dashboard() {

  return (
    <m.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8 pt-2 pb-10"
    >
      
      
      <div className="space-y-3.5 text-center md:text-left max-w-3xl">
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-display uppercase leading-tight">
          Clash Royale <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Analysis Engine</span>
        </h2>
        
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
          A collection of machine learning synergy utilities trained on thousands of competitive 1v1 ladder battles. Choose a tool below to optimize card combos, evaluate counter matchups, or review current rankings.
        </p>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {DASHBOARD_SECTIONS.map((sec, idx) => (
          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            key={sec.to}
            className="flex"
          >
            <Link
              to={sec.to}
              className="relative flex flex-col w-full rounded-2xl bg-[#0c1220]/50 border border-slate-800/80 hover:border-indigo-500/30 shadow-xl transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] transform-gpu will-change-transform group overflow-hidden"
            >
              
              <div className="aspect-[16/10] w-full overflow-hidden bg-slate-950/40 relative border-b border-slate-800/40">
                <img 
                  src={sec.image} 
                  alt={sec.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out transform-gpu" 
                />
              </div>

              
              <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  
                  <h3 className="text-xs font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                    {sec.title}
                  </h3>

                  
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    {sec.description}
                  </p>
                </div>

                
                <div className="flex justify-end items-center pt-1">
                  <ArrowRight className="w-4 h-4 transition-all duration-300 group-hover:translate-x-1 text-slate-500 group-hover:text-indigo-400" />
                </div>
              </div>
            </Link>
          </m.div>
        ))}
      </div>
    </m.div>
  )
}

export default Dashboard
