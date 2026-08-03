import React, { useState } from 'react'
import { MetricCard } from '../components/MetricCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { DeckBadge } from '../components/DeckBadge'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'

export function Leaderboard() {
  const [minGames, setMinGames] = useState(5)
  const [activeTab, setActiveTab] = useState('historical')

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

  // Load data when tab changes or minGames changes
  React.useEffect(() => {
    if (activeTab === 'historical') {
      executeHist()
    } else {
      executeMl()
    }
  }, [activeTab, minGames, executeHist, executeMl])

  const formatWinRate = (val) => `${(val * 100).toFixed(1)}%`
  const formatScore = (val) => val.toFixed(3)
  const activeRows = activeTab === 'historical'
    ? histData?.leaderboard || []
    : mlData?.model_leaderboard || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl gradient-text">
          Deck Leaderboard
        </h1>
        <p className="text-dark-400 mt-1">
          Ranked decks by win rate confidence and ML-predicted synergy.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('historical')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'historical'
                ? 'bg-crown-500/20 text-crown-400 border border-crown-500/30'
                : 'bg-dark-50/50 text-dark-400 border border-dark-200/20 hover:text-white'
            }`}
          >
            Historical (Wilson Score)
          </button>
          <button
            onClick={() => setActiveTab('ml')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'ml'
                ? 'bg-crown-500/20 text-crown-400 border border-crown-500/30'
                : 'bg-dark-50/50 text-dark-400 border border-dark-200/20 hover:text-white'
            }`}
          >
            ML-Predicted (Synergy)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-dark-400">Min Matches:</label>
          <input
            type="range"
            min="2"
            max="20"
            value={minGames}
            onChange={(e) => setMinGames(Number(e.target.value))}
            className="w-24 accent-crown-500"
          />
          <span className="text-sm font-mono text-crown-400 w-8">
            {minGames}
          </span>
        </div>
      </div>

      {/* Loading */}
      {(histLoading || mlLoading) && <LoadingSpinner message="Loading leaderboard..." />}

      {/* Errors */}
      {histError && activeTab === 'historical' && (
        <ErrorDisplay message={histError} onRetry={() => executeHist()} />
      )}
      {mlError && activeTab === 'ml' && (
        <ErrorDisplay message={mlError} onRetry={() => executeMl()} />
      )}

      {/* Historical Leaderboard */}
      {activeTab === 'historical' && histData && (
        <div className="space-y-6">
          <p className="text-sm text-dark-400">
            Ranked by <strong>Wilson Score Lower Bound</strong> — prevents
            low-sample flukes from dominating.
          </p>

          {activeRows.length > 0 ? (
            <div className="table-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-200/20 text-dark-400 uppercase text-xs">
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Wilson Score</th>
                    <th className="px-4 py-3 text-left">Win Rate</th>
                    <th className="px-4 py-3 text-left">Matches</th>
                    <th className="px-4 py-3 text-left">W</th>
                    <th className="px-4 py-3 text-left">L</th>
                    <th className="px-4 py-3 text-left">Deck</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((row) => (
                    <tr
                      key={row.Rank}
                      className="border-b border-dark-200/10 hover:bg-dark-50/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-crown-400">
                        #{row.Rank}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {formatScore(row.wilson_score)}
                      </td>
                      <td className="px-4 py-3">
                        {formatWinRate(row.win_rate)}
                      </td>
                      <td className="px-4 py-3">{row.matches_played}</td>
                      <td className="px-4 py-3 text-green-400">{row.wins}</td>
                      <td className="px-4 py-3 text-red-400">{row.losses}</td>
                      <td className="px-4 py-3">
                        <DeckBadge cards={row.deck?.split(',') || []} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-white font-semibold">No historical deck data is available yet.</p>
              <p className="text-sm text-dark-400 mt-1">
                Try lowering the minimum-match threshold or re-running the scraper pipeline to refresh the dataset.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ML Leaderboard */}
      {activeTab === 'ml' && mlData && (
        <div className="space-y-6">
          <p className="text-sm text-dark-400">
            Ranked by <strong>Expected Win Rate</strong> against the meta,
            simulated using the trained MLP Synergy Model.
          </p>

          {activeRows.length > 0 ? (
            <div className="table-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-200/20 text-dark-400 uppercase text-xs">
                    <th className="px-4 py-3 text-left">ML Rank</th>
                    <th className="px-4 py-3 text-left">Simulated WR</th>
                    <th className="px-4 py-3 text-left">Avg Elixir</th>
                    <th className="px-4 py-3 text-left">Hist. WR</th>
                    <th className="px-4 py-3 text-left">Matches</th>
                    <th className="px-4 py-3 text-left">Deck</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((row) => (
                    <tr
                      key={row.Predictive_Rank}
                      className="border-b border-dark-200/10 hover:bg-dark-50/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-crown-400">
                        #{row.Predictive_Rank}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {formatWinRate(row.simulated_win_rate)}
                      </td>
                      <td className="px-4 py-3">{row.elixir_cost?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {formatWinRate(row.win_rate)}
                      </td>
                      <td className="px-4 py-3">{row.matches_played}</td>
                      <td className="px-4 py-3">
                        <DeckBadge cards={row.deck?.split(',') || []} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-white font-semibold">No ML predictions are available yet.</p>
              <p className="text-sm text-dark-400 mt-1">
                Train the model and rerun the pipeline to populate the predictive leaderboard.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Leaderboard
