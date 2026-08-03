import React from 'react'

export function WinRateGauge({ probability }) {
  const percentage = Math.round(probability * 100)
  const gaugeColor =
    probability >= 0.55
      ? 'bg-green-400'
      : probability <= 0.45
      ? 'bg-red-400'
      : 'bg-yellow-400'

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-dark-400">Win Probability</p>
          <p className="text-2xl font-semibold text-white">{percentage}%</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${gaugeColor} text-black`}>
          {probability >= 0.55 ? 'Favored' : probability <= 0.45 ? 'Underdog' : 'Even'}
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-dark-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${gaugeColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-dark-400">
        This probability is based on model predictions and relative deck composition.
      </p>
    </div>
  )
}

export default WinRateGauge
