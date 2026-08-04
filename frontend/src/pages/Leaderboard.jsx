import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  BrainCircuit, 
  Sparkles, 
  HelpCircle,
  TrendingUp, 
  Info,
  Flame,
  ArrowRight,
  ShieldAlert,
  Gauge,
  ShieldCheck
} from 'lucide-react'
import { CardImage } from '../components/CardImage'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'

// Helper to determine Clash Royale archetype and difficulty based on average elixir cost
function getDeckArchetype(avgElixir) {
  const elixir = parseFloat(avgElixir) || 3.5
  if (elixir < 3.0) return { archetype: 'Fast Cycle', difficulty: 'Hard', color: 'text-cyan-400' }
  if (elixir < 3.5) return { archetype: 'Fast Control', difficulty: 'Medium', color: 'text-indigo-400' }
  if (elixir < 4.0) return { archetype: 'Midrange Control', difficulty: 'Medium', color: 'text-yellow-500' }
  return { archetype: 'Heavy Beatdown', difficulty: 'Easy', color: 'text-red-400' }
}

// Helper to get meta tier based on leaderboard rank
function getMetaTier(rank) {
  const r = parseInt(rank) || 20
  if (r <= 5) return { name: 'S-TIER', color: 'bg-red-500/10 text-red-400 border-red-500/30' }
  if (r <= 12) return { name: 'A-TIER', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' }
  return { name: 'B-TIER', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' }
}

export function Leaderboard() {
  const navigate = useNavigate()
  const minGames = 5
  const [activeTab, setActiveTab] = useState('historical')
  
  // Fetch static data to calculate elixir costs dynamically
  const { data: allData } = useApi(() => api.getAllData())
  const cardElixirMap = allData?.card_elixir || {}

  const {
    data: histData,
    loading: histLoading,
    error: histError,
    execute: executeHist,
  } = useApi(() => api.getLeaderboard(minGames), false)

  const {
    data: mlData,
    loading: mlLoading,
    error: mlError,
    execute: executeMl,
  } = useApi(() => api.getModelLeaderboard(minGames), false)

  // Fetch when tab or minGames filter changes
  useEffect(() => {
    if (activeTab === 'historical') {
      executeHist()
    } else {
      executeMl()
    }
  }, [activeTab, minGames, executeHist, executeMl])

  const formatWinRate = (val) => `${(val * 100).toFixed(1)}%`
  const activeRows = activeTab === 'historical'
    ? histData?.leaderboard || []
    : mlData?.model_leaderboard || []

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      
      {/* 1. Toggle Controls & Header */}
      <div className="flex justify-start">
        {/* Tab Buttons */}
        <div className="flex p-1 bg-slate-900/60 border border-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('historical')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
              activeTab === 'historical'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Historical (Wilson Score)
          </button>
          <button
            onClick={() => setActiveTab('ml')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
              activeTab === 'ml'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            ML-Predicted (Synergy)
          </button>
        </div>
      </div>

      {/* Info card describing the current ranking metric */}
      <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-semibold text-slate-200">
            {activeTab === 'historical' 
              ? 'Ranked using Wilson Score Confidence Interval lower bounds.' 
              : 'Ranked using Expected Win Rates simulated by the Machine Learning Synergy model.'}
          </p>
          <p className="text-slate-400 mt-1">
            {activeTab === 'historical'
              ? 'This approach penalizes low-sample sizes (e.g. a deck with 2 wins and 0 losses is ranked lower than a deck with 35 wins and 10 losses) to provide mathematically verified meta lists.'
              : 'Our neural/regression classifiers evaluate how the card synergies of these decks interact against all other meta decks in a simulated round-robin tournament.'}
          </p>
        </div>
      </div>

      {/* Loading States */}
      {(histLoading || mlLoading) && <LoadingSpinner message="Re-calculating meta rankings..." />}

      {/* Error Displays */}
      {histError && activeTab === 'historical' && (
        <ErrorDisplay message={histError} onRetry={() => executeHist()} />
      )}
      {mlError && activeTab === 'ml' && (
        <ErrorDisplay message={mlError} onRetry={() => executeMl()} />
      )}

      {/* Grid of Decks */}
      <AnimatePresence mode="wait">
        {!histLoading && !mlLoading && activeRows.length > 0 && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {activeRows.map((row, index) => {
              const cardsList = row.deck?.split(',') || []
              const rankVal = activeTab === 'historical' ? row.Rank : row.Predictive_Rank
              
              // Dynamically calculate average elixir cost from the cardElixirMap
              const costs = cardsList.map(c => cardElixirMap[c] || 3.5)
              const elixirCost = costs.reduce((sum, val) => sum + val, 0) / (cardsList.length || 1)
              
              const { archetype, difficulty, color: arcColor } = getDeckArchetype(elixirCost)
              const metaTier = getMetaTier(rankVal)

              return (
                <div
                  key={row.deck + rankVal}
                  className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300 relative border-l-4 border-l-indigo-500/60"
                >
                  
                  {/* Deck Header: Rank and statistics */}
                  <div className="flex justify-between items-start border-b border-slate-800/40 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black font-mono text-indigo-400">
                        #{rankVal}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${metaTier.color}`}>
                            {metaTier.name}
                          </span>
                          <span className={`text-[10px] font-bold ${arcColor}`}>
                            {archetype}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                          Difficulty: {difficulty}
                        </p>
                      </div>
                    </div>
                    
                  </div>

                  {/* Deck Cards Grid (4x2 layout) */}
                  <div className="grid grid-cols-4 gap-2.5 max-w-sm">
                    {cardsList.map((card) => (
                      <CardImage
                        key={card}
                        name={card}
                        showName={false}
                        className="h-16 w-12"
                      />
                    ))}
                  </div>

                  {/* Deck Footer Actions */}
                  <div className="flex items-center justify-end border-t border-slate-800/30 pt-4 mt-4 text-xs font-semibold text-slate-400">
                    {/* Navigation Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/evaluator?deck=${encodeURIComponent(row.deck)}`)}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Evaluate
                      </button>
                      <button
                        onClick={() => navigate(`/matchup?deck1=${encodeURIComponent(row.deck)}`)}
                        className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Compare
                      </button>
                    </div>
                  </div>

                </div>
              )
            })}
          </motion.div>
        )}

        {/* Empty States */}
        {!histLoading && !mlLoading && activeRows.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center rounded-2xl border border-slate-800 max-w-lg mx-auto"
          >
            <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">No Decks Match Filters</h3>
            <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
              No decks meet the requirement of having at least {minGames} matches played. Try lowering the match threshold slider.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

export default Leaderboard
