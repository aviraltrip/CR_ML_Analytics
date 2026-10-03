import React, { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  BarChart3, 
  ArrowLeft, 
  HelpCircle, 
  ShieldCheck, 
  Gauge, 
  AlertTriangle,
  RotateCcw,
  Search,
  CheckCircle,
  HelpCircle as QuestionIcon,
  Flame,
  Wand2,
  Trophy
} from 'lucide-react'
import { useApi, usePost } from '../hooks/useApi'
import { api } from '../services/api'
import { DeckSelector } from '../components/DeckSelector'
import { WinRateGauge } from '../components/WinRateGauge'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { getCardRarity } from '../utils/constants'
import { CardImage } from '../components/CardImage'

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


const AIR_CARDS = ["Archers", "Baby Dragon", "Bats", "Dart Goblin", "Electro Dragon", "Electro Wizard", "Executioner", "Firecracker", "Flying Machine", "Hunter", "Ice Wizard", "Inferno Dragon", "Magic Archer", "Minions", "Minion Horde", "Musketeer", "Phoenix", "Princess", "Spear Goblins", "Three Musketeers", "Witch", "Wizard", "Tesla", "Inferno Tower", "Archer Queen", "Little Prince", "Electro Spirit", "Ice Spirit", "Void", "Arrows", "Fireball", "Rocket", "Zap", "Lightning", "Poison", "Giant Snowball", "Tornado"]
const SPELLS = ["Arrows", "Earthquake", "Fireball", "Freeze", "Lightning", "Poison", "Rage", "Rocket", "The Log", "Tornado", "Zap", "Giant Snowball", "Void", "Goblin Curse", "Clone", "Mirror"]
const TANKS = ["Giant", "Golem", "Lava Hound", "P.E.K.K.A", "Mega Knight", "Giant Skeleton", "Royal Giant", "Electro Giant", "Goblin Giant", "Rune Giant", "Mighty Miner"]

