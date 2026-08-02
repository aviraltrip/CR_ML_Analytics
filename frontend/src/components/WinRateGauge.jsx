import React from 'react'
import {
  GaugeChart,
  Gauge,
  GaugeLabel,
  GaugePointer,
  GaugeValue,
} from 'recharts'

/**
 * Win rate gauge chart using Recharts.
 * Displays win probability with color-coded zones.
 */
export function WinRateGauge({ probability, size = 250 }) {
  const pct = Math.round(probability * 100)

  const getColor = () => {
    if (probability > 0.55) return '#22c55e' // green - favorable
    if (probability < 0.45) return '#ef4444' // red - unfavorable
    return '#eab308' // yellow - even
  }

  const getVerdict = () => {
    if (probability > 0.55) return 'Favorable'
    if (probability < 0.45) return 'Unfavorable'
    return 'Even'
  }

  const getVerdictColor = () => {
    if (probability > 0.55) return 'text-green-400'
    if (probability < 0.45) return 'text-red-400'
    return 'text-yellow-400'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 }}>
        <svg viewBox={`0 0 ${size} ${size / 2}`} className="w-full h-full">
          {/* Background arc */}
          <path
            d={`M ${size * 0.1} ${size * 0.45} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.9} ${size * 0.45}`}
            fill="none"
            stroke="#333"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Green zone (55-100%) */}
          <path
            d={`M ${size * 0.55} ${size * 0.45} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.9} ${size * 0.45}`}
            fill="none"
            stroke="rgba(34, 197, 94, 0.3)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Yellow zone (45-55%) */}
          <path
            d={`M ${size * 0.45} ${size * 0.45} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.55} ${size * 0.45}`}
            fill="none"
            stroke="rgba(234, 179, 8, 0.3)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Red zone (0-45%) */}
          <path
            d={`M ${size * 0.1} ${size * 0.45} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.45} ${size * 0.45}`}
            fill="none"
            stroke="rgba(239, 68, 68, 0.3)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Value arc */}
          <path
            d={`M ${size * 0.1} ${size * 0.45} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.1 + (size * 0.8) * (probability)} ${size * 0.45 - Math.sin(probability * Math.PI) * size * 0.4}`}
            fill="none"
            stroke={getColor()}
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Needle */}
          <line
            x1={size / 2}
            y1={size * 0.45}
            x2={size / 2 + (probability - 0.5) * size * 0.6}
            y2={size * 0.45 - size * 0.15}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Center dot */}
          <circle
            cx={size / 2}
            cy={size * 0.45}
            r="4"
            fill="white"
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-3xl font-bold" style={{ color: getColor() }}>
            {pct}%
          </span>
          <span className="text-xs text-dark-400">Win Probability</span>
        </div>
      </div>

      {/* Verdict */}
      <div className={`mt-2 text-lg font-semibold ${getVerdictColor()}`}>
        {getVerdict()} Matchup
      </div>
    </div>
  )
}

export default WinRateGauge
