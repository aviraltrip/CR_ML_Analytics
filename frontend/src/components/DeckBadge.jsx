import React from 'react'

/**
 * Displays a single card name as a badge.
 */
export function CardBadge({ card, className = '' }) {
  return (
    <span className={`card-badge ${className}`}>
      {card}
    </span>
  )
}

/**
 * Displays a list of cards as badges in a deck container.
 */
export function DeckBadge({ cards, className = '' }) {
  return (
    <div className={`deck-container ${className}`}>
      {cards.map((card) => (
        <CardBadge key={card} card={card} />
      ))}
    </div>
  )
}

export default DeckBadge
