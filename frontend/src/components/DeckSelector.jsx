import React, { useState, useMemo } from 'react'
import { m } from 'framer-motion'
import { Plus, X, Search, Sparkles } from 'lucide-react'
import { DECK_SIZE, getCardRarity } from '../utils/constants'
import { CardImage } from './CardImage'

const DEFAULT_EMPTY_ARRAY = []
const DEFAULT_EMPTY_OBJECT = {}

export function DeckSelector({ 
  label, 
  cards = DEFAULT_EMPTY_ARRAY, 
  setCards, 
  availableCards = DEFAULT_EMPTY_ARRAY, 
  cardElixirMap = DEFAULT_EMPTY_OBJECT, 
  maxCards = DECK_SIZE, 
  description 
}) {
  const [searchQuery, setSearchQuery] = useState('')

  
  const removeCard = (cardToRemove) => {
    setCards(cards.filter((card) => card !== cardToRemove))
  }

  
  const addCard = (cardToAdd) => {
    if (cards.length >= maxCards) return
    if (!cards.includes(cardToAdd)) {
      setCards([...cards, cardToAdd])
    }
  }

  
  const filteredAvailableCards = useMemo(() => {
    return availableCards
      .filter((card) => card.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
  }, [availableCards, searchQuery])

  return (
    <div className="space-y-6">
      
      
      <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            {label}
          </h2>
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
        <span className="text-xs font-mono font-bold text-white bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
          {cards.length} / {maxCards} cards
        </span>
      </div>

      
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {Array.from({ length: maxCards }).map((_, index) => {
          const card = cards[index]
          if (card) {
            const rarity = getCardRarity(card)
            const elixir = cardElixirMap[card] || 3
            return (
              <m.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                key={card}
                className="relative group aspect-[2/3] cursor-pointer"
                onClick={() => removeCard(card)}
              >
                
                <CardImage 
                  name={card} 
                  rarity={rarity} 
                  elixir={elixir}
                  className="w-full h-full"
                />
                
                
                <div className="absolute inset-0 bg-red-950/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center border border-red-500/30">
                  <X className="w-5 h-5 text-red-400 font-bold" />
                </div>
              </m.div>
            )
          } else {
            return (
              <div 
                key={`empty-${index}`}
                className="aspect-[2/3] rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/40 flex items-center justify-center text-slate-700 hover:border-slate-700 hover:text-slate-500 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
              </div>
            )
          }
        })}
      </div>

      
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/40 space-y-4">
        
        
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            aria-label="Search deck card database"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deck card database (e.g. Hog Rider, Zap)..."
            className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        
        <div className="h-64 overflow-y-auto gaming-scroll pr-1">
          {filteredAvailableCards.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-bold text-slate-500 uppercase tracking-widest">
              No matching card found
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
              {filteredAvailableCards.map((cardName) => {
                const isSelected = cards.includes(cardName)
                const rarity = getCardRarity(cardName)
                const elixir = cardElixirMap[cardName] || 3
                return (
                  <button
                    key={cardName}
                    type="button"
                    onClick={() => isSelected ? removeCard(cardName) : addCard(cardName)}
                    className={`relative rounded-xl border p-0.5 aspect-[2/3] transition-all group overflow-hidden ${
                      isSelected 
                        ? 'opacity-30 border-slate-800 pointer-events-auto cursor-pointer filter grayscale' 
                        : 'border-slate-800 hover:border-indigo-500/50 hover:scale-105 active:scale-95'
                    }`}
                    title={cardName}
                  >
                    <CardImage 
                      name={cardName} 
                      rarity={rarity} 
                      elixir={elixir}
                      className="w-full h-full"
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default DeckSelector
