import React, { useState } from 'react'

/**
 * Normalizes card names to match RoyaleAPI cr-api-assets naming conventions.
 */
export function getCardSlug(cardName) {
  if (!cardName) return ''
  
  const specialCases = {
    "Mini P.E.K.K.A": "mini-pekka",
    "P.E.K.K.A": "pekka",
    "X-Bow": "x-bow",
    "The Log": "the-log",
  }
  
  if (specialCases[cardName]) {
    return specialCases[cardName]
  }
  
  return cardName
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '-')
    .replace(/'/g, '')
}

/**
 * Helper to get border colors matching Clash Royale rarity colors.
 */
export function getRarityBorder(rarity) {
  const normalized = (rarity || '').toLowerCase()
  switch (normalized) {
    case 'common':
      return 'border-slate-500 bg-slate-900/80 shadow-[0_0_8px_rgba(148,163,184,0.1)]'
    case 'rare':
      return 'border-amber-500 bg-amber-950/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
    case 'epic':
      return 'border-purple-500 bg-purple-950/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
    case 'legendary':
      return 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_16px_rgba(34,211,238,0.4)] animate-[pulse_3s_infinite]'
    case 'champion':
      return 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_20px_rgba(234,179,8,0.5)]'
    default:
      return 'border-slate-700/50 bg-slate-900/60'
  }
}

/**
 * Premium Card Image component with rarity styles, elixir bubbles, and image error handling.
 */
export function CardImage({ 
  name, 
  rarity = '', 
  elixir = null, 
  level = null, 
  className = '', 
  imgClassName = '', 
  showName = false 
}) {
  const [hasError, setHasError] = useState(false)
  const slug = getCardSlug(name)
  const imageUrl = name === 'Ronin'
    ? '/ronin.png'
    : `https://royaleapi.github.io/cr-api-assets/cards/${slug}.png`
  
  const borderClass = getRarityBorder(rarity)

  return (
    <div className={`relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 hover:scale-105 group overflow-visible ${borderClass} ${className}`}>
      {/* Elixir Cost Bubble */}
      {elixir !== null && (
        <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-magenta-500 border border-magenta-300 shadow-[0_2px_5px_rgba(0,0,0,0.4)] text-[11px] font-bold text-white bg-gradient-to-br from-pink-500 to-purple-600">
          {elixir}
        </div>
      )}
      
      {/* Level Tag */}
      {level !== null && (
        <div className="absolute -bottom-2 right-1 z-10 rounded bg-slate-950/80 border border-slate-700 px-1 py-0.5 text-[9px] font-mono font-bold text-cyan-300">
          Lvl {level}
        </div>
      )}

      {/* Card Artwork */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-[10px]">
        {hasError || !name ? (
          // Fallback Placeholder
          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 text-center p-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {name ? name.substring(0, 3) : 'CR'}
            </span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={name}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${imgClassName}`}
            loading="lazy"
          />
        )}
      </div>

      {/* Optional Card Name Label */}
      {showName && name && (
        <div className="w-full text-center mt-1 py-0.5 px-1 truncate bg-slate-950/70 text-[10px] font-semibold text-slate-200 border-t border-slate-800">
          {name}
        </div>
      )}
    </div>
  )
}

export default CardImage
