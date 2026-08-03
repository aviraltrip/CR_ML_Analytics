import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { DataTable } from '../components/DataTable'
import { STATUS_COLORS } from '../utils/constants'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'

const STATUS_ORDER = {
  Underrated: 0,
  'Strong/Meta': 1,
  'Weak/Niche': 2,
  Overrated: 3,
}

export function CardAnalysis() {
  const { data, loading, error, execute } = useApi(() => api.getCardStats())
  const [statusFilter, setStatusFilter] = useState('All')

  const cardStats = data?.card_stats || []

  const filteredCards =
    statusFilter === 'All'
      ? cardStats
      : cardStats.filter((c) => c.status === statusFilter)

  const chartData = filteredCards
    .sort((a, b) => a.win_rate_diff - b.win_rate_diff)
    .map((c) => ({
      name: c.card.length > 15 ? c.card.slice(0, 15) + '…' : c.card,
      fullName: c.card,
      winRateDiff: +(c.win_rate_diff * 100).toFixed(1),
      popularity: +(c.popularity * 100).toFixed(1),
      winRate: +(c.win_rate * 100).toFixed(1),
      status: c.status,
      matches: c.matches_played,
    }))

  const statusCounts = {
    All: cardStats.length,
    Underrated: cardStats.filter((c) => c.status === 'Underrated').length,
    'Strong/Meta': cardStats.filter((c) => c.status === 'Strong/Meta').length,
    'Weak/Niche': cardStats.filter((c) => c.status === 'Weak/Niche').length,
    Overrated: cardStats.filter((c) => c.status === 'Overrated').length,
  }

  const columns = [
    { key: 'card', label: 'Card' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const colors = STATUS_COLORS[val] || {}
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {val}
          </span>
        )
      },
    },
    {
      key: 'popularity',
      label: 'Popularity',
      render: (val) => `${(val * 100).toFixed(2)}%`,
    },
    {
      key: 'win_rate',
      label: 'Win Rate',
      render: (val) => `${(val * 100).toFixed(1)}%`,
    },
    {
      key: 'win_rate_diff',
      label: 'Win Rate Diff',
      render: (val) => (
        <span className={val >= 0 ? 'text-green-400' : 'text-red-400'}>
          {val >= 0 ? '+' : ''}
          {(val * 100).toFixed(1)}%
        </span>
      ),
    },
    { key: 'matches_played', label: 'Matches' },
  ]

  if (loading) {
    return <LoadingSpinner message="Loading card statistics..." />
  }

  if (error) {
    return (
      <ErrorDisplay message={error} onRetry={() => execute()} />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl gradient-text">
          Overrated vs. Underrated Cards
        </h1>
        <p className="text-dark-400 mt-1">
          Cards are classified by popularity and win rate differential.
          Underrated cards have high win rates but low usage.
        </p>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === status
                ? 'bg-crown-500/20 text-crown-400 border border-crown-500/30'
                : 'bg-dark-50/50 text-dark-400 border border-dark-200/20 hover:text-white'
            }`}
          >
            {status} ({count})
          </button>
        ))}
      </div>

      {filteredCards.length > 0 ? (
        <>
          {/* Chart */}
          <div className="glass-card p-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  type="number"
                  label={{
                    value: 'Win Rate Margin vs 50% Average (%)',
                    position: 'insideBottom',
                    offset: -5,
                    fill: '#A0AEC0',
                    fontSize: 12,
                  }}
                  tick={{ fill: '#A0AEC0', fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#E2E8F0', fontSize: 11 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(26, 32, 44, 0.95)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '8px',
                    color: '#E2E8F0',
                  }}
                  formatter={(value, name) => [`${value}%`, name]}
                />
                <ReferenceLine x={0} stroke="#888" strokeDasharray="3 3" />
                <Bar
                  dataKey="winRateDiff"
                  radius={[0, 4, 4, 0]}
                  fill="#8884d8"
                >
                  {chartData.map((entry, index) => {
                    const colors = {
                      Underrated: '#22c55e',
                      'Strong/Meta': '#3b82f6',
                      'Weak/Niche': '#6b7280',
                      Overrated: '#ef4444',
                    }
                    return (
                      <rect
                        key={index}
                        fill={colors[entry.status] || '#8884d8'}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Full Card Statistics</h2>
            <DataTable columns={columns} data={filteredCards} />
          </div>
        </>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-white font-semibold">No cards match this filter yet.</p>
          <p className="text-sm text-dark-400 mt-1">
            Try switching to a broader status view or re-running the pipeline to refresh the card stats.
          </p>
        </div>
      )}
    </div>
  )
}

export default CardAnalysis
