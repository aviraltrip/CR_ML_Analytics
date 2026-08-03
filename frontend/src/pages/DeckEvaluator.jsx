import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Sparkles } from 'lucide-react'
import { usePost } from '../hooks/useApi'
import { api } from '../services/api'
import { DeckSelector } from '../components/DeckSelector'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { DeckBadge } from '../components/DeckBadge'

const DEFAULT_CARDS = [
  'Arrows',
  'Baby Dragon',
  'Bandit',
  'Cannon',
  'Electro Wizard',
  'Ice Golem',
  'Knight',
  'Tombstone',
]

export function DeckEvaluator() {
  const [cards, setCards] = useState(DEFAULT_CARDS)
  const [levels, setLevels] = useState({})
  const { data, loading, error, execute } = usePost((payload) => api.evaluateDeck(payload))

  const handleEvaluate = async () => {
    if (cards.length !== 8) {
      return
    }
    await execute({ cards, levels })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl gradient-text">
          Deck Evaluator
        </h1>
        <p className="text-dark-400 mt-2">
          Analyze a deck with historical ranking, predicted win rate, and swap suggestions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <DeckSelector
            label="Your Deck"
            cards={cards}
            setCards={setCards}
            description="Add or remove cards to build an 8-card deck. Use the built-in deck selector to manage your cards."
          />

          <div className="glass-card p-5 space-y-3">
            <h2 className="text-lg font-semibold text-white">Card Levels</h2>
            <p className="text-sm text-dark-400">
              Optional levels can help the model better predict your deck strength.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {cards.map((card) => (
                <label key={card} className="block text-sm">
                  <span className="text-dark-300">{card}</span>
                  <input
                    type="number"
                    value={levels[card] ?? 11}
                    onChange={(e) =>
                      setLevels({
                        ...levels,
                        [card]: Math.max(1, Math.min(16, Number(e.target.value))),
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-dark-200/20 bg-dark-900 px-3 py-2 text-white focus:border-crown-500/60 focus:outline-none"
                    min="1"
                    max="16"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleEvaluate}
              disabled={cards.length !== 8 || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-crown-600 px-5 py-3 text-sm font-semibold text-white hover:bg-crown-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Evaluate Deck
            </button>
            <Link
              to="/leaderboard"
              className="text-sm text-crown-400 hover:text-crown-300"
            >
              Browse leaderboard decks and compare scores →
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {loading && <LoadingSpinner message="Evaluating deck..." />}
          {error && <ErrorDisplay message={error} />}

          {data && (
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-crown-400" />
                <div>
                  <p className="text-sm text-dark-400">Evaluation Results</p>
                  <h2 className="text-xl font-semibold text-white">{data.found_in_history ? 'Historical Match Found' : 'Predicted Outcome'}</h2>
                </div>
              </div>

              {data.found_in_history ? (
                <div className="space-y-3">
                  <p className="text-sm text-dark-400">This deck was found in historical rankings.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-dark-900 p-4">
                      <div className="text-sm text-dark-400">Rank</div>
                      <div className="text-2xl font-semibold text-white">#{data.rank}</div>
                    </div>
                    <div className="rounded-xl bg-dark-900 p-4">
                      <div className="text-sm text-dark-400">Win Rate</div>
                      <div className="text-2xl font-semibold text-white">{(data.win_rate * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-dark-900 p-4">
                      <div className="text-sm text-dark-400">Estimated Win Rate</div>
                      <div className="text-2xl font-semibold text-white">{(data.predicted_win_rate * 100).toFixed(1)}%</div>
                    </div>
                    <div className="rounded-xl bg-dark-900 p-4">
                      <div className="text-sm text-dark-400">Estimated Meta Rank</div>
                      <div className="text-2xl font-semibold text-white">#{data.estimated_rank}</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-dark-900 p-4">
                    <div className="text-sm text-dark-400">Average Elixir</div>
                    <div className="text-xl font-semibold text-white">{data.avg_elixir_cost}</div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm text-dark-400">Deck</h3>
                <DeckBadge cards={cards} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeckEvaluator
