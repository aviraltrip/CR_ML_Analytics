import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Crown, 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  Info,
  Sword,
  Target,
  LineChart as LineIcon,
  Flame
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { MetricCard } from '../components/MetricCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'

export function Dashboard() {
  const { data, loading, error, execute } = useApi(() => api.getAllData())

  if (loading) {
    return <LoadingSpinner message="Analyzing battle logs..." />
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={() => execute()} />
  }

  if (!data) {
    return <ErrorDisplay message="No Clash Royale logs could be retrieved." />
  }

  const {
    battles_count,
    leaderboard,
    card_stats,
    model_loaded,
  } = data

  const topDeck = leaderboard?.[0]
  
  // Sort and filter card stats
  const sortedCardStats = [...(card_stats || [])].sort((a, b) => b.popularity - a.popularity)
  const mostPopularCard = sortedCardStats?.[0]

  // Prepare chart data for Deck matches (Top 5)
  const chartDecks = (leaderboard || [])
    .slice(0, 5)
    .map((deck, idx) => {
      // Split cards names and get first 3 to show in chart label
      const shortLabel = deck.deck
        .split(',')
        .slice(0, 2)
        .join(' + ')
      return {
        name: `Deck #${idx + 1}`,
        fullName: deck.deck.split(',').join(' | '),
        matches: deck.matches_played,
        winRate: Math.round(deck.win_rate * 100),
        cards: shortLabel
      }
    })

  // Prepare chart data for top cards (Top 6)
  const chartCards = sortedCardStats
    .slice(0, 6)
    .map(card => ({
      name: card.card,
      usage: Math.round(card.popularity * 100),
      winRate: Math.round(card.win_rate * 100)
    }))

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      
      {/* 1. Hero Overview Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#0c1220] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Background gradient decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 w-fit">
            <Flame className="w-3.5 h-3.5" />
            Meta Version 1.0.0
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Royale Meta Laboratory
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
            Statistically-proven deck rankings, synergy predictions, and card metrics trained on historical 1v1 ladder battles. 
          </p>
        </div>

        {/* Model Ready Notification */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 max-w-sm">
          <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold text-white leading-none">
              {model_loaded ? 'Predictive Inference Active' : 'Model Training Offline'}
            </h4>
            <p className="text-slate-400 mt-1.5 leading-normal">
              {model_loaded 
                ? 'ML Models successfully compiled. Swap evaluation and matchup prediction matrices are live.' 
                : 'Prediction endpoints are unavailable. Please train models to activate simulations.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Battles"
          value={battles_count?.toLocaleString() || '—'}
          icon={Sword}
          trend={{ value: "+4.1% load", positive: true }}
          subtitle="Processed battle logs"
        />
        <MetricCard
          label="Decks Ranked"
          value={leaderboard?.length?.toLocaleString() || '—'}
          icon={Trophy}
          subtitle="Unique decks compiled"
        />
        <MetricCard
          label="Top Deck Win Rate"
          value={topDeck ? `${(topDeck.win_rate * 100).toFixed(1)}%` : '—'}
          icon={Target}
          trend={{ value: "Rank #1", positive: true }}
          subtitle={topDeck ? `${topDeck.wins}W / ${topDeck.losses}L` : 'N/A'}
        />
        <MetricCard
          label="Most Popular Card"
          value={mostPopularCard?.card || '—'}
          icon={Flame}
          trend={{ value: `${((mostPopularCard?.popularity || 0) * 100).toFixed(0)}% Use`, positive: true }}
          subtitle="Meta definition card"
        />
      </div>

      {/* 3. Recharts Graphics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Top Deck Popularity */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between h-96">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Deck Popularity
              </span>
              <LineIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <h4 className="text-sm font-bold text-white mt-1">
              Top Ranked Decks by Matches Played
            </h4>
          </div>

          <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDecks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0c1220', 
                    borderColor: '#1e293b',
                    borderRadius: '12px' 
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                  formatter={(value, name, props) => [
                    `${value} matches (WR: ${props.payload.winRate}%)`, 
                    'Matches'
                  ]}
                />
                <Bar dataKey="matches" radius={[6, 6, 0, 0]}>
                  {chartDecks.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#f1c40f' : '#6366f1'} 
                      opacity={1 - index * 0.15}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Top Card Usage */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between h-96">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Card Usage Metrics
              </span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <h4 className="text-sm font-bold text-white mt-1">
              Popularity Percentage of Top Cards
            </h4>
          </div>

          <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCards} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0c1220', 
                    borderColor: '#1e293b',
                    borderRadius: '12px' 
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                  formatter={(value) => [`${value}% popularity`, 'Usage Rate']}
                />
                <Bar dataKey="usage" radius={[0, 6, 6, 0]}>
                  {chartCards.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="#06b6d4" 
                      opacity={1 - index * 0.12}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Sleek Quick Action Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        
        <Link to="/leaderboard" className="glass-card p-5 rounded-2xl group flex flex-col justify-between h-36">
          <Trophy className="w-6 h-6 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />
          <div>
            <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">
              Leaderboards
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Check out the {leaderboard?.length || 0} meta decks ranked by Wilson confidence score.
            </p>
          </div>
        </Link>

        <Link to="/cards" className="glass-card p-5 rounded-2xl group flex flex-col justify-between h-36">
          <TrendingUp className="w-6 h-6 text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
          <div>
            <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">
              Card Analytics
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Analyze use rates, win rates, and meta ratings of all {card_stats?.length || 0} cards.
            </p>
          </div>
        </Link>

        <Link to="/evaluator" className="glass-card p-5 rounded-2xl group flex flex-col justify-between h-36">
          <Sparkles className="w-6 h-6 text-indigo-400 transition-transform duration-300 group-hover:scale-110" />
          <div>
            <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">
              Deck Evaluator
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Build your custom deck and run predictive simulations to find optimal swaps.
            </p>
          </div>
        </Link>

        <Link to="/matchup" className="glass-card p-5 rounded-2xl group flex flex-col justify-between h-36">
          <ShieldCheck className="w-6 h-6 text-cyan-400 transition-transform duration-300 group-hover:scale-110" />
          <div>
            <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">
              Matchup Predictor
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Simulate battles between two custom decks and analyze card interactions.
            </p>
          </div>
        </Link>
      </div>

    </motion.div>
  )
}

export default Dashboard
