import React from 'react'

/**
 * Reusable metric card component.
 */
export function MetricCard({ label, value, subtitle, icon }) {
  return (
    <div className="metric-card animate-fade-in">
      {icon && <span className="text-2xl mb-2">{icon}</span>}
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {subtitle && <div className="text-xs text-dark-400 mt-1">{subtitle}</div>}
    </div>
  )
}

export default MetricCard
