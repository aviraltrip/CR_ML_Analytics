import React, { useState, useEffect } from 'react'
import { Zap, HelpCircle, AlertTriangle, CheckCircle2, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { DeckSelector } from '../components/DeckSelector'
import { WinRateGauge } from '../components/WinRateGauge'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { DEFAULT_CARD_LEVEL, TROPHY_RANGE } from '../utils/constants'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'

export function MatchupPredictor() {
  const { data: cardStatsData, loading: statsLoading, error: statsError } = useApi(() => api.getCardStats())

  // Deck 1 (Your Deck)
  const [deck1Cards, setDeck1Cards] = useState([])
  const [deck1Levels, setDeck1Levels] = useState({})
  const [deck1Trophies, setDeck1Trophies] = useState(TROPHY_RANGE.default)

  // Deck 2 (Opponent's Deck)
  const [deck2Cards, setDeck2Cards] = useState([])
  const [deck2Levels, setDeck2Levels] = useState({})
  const [deck2Trophies, setDeck2Trophies] = useState(TROPHY_RANGE.default)

  // Prediction status
  const [predData, setPredData] = useState(null)
  const [predLoading, setPredLoading] = useState(false)
  const [predError, setPredError] = useState(null)

  const cardStats = cardStatsData?.card_stats || []
  const allCardsList = cardStats.map((c) => c.card).sort()

  // Initialize levels when cards change
  useEffect(() => {
    const initializeLevels = (selected, levels, setLevels) => {
      const newLevels = { ...levels }
      let changed = false
      selected.forEach((card) => {
        if (!(card in newLevels)) {
          newLevels[card] = DEFAULT_CARD_LEVEL
          changed = true
        }
      })
      Object.keys(newLevels).forEach((card) => {
        if (!selected.includes(card)) {
          delete newLevels[card]
          changed = true
        }
      })
      if (changed) {
        setLevels(newLevels)
      }
    }

    initializeLevels(deck1Cards, deck1Levels, setDeck1Levels)
  }, [deck1Cards])

  useEffect(() => {
    const initializeLevels = (selected, levels, setLevels) => {
      const newLevels = { ...levels }
      let changed = false
      selected.forEach((card) => {
        if (!(card in newLevels)) {
          newLevels[card] = DEFAULT_CARD_LEVEL
          changed = true
        }
      })
      Object.keys(newLevels).forEach((card) => {
        if (!selected.includes(card)) {
          delete newLevels[card]
          changed = true
        }
      })
      if (changed) {
        setLevels(newLevels)
      }
    }

    initializeLevels(deck2Cards, deck2Levels, setDeck2Levels)
  }, [deck2Cards])

  // Run prediction when both decks have 8 cards
  useEffect(() => {
    if (deck1Cards.length === 8 && deck2Cards.length === 8) {
      const predict = async () => {
        setPredLoading(true)
        setPredError(null)
        try {
          const res = await api.predictMatchup({
            deck1_cards: deck1Cards,
            deck1_levels: deck1Levels,
            deck1_trophies: deck1Trophies,
            deck2_cards: deck2Cards,
            deck2_levels: deck2Levels,
            deck2_trophies: deck2Trophies,
          })
          setPredData(res)
        } catch (err) {
          setPredError(err.response?.data?.detail || err.message || 'Failed to predict matchup')
        } finally {
          setPredLoading(false)
        }
      }
      predict()
    } else {
      setPredData(null)
    }
  }, [deck1Cards, deck1Levels, deck1Trophies, deck2Cards, deck2Levels, deck2Trophies])

  const getVerdictDetails = (prob) => {
    const pct = (prob * 100).toFixed(1)
    if (prob > 0.55) {
      return {
        color: 'text-green-400 bg-green-950/20 border-green-500/30',
        text: `Favorable Matchup: You have a ${pct}% chance of winning this match! Your deck has a solid statistical advantage.`,
        icon: CheckCircle2,
      }
    } else if (prob < 0.45) {
      return {
        color: 'text-red-400 bg-red-950/20 border-red-500/30',
        text: `Unfavorable Matchup: You have only a ${pct}% chance of winning. Your opponent's cards have strong counter weights against your deck.`,
        icon: AlertTriangle,
      }
    } else {
      return {
        color: 'text-yellow-400 bg-yellow-950/20 border-yellow-500/30',
        text: `Even Matchup: You have a ${pct}% chance of winning. This matchup is a coin flip and will rely heavily on in-game skill and play style.`,
        icon: Info,
      }
    }
  }

  if (statsLoading) {
    return <LoadingSpinner message="Loading card options..." />
  }

  if (statsError) {
    return <ErrorDisplay message={statsError} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl gradient-text flex items-center gap-2">
          <Zap className="w-8 h-8 text-crown-400" />
          Matchup Predictor
        </h1>
        <p className="text-dark-400 mt-1">
          Compare two decks and evaluate individual card matchups and win probability using non-linear ML synergy models.
        </p>
      </div>

      {/* Grid for two deck builders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Deck Panel */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-dark-200/10 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Your Deck
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-dark-400">Trophies: {deck1Trophies.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={TROPHY_RANGE.min}
              max={TROPHY_RANGE.max}
              step="100"
              value={deck1Trophies}
              onChange={(e) => setDeck1Trophies(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <DeckSelector
            cards={allCardsList}
            selectedCards={deck1Cards}
            onSelectionChange={setDeck1Cards}
            levels={deck1Levels}
            onLevelsChange={setDeck1Levels}
          />
        </div>

        {/* Opponent's Deck Panel */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-dark-200/10 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Opponent's Deck
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-dark-400">Trophies: {deck2Trophies.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={TROPHY_RANGE.min}
              max={TROPHY_RANGE.max}
              step="100"
              value={deck2Trophies}
              onChange={(e) => setDeck2Trophies(Number(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>
          <DeckSelector
            cards={allCardsList}
            selectedCards={deck2Cards}
            onSelectionChange={setDeck2Cards}
            levels={deck2Levels}
            onLevelsChange={setDeck2Levels}
          />
        </div>
      </div>

      {/* Matchup Prediction Outcome */}
      <div className="mt-6">
        {deck1Cards.length < 8 || deck2Cards.length < 8 ? (
          <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
            <HelpCircle className="w-12 h-12 text-crown-400/60 mb-3" />
            <h3 className="text-lg font-semibold text-white">Pending Deck Selections</h3>
            <p className="text-dark-400 max-w-md mt-1">
              Select exactly 8 cards for both your deck and the opponent's deck above to compute the matchup analysis.
            </p>
          </div>
        ) : predLoading ? (
          <LoadingSpinner message="Calculating matchup win probability..." />
        ) : predError ? (
          <ErrorDisplay message={predError} />
        ) : predData ? (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-white text-center">Prediction Outcome</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Left & Middle columns: Verdict and Gauge */}
              <div className="md:col-span-1 flex flex-col items-center justify-center">
                <WinRateGauge probability={predData.win_probability} />
              </div>

              <div className="md:col-span-2">
                {(() => {
                  const details = getVerdictDetails(predData.win_probability)
                  const Icon = details.icon
                  return (
                    <div className={`p-6 border rounded-lg flex gap-4 ${details.color}`}>
                      <Icon className="w-8 h-8 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-lg mb-1">Matchup Verdict</h4>
                        <p className="text-sm leading-relaxed">{details.text}</p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Why analysis section */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-dark-200/10 pb-2">
                Matchup Synergy Analysis (Why?)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Advantages Column */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-400 flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5" />
                    Key Matchup Advantages
                  </h4>
                  {predData.advantages && predData.advantages.length > 0 ? (
                    <div className="space-y-2">
                      {predData.advantages.map((adv, idx) => (
                        <div key={idx} className="p-3 bg-green-950/20 border border-green-500/20 rounded-lg flex justify-between items-center text-sm">
                          <span className="font-semibold text-white">{adv.card}</span>
                          <div className="text-right">
                            <span className="text-green-400 font-mono font-bold">
                              +{ (adv.impact * 100).toFixed(1) }%
                            </span>
                            <span className="text-xs text-dark-400 block">{adv.owner}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-dark-400 italic">No clear advantages detected.</p>
                  )}
                </div>

                {/* Disadvantages Column */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-400 flex items-center gap-2">
                    <ArrowDownRight className="w-5 h-5" />
                    Key Matchup Disadvantages
                  </h4>
                  {predData.disadvantages && predData.disadvantages.length > 0 ? (
                    <div className="space-y-2">
                      {predData.disadvantages.map((dis, idx) => (
                        <div key={idx} className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg flex justify-between items-center text-sm">
                          <span className="font-semibold text-white">{dis.card}</span>
                          <div className="text-right">
                            <span className="text-red-400 font-mono font-bold">
                              {(dis.impact * 100).toFixed(1)}%
                            </span>
                            <span className="text-xs text-dark-400 block">{dis.owner}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-dark-400 italic">No clear disadvantages detected.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default MatchupPredictor
