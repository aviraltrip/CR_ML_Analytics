import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Zap } from 'lucide-react'
import { usePost } from '../hooks/useApi'
import { api } from '../services/api'
import { DeckSelector } from '../components/DeckSelector'
import { WinRateGauge } from '../components/WinRateGauge'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { DeckBadge } from '../components/DeckBadge'

const DEFAULT_DECK = [
  'Arrows',
  'Baby Dragon',
  'Bandit',
  'Cannon',
  'Electro Wizard',
  'Ice Golem',
  'Knight',
  'Tombstone',
]

export function MatchupPredictor() {
  const [deck1, setDeck1] = useState(DEFAULT_DECK)
  const [deck2, setDeck2] = useState(DEFAULT_DECK)
  const [deck1Levels, setDeck1Levels] = useState({})
  const [deck2Levels, setDeck2Levels] = useState({})
  const [trophies1, setTrophies1] = useState(11500)
  const [trophies2, setTrophies2] = useState(11500)
  const { data, loading, error, execute } = usePost((payload) => api.predictMatchup(payload))

  const handlePredict = async () => {
    if (deck1.length !== 8 || deck2.length !== 8) {
      return
    }
    await execute({
      deck1_cards: deck1,
      deck1_levels: deck1Levels,
      deck1_trophies: trophies1,
      deck2_cards: deck2,
      deck2_levels: deck2Levels,
      deck2_trophies: trophies2,
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl gradient-text">
          Matchup Predictor
        </h1>
        <p className="text-dark-400 mt-2">
          Compare two decks and predict the expected win probability and matchup strengths.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <DeckSelector
            label="Your Deck"
            cards={deck1}
            setCards={setDeck1}
            description="Build your own starting deck to compare against an opponent deck."
          />

          <div className="glass-card p-5 space-y-3">
            <div className="grid gap-3">
              <label className="block text-sm">
                <span className="text-dark-300">Your Trophy Level</span>
                <input
                  type="number"
                  value={trophies1}
                  onChange={(e) => setTrophies1(Math.max(1000, Math.min(15000, Number(e.target.value))))}
                  min="1000"
                  max="15000"
                  className="mt-2 w-full rounded-lg border border-dark-200/20 bg-dark-900 px-3 py-2 text-white focus:border-crown-500/60 focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="text-dark-300">Opponent Trophy Level</span>
                <input
                  type="number"
                  value={trophies2}
                  onChange={(e) => setTrophies2(Math.max(1000, Math.min(15000, Number(e.target.value))))}
                  min="1000"
                  max="15000"
                  className="mt-2 w-full rounded-lg border border-dark-200/20 bg-dark-900 px-3 py-2 text-white focus:border-crown-500/60 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <DeckSelector
            label="Opponent Deck"
            cards={deck2}
            setCards={setDeck2}
            description="Build the opponent deck and then compare strengths and weaknesses."
          />

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handlePredict}
              disabled={deck1.length !== 8 || deck2.length !== 8 || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-crown-600 px-5 py-3 text-sm font-semibold text-white hover:bg-crown-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Predict Matchup
            </button>
            <Link
              to="/cards"
              className="text-sm text-crown-400 hover:text-crown-300"
            >
              Explore card strengths in card analysis →
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {loading && <LoadingSpinner message="Predicting matchup..." />}
          {error && <ErrorDisplay message={error} />}

          {data && (
            <div className="space-y-5">
              <WinRateGauge probability={data.win_probability} />

              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-crown-400" />
                  <div>
                    <p className="text-sm text-dark-400">Verdict</p>
                    <h2 className="text-xl font-semibold text-white">{data.verdict}</h2>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm text-dark-400">Your Deck</h3>
                    <DeckBadge cards={deck1} />
                  </div>
                  <div>
                    <h3 className="text-sm text-dark-400">Opponent Deck</h3>
                    <DeckBadge cards={deck2} />
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-lg font-semibold text-white">Top Card Contributions</h3>
                <div className="grid gap-3 mt-4">
                  {data.contributions?.slice(0, 6).map((item) => (
                    <div
                      key={`${item.card}-${item.owner}`}
                      className="rounded-xl bg-dark-900 p-4 border border-dark-200/20"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-white">{item.card}</span>
                        <span className="text-xs text-dark-400">{item.owner}</span>
                      </div>
                      <p className="mt-2 text-sm text-crown-400">Impact: {item.impact > 0 ? '+' : ''}{(item.impact * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MatchupPredictor
