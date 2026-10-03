import React, { useState, useEffect, lazy, Suspense } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { DataTable } from '../components/DataTable'
import { CardImage } from '../components/CardImage'
import { STATUS_COLORS, getCardRarity } from '../utils/constants'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'
import { Grid, List, BarChart3, TrendingUp, Sparkles } from 'lucide-react'

const CardPerformanceChart = lazy(() => import('../components/CardPerformanceChart'))


function getCardMetaRating(winRate) {
  const wr = parseFloat(winRate)
  if (wr >= 0.53) return 'S'
  if (wr >= 0.50) return 'A'
  if (wr >= 0.47) return 'B'
  return 'C'
}

const mapCardData = (c) => ({
  name: c.card,
  winRateDiff: +(c.win_rate_diff * 100).toFixed(1),
  popularity: +(c.popularity * 100).toFixed(1),
  winRate: +(c.win_rate * 100).toFixed(1),
  status: c.status,
  matches: c.matches_played,
})

export function CardAnalysis() {
  const { data, loading, error, execute } = useApi(() => api.getCardStats())
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMode, setViewMode] = useState('grid') 
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  const cardStats = data?.card_stats || []

  const filteredCards =
    statusFilter === 'All'
      ? cardStats
      : cardStats.filter((c) => c.status === statusFilter)

  const totalCards = filteredCards.length
  const totalPages = Math.ceil(totalCards / pageSize)
  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  
  const sortedCards = filteredCards.toSorted((a, b) => b.win_rate_diff - a.win_rate_diff)

  const shouldSplit = filteredCards.length > 20
  const overperformingData = sortedCards.slice(0, 15).map(mapCardData)
  const underperformingData = [...sortedCards].reverse().slice(0, 15).map(mapCardData)
  const singleChartData = sortedCards.map(mapCardData)

  const statusCounts = {
    All: cardStats.length,
    Underrated: cardStats.filter((c) => c.status === 'Underrated').length,
    'Strong/Meta': cardStats.filter((c) => c.status === 'Strong/Meta').length,
    'Weak/Niche': cardStats.filter((c) => c.status === 'Weak/Niche').length,
    Overrated: cardStats.filter((c) => c.status === 'Overrated').length,
  }

  
  const columns = [
    { 
      key: 'card', 
      label: 'Card',
      render: (val) => {
        const rarity = getCardRarity(val)
        return (
          <div className="flex items-center gap-3">
            <CardImage name={val} rarity={rarity} className="h-10 w-8 flex-shrink-0" />
            <span className="font-bold text-white text-sm">{val}</span>
          </div>
        )
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const colors = STATUS_COLORS[val] || {}
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase border ${colors.bg} ${colors.text} ${colors.border}`}
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
      align: 'right',
      render: (val) => `${(val * 100).toFixed(2)}%`,
    },
    {
      key: 'win_rate',
      label: 'Win Rate',
      align: 'right',
      render: (val) => `${(val * 100).toFixed(1)}%`,
    },
    {
      key: 'win_rate_diff',
      label: 'Win Rate Diff',
      align: 'right',
      render: (val) => (
        <span className={`font-mono font-bold ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {val >= 0 ? '+' : ''}
          {(val * 100).toFixed(1)}%
        </span>
      ),
    },
    { 
      key: 'matches_played', 
      label: 'Matches', 
      align: 'right',
      render: (val) => val.toLocaleString() 
    },
  ]

  if (loading) {
    return <LoadingSpinner message="Analyzing card popularity and win rates..." />
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={() => execute()} />
  }

  return (
    <m.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/60 border border-slate-800 rounded-xl w-fit">
          {Object.entries(statusCounts).map(([status, count]) => {
            const isActive = statusFilter === status
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status} ({count})
              </button>
            )
          })}
        </div>

        
        <div className="flex p-1 bg-slate-900/60 border border-slate-800 rounded-xl w-fit self-end md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filteredCards.length > 0 ? (
        <div className="space-y-8">
          
          
          {shouldSplit ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="glass-panel p-6 rounded-2xl flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                    Top 15 Overperforming Cards
                  </span>
                </div>
                <div className="w-full border border-slate-800/40 rounded-xl bg-slate-950/30 p-2">
                  <Suspense fallback={<div className="h-[380px] flex items-center justify-center text-slate-500 text-xs">Loading performance chart...</div>}>
                    <CardPerformanceChart chartData={overperformingData} height={380} />
                  </Suspense>
                </div>
              </div>

              
              <div className="glass-panel p-6 rounded-2xl flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                    Top 15 Underperforming Cards
                  </span>
                </div>
                <div className="w-full border border-slate-800/40 rounded-xl bg-slate-950/30 p-2">
                  <Suspense fallback={<div className="h-[380px] flex items-center justify-center text-slate-500 text-xs">Loading performance chart...</div>}>
                    <CardPerformanceChart chartData={underperformingData} height={380} />
                  </Suspense>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Win Rate Margin vs 50% Baseline
                </span>
              </div>
              <div className="w-full max-h-[550px] overflow-y-auto pr-2 border border-slate-800/40 rounded-xl bg-slate-950/30 p-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-500 text-xs">Loading performance chart...</div>}>
                  <CardPerformanceChart chartData={singleChartData} height={Math.max(singleChartData.length * 24, 300)} />
                </Suspense>
              </div>
            </div>
          )}

          
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <m.div
                key="grid-mode"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4"
              >
                {paginatedCards.map((c, index) => {
                  const colors = STATUS_COLORS[c.status] || {}
                  const rarity = getCardRarity(c.card)
                  const metaRating = getCardMetaRating(c.win_rate)

                  return (
                    <m.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(0.2, index * 0.02) }}
                      whileHover={{ y: -4 }}
                      key={c.card}
                      className="glass-panel p-4 rounded-2xl flex flex-col justify-between items-center group relative text-center border border-slate-800/60"
                    >
                      
                      <div className="absolute top-2.5 right-2.5 z-10 font-black font-mono text-xs rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-400 w-6 h-6 flex items-center justify-center shadow-lg">
                        {metaRating}
                      </div>

                      
                      <CardImage
                        name={c.card}
                        rarity={rarity}
                        className="h-28 w-20 mb-3"
                      />

                      
                      <h4 className="font-extrabold text-sm text-white truncate max-w-full">
                        {c.card}
                      </h4>

                      
                      <span className={`mt-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider leading-none ${colors.bg} ${colors.text} ${colors.border}`}>
                        {c.status}
                      </span>

                      
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-800/40 w-full text-[10px] font-semibold text-slate-400">
                        <div>
                          <span className="block text-slate-500 text-[8px] uppercase tracking-wide">Usage</span>
                          <span className="text-white font-mono font-bold mt-0.5 block">
                            {(c.popularity * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-500 text-[8px] uppercase tracking-wide">Win Rate</span>
                          <span className="text-white font-mono font-bold mt-0.5 block">
                            {(c.win_rate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      
                      <div className="absolute inset-0 bg-[#0c1220]/95 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
                          Detailed Stats
                        </span>
                        <p className="text-xs font-bold text-white">{c.card}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">{rarity} rarity</p>
                        
                        <div className="space-y-1.5 mt-4 text-xs w-full text-left bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 font-medium">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Margin vs 50%:</span>
                            <span className={c.win_rate_diff >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                              {c.win_rate_diff >= 0 ? '+' : ''}{(c.win_rate_diff * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Total Matches:</span>
                            <span className="text-white font-mono font-bold">{c.matches_played.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                    </m.div>
                  )
                })}
              </m.div>
            ) : (
              <m.div
                key="table-mode"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Full Card Statistics Table
                </h3>
                <DataTable columns={columns} data={paginatedCards} />
              </m.div>
            )}
          </AnimatePresence>

          
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/40 mt-8">
              <span className="text-xs font-bold text-slate-400">
                Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong className="text-white">{Math.min(currentPage * pageSize, totalCards)}</strong> of{' '}
                <strong className="text-white">{totalCards}</strong> cards
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-800/50 bg-slate-900/60 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800/60"
                >
                  Prev
                </button>
                
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).reduce((acc, p) => {
                  if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
                    const lastPage = acc.lastPage
                    const showEllipsis = lastPage !== undefined && p - lastPage > 1
                    acc.lastPage = p
                    acc.items.push(
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-2 text-slate-500 text-xs font-bold">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border ${
                            currentPage === p
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]'
                              : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800/40'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    )
                  }
                  return acc
                }, { items: [], lastPage: undefined }).items}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-800/50 bg-slate-900/60 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800/60"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800">
          <p className="text-white font-semibold">No cards meet the current filter criteria.</p>
        </div>
      )}

    </m.div>
  )
}

export default CardAnalysis
