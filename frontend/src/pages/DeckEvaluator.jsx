import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, Search, HelpCircle, ArrowRight } from 'lucide-react'
import { DeckSelector } from '../components/DeckSelector'
import { DataTable } from '../components/DataTable'
import { MetricCard } from '../components/MetricCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { STATUS_COLORS, DEFAULT_CARD_LEVEL } from '../utils/constants'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'

export function DeckEvaluator() {
  const { data: cardStatsData, loading: statsLoading, error: statsError } = useApi(() => api.getCardStats())
  const [selectedCards, setSelectedCards] = useState([])
  const [levels, setLevels] = useState({})

  const [evalData, setEvalData] = useState(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const [evalError, setEvalError] = useState(null)

  const [swapsData, setSwapsData] = useState(null)
  const [swapsLoading, setSwapsLoading] = useState(false)
  const [swapsError, setSwapsError] = useState(null)

  const cardStats = cardStatsData?.card_stats || []
  const allCardsList = cardStats.map((c) => c.card).sort()

  // Initialize levels when cards are selected
  useEffect(() => {
    const newLevels = { ...levels }
    let changed = false
    selectedCards.forEach((card) => {
      if (!(card in newLevels)) {
        newLevels[card] = DEFAULT_CARD_LEVEL
        changed = true
      }
    })
    // Remove unselected cards from levels
    Object.keys(newLevels).forEach((card) => {
      if (!selectedCards.includes(card)) {
        delete newLevels[card]
        changed = true
      }
    })
    if (changed) {
      setLevels(newLevels)
    }
  }, [selectedCards])

  // Run evaluation when 8 cards are selected and levels change
  useEffect(() => {
    if (selectedCards.length === 8) {
      const evaluate = async () => {
        setEvalLoading(true)
        setEvalError(null)
        try {
          const res = await api.evaluateDeck({
            cards: selectedCards,
            levels,
          })
          setEvalData(res)
        } catch (err) {
          setEvalError(err.response?.data?.detail || err.message || 'Failed to evaluate deck')
        } finally {
          setEvalLoading(false)
        }
      }
      evaluate()
      setSwapsData(null) // Reset swaps on deck change
    } else {
      setEvalData(null)
      setSwapsData(null)
    }
  }, [selectedCards, levels])

  const handleFindSwaps = async () => {
    setSwapsLoading(true)
    setSwapsError(null)
    try {
      const res = await api.findSwaps({
        cards: selectedCards,
        levels,
      })
      setSwapsData(res)
    } catch (err) {
      setSwapsError(err.response?.data?.detail || err.message || 'Failed to find swaps')
    } finally {
      setSwapsLoading(false)
    }
  }

  // Get selected cards detailed stats
  const selectedStats = cardStats
    .filter((c) => selectedCards.includes(c.card))
    .sort((a, b) => b.win_rate - a.win_rate)

  const numUnderrated = selectedStats.filter((c) => c.status === 'Underrated').length
  const numOverrated = selectedStats.filter((c) => c.status === 'Overrated').length
  const numMeta = selectedStats.filter((c) => c.status === 'Strong/Meta').length
  const avgCardWinRate = selectedStats.length > 0
    ? selectedStats.reduce((sum, c) => sum + c.win_rate, 0) / selectedStats.length
    : 0

  const getVerdict = () => {
    if (numOverrated >= 3) {
      return {
        type: 'warning',
        text: 'Highly Overrated Elements: Your deck contains multiple popular cards that statistically underperform. Consider swapping them out for high-win-rate niche alternatives.',
        color: 'text-red-400 bg-red-950/20 border-red-500/30',
        icon: AlertTriangle,
      }
    } else if (numUnderrated >= 2) {
      return {
        type: 'success',
        text: "Secret Powerhouse: Your deck utilizes multiple underrated cards that win more than average but aren't widely played. This can catch opponents off guard!",
        color: 'text-green-400 bg-green-950/20 border-green-500/30',
        icon: CheckCircle2,
      }
    } else if (numMeta >= 4) {
      return {
        type: 'info',
        text: 'Stable Meta Deck: Your deck relies heavily on highly-played, strong meta cards. It is statistically stable but highly predictable.',
        color: 'text-blue-400 bg-blue-950/20 border-blue-500/30',
        icon: Info,
      }
    } else {
      return {
        type: 'balanced',
        text: 'Balanced Deck: A mix of card types with standard baseline performance.',
        color: 'text-gray-400 bg-gray-900/30 border-gray-500/20',
        icon: HelpCircle,
      }
    }
  }

  const verdict = getVerdict()

  const columns = [
    { key: 'card', label: 'Card Name' },
    {
      key: 'status',
      label: 'Classification',
      render: (val) => {
        const colors = STATUS_COLORS[val] || {}
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {val}
          </span>
        )
      },
    },
    {
      key: 'popularity',
      label: 'Popularity',
      render: (val) => `${(val * 100).toFixed(2)}%`,
    },
    {
      key: 'win_rate',
      label: 'Win Rate',
      render: (val) => `${(val * 100).toFixed(1)}%`,
    },
    {
      key: 'win_rate_diff',
      label: 'Win Rate Diff vs Avg',
      render: (val) => (
        <span className={val >= 0 ? 'text-green-400' : 'text-red-400'}>
          {val >= 0 ? '+' : ''}
          {(val * 100).toFixed(1)}%
        </span>
      ),
    },
  ]

  if (statsLoading) {
    return <LoadingSpinner message="Loading card options..." />
  }

  if (statsError) {
    return <ErrorDisplay message={statsError} />
  }

  if (allCardsList.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass-card p-8 text-center">
          <h2 className="text-lg font-semibold text-white">Card data is not available yet</h2>
          <p className="text-sm text-dark-400 mt-2">
            Run the data pipeline to populate the card catalog before evaluating a deck.
          </p>
        </div>
      </div>
    )
  }

  const VerdictIcon = verdict.icon

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl gradient-text flex items-center gap-2">
          <Search className="w-8 h-8 text-crown-400" />
          Deck Evaluator
        </h1>
        <p className="text-dark-400 mt-1">
          Assemble any 8-card Clash Royale deck to evaluate historical performance or predict simulated meta synergy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Deck selector */}
        <div className="lg:col-span-1 glass-card p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-white">Assemble Roster</h2>
          <DeckSelector
            cards={allCardsList}
            selectedCards={selectedCards}
            onSelectionChange={setSelectedCards}
            levels={levels}
            onLevelsChange={setLevels}
          />
        </div>

        {/* Right column: Results */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCards.length < 8 ? (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
              <Info className="w-12 h-12 text-crown-400/60 mb-3" />
              <h3 className="text-lg font-semibold text-white">Awaiting Roster</h3>
              <p className="text-dark-400 max-w-sm mt-1">
                Please select exactly 8 cards from the builder panel to evaluate synergy and deck metrics.
              </p>
            </div>
          ) : evalLoading ? (
            <LoadingSpinner message="Calculating synergies and checking history..." />
          ) : evalError ? (
            <ErrorDisplay message={evalError} />
          ) : evalData ? (
            <div className="space-y-6">
              {/* Performance Record / Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Deck Performance Overview</h3>
                {evalData.found_in_history ? (
                  <div className="space-y-4">
                    <div className="bg-crown-500/10 border border-crown-500/20 rounded-lg p-4">
                      <span className="text-crown-400 font-bold block mb-1">Rank #{evalData.rank} in Leaderboard</span>
                      <p className="text-sm text-dark-400">
                        This exact deck exists in our historical match records with a high play frequency.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <MetricCard label="Matches Played" value={evalData.matches_played} />
                      <MetricCard label="Win Rate" value={`${(evalData.win_rate * 100).toFixed(1)}%`} />
                      <MetricCard label="Wilson Score" value={evalData.wilson_score.toFixed(3)} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <span className="text-blue-400 font-bold block mb-1">Estimated ML Rank #{evalData.estimated_rank} / {evalData.total_meta_decks}</span>
                      <p className="text-sm text-dark-400">
                        This exact deck has no historical logs. We evaluated its synergy using the trained non-linear Neural Network model.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <MetricCard label="Predicted WR vs Meta" value={`${(evalData.predicted_win_rate * 100).toFixed(1)}%`} />
                      <MetricCard label="Avg Elixir Cost" value={evalData.avg_elixir_cost} />
                      <MetricCard label="Elixir Penalty" value={evalData.elixir_penalty > 0 ? `-${(evalData.elixir_penalty * 100).toFixed(1)}%` : 'None'} />
                    </div>
                  </div>
                )}
              </div>

              {/* Individual Card Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Individual Card Breakdown</h3>
                <DataTable columns={columns} data={selectedStats} />
              </div>

              {/* Synergy Summary & Verdict */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Synergy Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-dark-50/30 rounded-lg">
                    <div className="text-xl font-bold text-white">{(avgCardWinRate * 100).toFixed(1)}%</div>
                    <div className="text-xs text-dark-400">Avg Card WR</div>
                  </div>
                  <div className="p-3 bg-dark-50/30 rounded-lg">
                    <div className="text-xl font-bold text-green-400">{numUnderrated}</div>
                    <div className="text-xs text-dark-400">Underrated</div>
                  </div>
                  <div className="p-3 bg-dark-50/30 rounded-lg">
                    <div className="text-xl font-bold text-red-400">{numOverrated}</div>
                    <div className="text-xs text-dark-400">Overrated</div>
                  </div>
                </div>

                <div className={`p-4 border rounded-lg flex gap-3 ${verdict.color}`}>
                  <VerdictIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Verdict</span>
                    <span className="text-sm">{verdict.text}</span>
                  </div>
                </div>
              </div>

              {/* Optimization Panel */}
              <div className="glass-card p-6 space-y-4 border-crown-500/20">
                <div className="flex justify-between items-start gap-4 flex-col sm:flex-row">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Auto-Suggestions (Optimized Deck Builder)</h3>
                    <p className="text-sm text-dark-400 mt-1">
                      Identifies the weakest contributor in your deck using LOO analysis and evaluates replacements.
                    </p>
                  </div>
                  {!swapsData && (
                    <button
                      onClick={handleFindSwaps}
                      disabled={swapsLoading}
                      className="px-4 py-2 bg-crown-600 hover:bg-crown-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {swapsLoading ? 'Calculating...' : 'Find Optimal Swaps'}
                    </button>
                  )}
                </div>

                {swapsLoading && <LoadingSpinner message="Simulating candidate replacements..." />}
                {swapsError && <ErrorDisplay message={swapsError} />}

                {swapsData && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-dark-50/50 p-4 rounded-lg border border-dark-200/10">
                      <span className="text-sm text-dark-400">Weakest Link Contribution:</span>
                      <div className="text-white font-semibold mt-1">
                        {swapsData.weakest_card}{' '}
                        <span className={swapsData.weakest_impact >= 0 ? 'text-red-400' : 'text-green-400'}>
                          ({swapsData.weakest_impact >= 0 ? '+' : ''}{(swapsData.weakest_impact * 100).toFixed(1)}% LOO impact)
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Top Swap Suggestions</h4>
                    <div className="space-y-2">
                      {swapsData.top_swaps?.map((swap) => {
                        const hasGain = swap.improvement > 0
                        return (
                          <div
                            key={swap.candidate}
                            className={`p-4 border rounded-lg flex items-center justify-between gap-4 ${
                              hasGain
                                ? 'bg-green-950/20 border-green-500/20 text-green-400'
                                : 'bg-dark-50/20 border-dark-200/10 text-dark-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-dark-400">Swap out {swapsData.weakest_card}</span>
                              <ArrowRight className="w-4 h-4 text-dark-400" />
                              <span className="text-sm font-bold text-white">{swap.candidate}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-white">{(swap.simulated_win_rate * 100).toFixed(1)}% WR</div>
                              <div className="text-xs">
                                {hasGain ? '+' : ''}{(swap.improvement * 100).toFixed(1)}% change (elixir: {swap.elixir_cost})
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default DeckEvaluator
