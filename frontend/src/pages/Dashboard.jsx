import React from 'react'
import { Link } from 'react-router-dom'
import { Crown, Trophy, TrendingUp, Zap, Search, Info } from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'

export function Dashboard() {
  const { data, loading, error, execute } = useApi(() => api.getAllData())

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />
  }

  if (error) {
    return (
      <ErrorDisplay
        message={error}
        onRetry={() => execute()}
      />
    )
  }

  if (!data) {
    return <ErrorDisplay message="No data available" />
  }

  const {
    battles_count,
    leaderboard,
    card_stats,
    model_loaded,
  } = data

  const topDeck = leaderboard?.[0]
  const mostPopularCard = card_stats?.sort(
    (a, b) => b.popularity - a.popularity
  )?.[0]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl gradient-text">
          Clash Royale Deck Analytics
        </h1>
        <p className="text-dark-400 mt-2">
          Scraped match statistics & confidence-adjusted rankings of decks using
          the official Clash Royale API.
        </p>
      </div>

      <div className="glass-card p-4 border-crown-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-crown-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">
              {model_loaded
                ? 'Model ready for deck evaluation and matchup prediction.'
                : 'The ML model is not currently loaded, so predictive features will be limited until the pipeline finishes training.'}
            </p>
            <p className="text-sm text-dark-400 mt-1">
              {card_stats?.length
                ? `${card_stats.length} cards and ${leaderboard?.length || 0} decks are ready to explore.`
                : 'The dataset is still empty. Run the pipeline to populate the scraped results and rankings.'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/leaderboard"
          className="glass-card p-4 hover:border-crown-500/30 transition-colors cursor-pointer group"
        >
          <Trophy className="w-6 h-6 text-crown-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-sm">Deck Leaderboard</h3>
          <p className="text-xs text-dark-400 mt-1">
            {leaderboard?.length || 0} decks ranked
          </p>
        </Link>

        <Link
          to="/cards"
          className="glass-card p-4 hover:border-crown-500/30 transition-colors cursor-pointer group"
        >
          <TrendingUp className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-sm">Card Analysis</h3>
          <p className="text-xs text-dark-400 mt-1">
            {card_stats?.length || 0} cards analyzed
          </p>
        </Link>

        <Link
          to="/evaluator"
          className="glass-card p-4 hover:border-crown-500/30 transition-colors cursor-pointer group"
        >
          <Sparkles className="w-6 h-6 text-crown-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-sm">Deck Evaluator</h3>
          <p className="text-xs text-dark-400 mt-1">
            Evaluate a deck with historical and predictive insights.
          </p>
        </Link>

        <Link
          to="/matchup"
          className="glass-card p-4 hover:border-crown-500/30 transition-colors cursor-pointer group"
        >
          <ShieldCheck className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-sm">Matchup Predictor</h3>
          <p className="text-xs text-dark-400 mt-1">
            Compare two decks and predict which one has the edge.
          </p>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Battles"
          value={battles_count?.toLocaleString() || '—'}
          icon="⚔️"
        />
        <MetricCard
          label="Decks Ranked"
          value={leaderboard?.length?.toLocaleString() || '—'}
          icon="🏆"
        />
        <MetricCard
          label="Top Deck Win Rate"
          value={
            topDeck
              ? `${(topDeck.win_rate * 100).toFixed(1)}%`
              : '—'
          }
          subtitle={`Rank #1: ${topDeck?.deck?.split(',').slice(0, 3).join(', ') || 'N/A'}...`}
          icon="⭐"
        />
        <MetricCard
          label="Most Popular Card"
          value={mostPopularCard?.card || '—'}
          subtitle={`${((mostPopularCard?.popularity || 0) * 100).toFixed(1)}% usage`}
          icon="🃏"
        />
      </div>

      {/* Model Status */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${model_loaded ? 'bg-green-400' : 'bg-red-400'}`}
          />
          <span className="text-sm">
            {model_loaded
              ? 'ML Model Loaded — Predictions Available'
              : 'ML Model Not Loaded — Train models first'}
          </span>
        </div>
        <Link
          to="/evaluator"
          className="text-sm text-crown-400 hover:text-crown-300 transition-colors"
        >
          Try Deck Evaluator →
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
