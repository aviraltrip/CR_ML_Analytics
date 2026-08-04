import React, { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Sword,
  Target
} from 'lucide-react'
import { usePost, useApi } from '../hooks/useApi'
import { api } from '../services/api'
import { DeckSelector } from '../components/DeckSelector'
import { WinRateGauge } from '../components/WinRateGauge'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { getCardRarity } from '../utils/constants'
import { CardImage } from '../components/CardImage'

const DEFAULT_DECK_1 = [
  'Arrows',
  'Baby Dragon',
  'Bandit',
  'Cannon',
  'Electro Wizard',
  'Ice Golem',
  'Knight',
  'Tombstone',
]

const DEFAULT_DECK_2 = [
  'Goblin Barrel',
  'Princess',
  'Skeleton Army',
  'Inferno Tower',
  'Musketeer',
  'Knight',
  'Ice Spirit',
  'Fireball',
]

export function MatchupPredictor() {
  const location = useLocation()
  const [deck1, setDeck1] = useState(DEFAULT_DECK_1)
  const [deck2, setDeck2] = useState(DEFAULT_DECK_2)
  const [deck1Levels, setDeck1Levels] = useState({})
  const [deck2Levels, setDeck2Levels] = useState({})
  const [trophies1, setTrophies1] = useState(11500)
  const [trophies2, setTrophies2] = useState(11500)
  
  // Fetch static resources from /data
  const { data: allData } = useApi(() => api.getAllData())
  const { data, loading, error, execute } = usePost((payload) => api.predictMatchup(payload))

  const availableCardsList = useMemo(() => {
    return allData?.card_elixir ? Object.keys(allData.card_elixir) : []
  }, [allData])

  const cardElixirMap = useMemo(() => {
    return allData?.card_elixir || {}
  }, [allData])

  // Parse URL deck1 query param
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const deck1Param = params.get('deck1')
    if (deck1Param) {
      const parsed = deck1Param.split(',')
      if (parsed.length === 8) {
        setDeck1(parsed)
      }
    }
  }, [location.search])

  const handlePredict = async () => {
    if (deck1.length !== 8 || deck2.length !== 8) return

    // Auto-fill levels for cards that don't have them set yet (default level 11)
    const fillLevels = (deck, lvls) => {
      const resolved = {}
      deck.forEach(c => {
        resolved[c] = lvls[c] !== undefined ? lvls[c] : 11
      })
      return resolved
    }

    await execute({
      deck1_cards: deck1,
      deck1_levels: fillLevels(deck1, deck1Levels),
      deck1_trophies: trophies1,
      deck2_cards: deck2,
      deck2_levels: fillLevels(deck2, deck2Levels),
      deck2_trophies: trophies2,
    })
  }

  // Auto-predict if deck1 query parameter is loaded
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('deck1') && availableCardsList.length > 0) {
      handlePredict()
    }
  }, [location.search, availableCardsList])

  const winPercentage = data ? Math.round(data.win_probability * 100) : 50

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      
      {/* Dynamic VS Arena layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        
        {/* BLUE CORNER: Your Deck */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-blue-500/10 bg-gradient-to-b from-blue-950/10 to-transparent space-y-4">
          <DeckSelector
            label="Blue Corner (Your Deck)"
            cards={deck1}
            setCards={setDeck1}
            availableCards={availableCardsList}
            cardElixirMap={cardElixirMap}
            description="Build your active deck to test matchup effectiveness."
          />
          
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Your Trophies
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={trophies1}
                onChange={(e) => setTrophies1(Number(e.target.value))}
                className="flex-1 accent-indigo-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-white bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg w-16 text-center">
                {trophies1}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER VS SECTION */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-800 shadow-2xl">
            <span className="font-display font-black text-lg italic tracking-tight text-yellow-500">VS</span>
            <div className="absolute inset-0 bg-yellow-500/5 rounded-full blur-md animate-pulse"></div>
          </div>
          <div className="h-10 w-0.5 bg-gradient-to-b from-slate-800 to-transparent mt-2 hidden xl:block"></div>
        </div>

        {/* RED CORNER: Opponent Deck */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-red-500/10 bg-gradient-to-b from-red-950/10 to-transparent space-y-4">
          <DeckSelector
            label="Red Corner (Opponent Deck)"
            cards={deck2}
            setCards={setDeck2}
            availableCards={availableCardsList}
            cardElixirMap={cardElixirMap}
            description="Build the opponent deck you want to predict against."
          />
          
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Opponent Trophies
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={trophies2}
                onChange={(e) => setTrophies2(Number(e.target.value))}
                className="flex-1 accent-red-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-white bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg w-16 text-center">
                {trophies2}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Prediction Trigger Button */}
      <div className="max-w-xs mx-auto flex gap-4">
        <button
          onClick={handlePredict}
          disabled={deck1.length !== 8 || deck2.length !== 8 || loading}
          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase text-sm rounded-xl tracking-wider shadow-lg shadow-indigo-950/40 transition-all"
        >
          <Sword className="w-4 h-4" />
          Predict Matchup
        </button>
        {(deck1.length === 8 || deck2.length === 8) && (
          <button 
            onClick={() => {
              setDeck1(DEFAULT_DECK_1)
              setDeck2(DEFAULT_DECK_2)
            }}
            className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
            title="Reset Decks"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* RESULTS DISPLAY PANEL */}
      <div className="space-y-6">
        
        {loading && (
          <div className="glass-panel p-12 rounded-3xl flex items-center justify-center">
            <LoadingSpinner message="Simulating deck counter-interactions and elixir pacing..." />
          </div>
        )}

        {error && <ErrorDisplay message={error} />}

        <AnimatePresence>
          {!loading && data && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              
              {/* 1. Dynamic Split Win Probability Bar */}
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  <span>Your Deck (Blue Corner)</span>
                  <span>Matchup Win Rate Split</span>
                  <span>Opponent Deck (Red Corner)</span>
                </div>

                {/* Progress bar line */}
                <div className="h-6 w-full rounded-full bg-red-600/80 overflow-hidden flex relative shadow-inner">
                  <motion.div 
                    initial={{ width: '50%' }}
                    animate={{ width: `${winPercentage}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-blue-600/90 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15)] flex items-center justify-end pr-4 text-xs font-mono font-black text-white"
                  >
                    {winPercentage}%
                  </motion.div>
                  <div className="flex-1 flex items-center pl-4 text-xs font-mono font-black text-white">
                    {100 - winPercentage}%
                  </div>
                  {/* Split divider marker */}
                  <div className="absolute top-0 bottom-0 w-1 bg-white left-[50%] -translate-x-1/2 opacity-30"></div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-300">
                      Matchup Verdict: <strong className="text-white uppercase">{data.verdict}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Model Confidence: High
                  </span>
                </div>
              </div>

              {/* 2. Advantage vs. Threat breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Advantages Panel (Blue) */}
                <div className="glass-panel p-6 rounded-2xl border border-emerald-500/10 space-y-4">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Matchup Advantages
                  </h4>
                  
                  {data.advantages && data.advantages.length > 0 ? (
                    <div className="space-y-2.5">
                      {data.advantages.map((adv) => (
                        <div 
                          key={adv.card}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <CardImage name={adv.card} rarity={getCardRarity(adv.card)} className="h-10 w-8" />
                            <span className="font-bold text-xs text-white">{adv.card}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            +{(adv.impact * 100).toFixed(1)}% edge
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No notable card advantages identified in this matchup.</p>
                  )}
                </div>

                {/* Threats Panel (Red) */}
                <div className="glass-panel p-6 rounded-2xl border border-red-500/10 space-y-4">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Matchup Threats
                  </h4>
                  
                  {data.disadvantages && data.disadvantages.length > 0 ? (
                    <div className="space-y-2.5">
                      {data.disadvantages.map((threat) => (
                        <div 
                          key={threat.card}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <CardImage name={threat.card} rarity={getCardRarity(threat.card)} className="h-10 w-8" />
                            <span className="font-bold text-xs text-white">{threat.card}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-red-400">
                            {(threat.impact * 100).toFixed(1)}% drop
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No critical threat counters identified in this matchup.</p>
                  )}
                </div>

              </div>

              {/* 3. Detailed Card Contributions list */}
              {data.contributions && data.contributions.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Full Card Contribution Breakdown
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.contributions.map((item, index) => {
                      const isAdvantage = item.impact >= 0
                      const cardRarity = getCardRarity(item.card)
                      return (
                        <div 
                          key={`${item.card}-${index}`}
                          className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/20 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-2.5">
                            <CardImage name={item.card} rarity={cardRarity} className="h-9 w-7" />
                            <div>
                              <h5 className="font-bold text-xs text-white">{item.card}</h5>
                              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">{item.owner}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-mono font-bold ${isAdvantage ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isAdvantage ? '+' : ''}{(item.impact * 100).toFixed(1)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </motion.div>
  )
}

export default MatchupPredictor
