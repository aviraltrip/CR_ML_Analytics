import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { DECK_SIZE } from '../utils/constants'

export function DeckSelector({ label, cards, setCards, maxCards = DECK_SIZE, description }) {
  const [inputValue, setInputValue] = useState('')

  const addCards = () => {
    const parsed = inputValue
      .split(/[,\n]+/)
      .map((card) => card.trim())
      .filter((card) => card)

    const next = [...cards]
    for (const card of parsed) {
      if (next.length >= maxCards) break
      if (!next.includes(card)) next.push(card)
    }

    if (next.length !== cards.length) {
      setCards(next)
    }
    setInputValue('')
  }

  const removeCard = (cardToRemove) => {
    setCards(cards.filter((card) => card !== cardToRemove))
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">{label}</h2>
          <span className="text-xs text-dark-400">{cards.length}/{maxCards}</span>
        </div>
        {description && <p className="text-sm text-dark-400 mt-1">{description}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCards()
              }
            }}
            placeholder="Add cards separated by commas or new lines"
            className="flex-1 rounded-lg border border-dark-200/20 bg-dark-900 px-3 py-2 text-sm text-white focus:border-crown-500/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={addCards}
            className="inline-flex items-center gap-2 rounded-lg bg-crown-600 px-4 py-2 text-sm font-semibold text-white hover:bg-crown-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {cards.length === 0 ? (
            <div className="text-sm text-dark-400">No cards selected yet.</div>
          ) : (
            cards.map((card) => (
              <button
                key={card}
                type="button"
                onClick={() => removeCard(card)}
                className="inline-flex items-center gap-2 rounded-full border border-dark-200/20 bg-dark-800 px-3 py-2 text-sm text-white hover:border-crown-500/30"
              >
                {card}
                <X className="w-3 h-3" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DeckSelector
