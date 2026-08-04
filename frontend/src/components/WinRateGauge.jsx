import React from 'react'
import { motion } from 'framer-motion'

export function WinRateGauge({ probability }) {
  const percentage = Math.round(probability * 100)
  
  // Color decisions
  const isFavored = probability >= 0.55
  const isUnderdog = probability <= 0.45
  
  let strokeColor = '#f1c40f' // Gold
  let glowColor = 'rgba(241, 196, 15, 0.4)'
  let textColor = 'text-yellow-400'
  let bgGradient = 'from-yellow-500/10 to-transparent'
  let labelText = 'Even'

  if (isFavored) {
    strokeColor = '#10b981' // Emerald
    glowColor = 'rgba(16, 185, 129, 0.4)'
    textColor = 'text-emerald-400'
    bgGradient = 'from-emerald-500/10 to-transparent'
    labelText = 'Favored'
  } else if (isUnderdog) {
    strokeColor = '#ef4444' // Red
    glowColor = 'rgba(239, 68, 68, 0.4)'
    textColor = 'text-red-400'
    bgGradient = 'from-red-500/10 to-transparent'
    labelText = 'Underdog'
  }

  // SVG parameters
  const radius = 50
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={`glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-b ${bgGradient} border-l-[3px] ${isFavored ? 'border-l-emerald-500' : isUnderdog ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
      
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 block">
        Win Probability
      </span>

      {/* Radial Gauge Container */}
      <div className="relative w-36 h-36 flex items-center justify-center mb-4">
        <svg className="w-full h-full transform -rotate-90 overflow-visible">
          {/* Background Track Circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            fill="transparent"
            stroke="rgba(30, 41, 59, 0.6)"
            strokeWidth={strokeWidth}
          />
          {/* Animated Value Arc */}
          <motion.circle
            cx="72"
            cy="72"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${strokeColor})`
            }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute flex flex-col items-center justify-center">
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-3xl font-black font-mono text-white tracking-tighter"
          >
            {percentage}%
          </motion.span>
          <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full mt-1 bg-slate-900 border border-slate-800 ${textColor}`}>
            {labelText}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 max-w-[210px] leading-relaxed">
        This is a level-adjusted machine learning calculation based on deck matchup history.
      </p>
    </div>
  )
}

export default WinRateGauge