export function DeckEvaluator() {
  const location = useLocation()
  const [cards, setCards] = useState(DEFAULT_CARDS)
  const [levels, setLevels] = useState({})
  
  
  const { data: allData } = useApi(() => api.getAllData())
  
  
  const { data, loading, error, execute } = usePost((payload) => api.evaluateDeck(payload))

  const availableCardsList = useMemo(() => {
    return allData?.card_elixir ? Object.keys(allData.card_elixir) : []
  }, [allData])

  const cardElixirMap = useMemo(() => {
    return allData?.card_elixir || {}
  }, [allData])

  
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const deckParam = params.get('deck')
    if (deckParam) {
      const parsed = deckParam.split(',')
      if (parsed.length === 8) {
        setCards(parsed)
      }
    }
  }, [location.search])

  const handleEvaluate = async (deckOverride = null) => {
    const targetCards = deckOverride || cards
    if (targetCards.length !== 8) return
    
    
    const resolvedLevels = {}
    targetCards.forEach(c => {
      resolvedLevels[c] = levels[c] !== undefined ? levels[c] : 11
    })
    
    await execute({ cards: targetCards, levels: resolvedLevels })
  }

  
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('deck') && availableCardsList.length > 0) {
      handleEvaluate()
    }
  }, [location.search, availableCardsList])

  
  const liveStats = useMemo(() => {
    if (cards.length === 0) return { aec: 0, cycle: 0, air: 0, spells: 0, tanks: 0 }
    
    const costs = cards.map(c => cardElixirMap[c] || 3.5)
    const aec = costs.reduce((a, b) => a + b, 0) / cards.length
    
    const sortedCosts = costs.toSorted((a, b) => a - b)
    const cycle = sortedCosts.slice(0, Math.min(4, sortedCosts.length)).reduce((a, b) => a + b, 0) / Math.min(4, sortedCosts.length)
    
    const air = cards.filter(c => AIR_CARDS.includes(c)).length
    const spellsCount = cards.filter(c => SPELLS.includes(c)).length
    const tanksCount = cards.filter(c => TANKS.includes(c)).length
    
    return { aec, cycle, air, spells: spellsCount, tanks: tanksCount }
  }, [cards, cardElixirMap])

  
  const handlePerformSwap = (weakestCard, replacementCard) => {
    const nextCards = cards.map(c => c === weakestCard ? replacementCard : c)
    setCards(nextCards)
    handleEvaluate(nextCards)
  }

  return (
    <m.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        
        
        <div className="space-y-6">
          
          
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800/60">
            <DeckSelector
              label="Interactive Deck Builder"
              cards={cards}
              setCards={setCards}
              availableCards={availableCardsList}
              cardElixirMap={cardElixirMap}
              description="Click slots to remove cards. Select cards from the grid database below to complete your 8-card combination."
            />
          </div>

          
          {cards.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-400" />
                  Customize Card Levels
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Adjust levels (1–16) of individual cards to refine the ML model predictions based on card level differences.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {cards.map((card) => (
                  <div key={card} className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-300 truncate block mb-1">
                      {card}
                    </span>
                    <input
                      type="number"
                      aria-label={`${card} level`}
                      value={levels[card] ?? 11}
                      onChange={(e) =>
                        setLevels({
                          ...levels,
                          [card]: Math.max(1, Math.min(16, Number(e.target.value))),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500/50 focus:outline-none text-center font-mono font-bold"
                      min="1"
                      max="16"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleEvaluate()}
              disabled={cards.length !== 8 || loading}
              className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase text-sm rounded-xl tracking-wider shadow-lg shadow-indigo-950/40 transition-all"
            >
              <Wand2 className="w-4 h-4" />
              Evaluate Synergy
            </button>
            
            {cards.length === 8 && (
              <button 
                type="button"
                onClick={() => {
                  setCards(DEFAULT_CARDS)
                  setLevels({})
                }}
                className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                title="Reset Deck"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>

        
        <div className="space-y-6">
          
          
          {!loading && !data && !error && (
            <div className="glass-panel p-8 rounded-3xl text-center h-full flex flex-col items-center justify-center border border-slate-800/40">
              <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Ready for Simulation</h3>
              <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                Build an 8-card deck and click the **Evaluate Synergy** button. The server will run a simulated round-robin against meta decks.
              </p>
            </div>
          )}

          
          {loading && (
            <div className="glass-panel p-8 rounded-3xl h-full flex items-center justify-center">
              <LoadingSpinner message="Calculating winrate matrix & card synergy deltas..." />
            </div>
          )}

          
          {error && <ErrorDisplay message={error} />}

          
          <AnimatePresence>
            {!loading && data && (
              <m.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                
                {data.found_in_history && (
                  <m.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/25 flex items-start gap-4 shadow-xl"
                  >
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 flex-shrink-0 animate-pulse">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Active Historical Meta Deck
                      </h4>
                      <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                        This deck is active in match history: <span className="text-amber-400">{data.wins}W - {data.losses}L</span> ({(data.win_rate * 100).toFixed(1)}%) in <span className="text-indigo-400">{data.matches_played}</span> matches. Wilson Score: <span className="font-mono text-cyan-400">{data.wilson_score}</span>
                      </p>
                    </div>
                  </motion.div>
                )}

                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <WinRateGauge 
                    probability={data.predicted_win_rate} 
                  />

                  
                  <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border-l-[3px] border-l-cyan-500">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                        Meta Placement
                      </span>
                      <div className="flex items-baseline gap-4 mt-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Simulated</span>
                          <h3 className="text-3xl font-black font-mono text-white leading-none mt-1">
                            #{data.estimated_rank}
                          </h3>
                        </div>
                        {data.found_in_history && (
                          <div className="border-l border-slate-800 pl-4">
                            <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">Historical</span>
                            <h3 className="text-2xl font-black font-mono text-amber-300 leading-none mt-1">
                              #{data.rank}
                            </h3>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3.5 font-bold uppercase tracking-wide">
                        Status: {data.found_in_history ? 'ACTIVE IN META' : 'PREDICTIVE SIMULATION'}
                      </p>
                    </div>

                    <p className="text-xs text-slate-400 mt-4 leading-normal">
                      {data.found_in_history
                        ? `ML estimated rank is #${data.estimated_rank} in simulated tournament, and actual match history rank is #${data.rank}.`
                        : `Estimated meta ranking out of ${data.total_meta_decks} parsed deck models in the round-robin pool.`}
                    </p>
                  </div>
                </div>

                
                <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Deck Statistics Breakdown
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    
                    <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-900 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Avg Elixir</span>
                      <span className="block text-lg font-black text-white font-mono mt-0.5">{liveStats.aec.toFixed(1)}</span>
                    </div>

                    
                    <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-900 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Cycle Cost</span>
                      <span className="block text-lg font-black text-indigo-400 font-mono mt-0.5">{liveStats.cycle.toFixed(1)}</span>
                    </div>

                    
                    <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-900 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Air Defense</span>
                      <span className={`block text-lg font-black font-mono mt-0.5 ${liveStats.air >= 2 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {liveStats.air} / 8
                      </span>
                    </div>

                    
                    <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-900 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Spells / Tanks</span>
                      <span className="block text-xs font-black text-white mt-1.5 uppercase font-mono">
                        {liveStats.spells}S | {liveStats.tanks}T
                      </span>
                    </div>
                  </div>
                </div>

                
                {data.top_swaps && data.top_swaps.length > 0 && (
                  <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Synergy Recommendations
                      </h4>
                      <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                        LOO (Leave-One-Out) metrics identified **{data.weakest_card}** as the weakest card in this deck combination (Impact: {data.weakest_impact}). Swap it to improve:
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {data.top_swaps.map((swap, idx) => {
                        const isPositive = swap.improvement > 0
                        const swapRarity = getCardRarity(swap.candidate)

                        return (
                          <div 
                            key={swap.candidate}
                            className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-750 transition-all flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              
                              <CardImage 
                                name={swap.candidate} 
                                rarity={swapRarity} 
                                className="h-12 w-9 flex-shrink-0"
                              />
                              <div>
                                <h5 className="font-bold text-sm text-white">{swap.candidate}</h5>
                                <p className="text-[10px] text-slate-400 font-medium">Elixir cost: {swap.elixir_cost}</p>
                              </div>
                            </div>

                            
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className={`text-xs font-black font-mono block ${isPositive ? 'text-emerald-400' : 'text-slate-400'}`}>
                                  {isPositive ? '+' : ''}{(swap.improvement * 100).toFixed(1)}% WR
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">
                                  Improvement
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handlePerformSwap(data.weakest_card, swap.candidate)}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-[10px] font-bold uppercase tracking-wider text-white rounded-lg transition-all"
                              >
                                Swap Card
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </m.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </m.div>
  )
}

export default DeckEvaluator
