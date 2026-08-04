import React from 'react'
import { motion } from 'framer-motion'

/**
 * Premium reusable metric card component for KPIs.
 * Features hover animations, trend badges, and icons.
 */
export function MetricCard({ 
  label, 
  value, 
  subtitle = null, 
  icon: Icon = null, 
  trend = null, // e.g. { value: "+2.4%", positive: true }
  className = '' 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
      className={`glass-card rounded-2xl p-5 md:p-6 flex flex-col justify-between relative overflow-hidden group ${className}`}
    >
      {/* Decorative background pulse */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-500"></div>

      <div className="flex items-start justify-between">
        {/* Metric Label & Title */}
        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            {label}
          </span>
          <h3 className="text-2xl md:text-3xl font-black text-white mt-1 tracking-tight font-mono">
            {value}
          </h3>
        </div>

        {/* Icon representation */}
        {Icon && (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-indigo-400 group-hover:text-yellow-500 group-hover:border-slate-700 transition-colors duration-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Footer Info & Trend badge */}
      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/30 text-xs">
          {trend && (
            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              trend.positive 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-400 font-medium">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default MetricCard
