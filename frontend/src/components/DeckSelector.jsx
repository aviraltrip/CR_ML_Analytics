import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { DECK_SIZE, CARD_LEVEL_RANGE, DEFAULT_CARD_LEVEL } from '../utils/constants'

/**
 * Deck selector component for choosing 8 cards and their levels.
 */
export function DeckSelector({
  label,
  cards,
  selectedCards,
  onSelectionChange,
  levels,
  onLevelsChange,
  disabled = false,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showLevels, setShowLevels] = useState(false)

  const filteredCards = cards.filter(
    (card) =>
      card.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedCards.includes(card)
  )

  const toggleCard = (card) => {
    if (selectedCards.includes(card)) {
      onSelectionChange(selectedCards.filter((c) => c !== card))
    } else if (selectedCards.length < DECK_SIZE) {
      onSelectionChange([...selectedCards, card])
    }
  }

  const updateLevel = (card, level) => {
    onLevelsChange({
      ...levels,
      [card]: level,
    })
  }

  const removeCard = (card) => {
    onSelectionChange(selectedCards.filter((c) => c !== card))
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <input
        type="text"
        placeholder="Search cards..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-dark-50 border border-dark-200/20 text-white placeholder-dark-400 focus:outline-none focus:border-crown-500"
        disabled={disabled}
      />

      {/* Selected cards */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {selectedCards.map((card) => (
          <span
            key={card}
            className="card-badge cursor-pointer hover:bg-red-900/30 hover:border-red-500/30 transition-colors"
            onClick={() => !disabled && removeCard(card)}
          >
            {card}
            {!disabled && (
              <X className="w-3 h-3 inline-block ml-1" />
            )}
          </span>
        ))}
        {selectedCards.length === 0 && (
          <span className="text-dark-400 text-sm">
            Select {DECK_SIZE} cards...
          </span>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 h-2 bg-dark-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-crown-500 rounded-full transition-all duration-300"
            style={{ width: `${(selectedCards.length / DECK_SIZE) * 100}%` }}
          />
        </div>
        <span className="text-dark-400">
          {selectedCards.length}/{DECK_SIZE}
        </span>
      </div>

      {/* Level adjustment */}
      {selectedCards.length === DECK_SIZE && (
        <button
          type="button"
          onClick={() => setShowLevels(!showLevels)}
          className="text-sm text-crown-400 hover:text-crown-300 transition-colors"
        >
          {showLevels ? 'Hide' : 'Adjust'} Card Levels
        </button>
      )}

      {showLevels && selectedCards.length === DECK_SIZE && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
          {selectedCards.map((card) => (
            <div key={card} className="flex items-center gap-2">
              <span className="text-xs text-dark-400 flex-1 truncate">
                {card}
              </span>
              <input
                type="number"
                min={CARD_LEVEL_RANGE.min}
                max={CARD_LEVEL_RANGE.max}
                value={levels[card] || DEFAULT_CARD_LEVEL}
                onChange={(e) =>
                  updateLevel(card, parseInt(e.target.value, 10) || 11)
                }
                className="w-16 px-2 py-1 rounded bg-dark-50 border border-dark-200/20 text-white text-center text-sm focus:outline-none focus:border-crown-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* Card search results */}
      {searchTerm && (
        <div className="max-h-48 overflow-y-auto bg-dark-50 rounded-lg border border-dark-200/20">
          {filteredCards.slice(0, 20).map((card) => (
            <button
              key={card}
              type="button"
              onClick={() => !disabled && toggleCard(card)}
              className="w-full text-left px-3 py-2 hover:bg-dark-100/50 transition-colors text-sm"
              disabled={disabled}
            >
              {card}
            </button>
          ))}
          {filteredCards.length === 0 && (
            <div className="px-3 py-2 text-dark-400 text-sm">
              No matching cards
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DeckSelector
