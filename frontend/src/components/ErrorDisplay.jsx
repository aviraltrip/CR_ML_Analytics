import React from 'react'
import { m } from 'framer-motion'
import { AlertOctagon, RefreshCw } from 'lucide-react'

export function ErrorDisplay({ message, onRetry }) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-8 text-center max-w-md mx-auto border-2 border-red-500/20 bg-gradient-to-b from-red-500/5 to-transparent rounded-2xl flex flex-col items-center justify-center shadow-xl shadow-red-950/10"
    >
      <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 text-red-400 mb-4 animate-[pulse_2s_infinite]">
        <AlertOctagon className="w-10 h-10" />
      </div>
      
      <h3 className="text-xl font-black text-red-400 tracking-tight font-mono uppercase">
        Operation Failed
      </h3>
      
      <p className="text-slate-400 mt-2 mb-6 text-sm leading-relaxed">
        {message || 'An unexpected API error occurred while contacting the server.'}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-red-900/30 transition-all text-sm uppercase tracking-wider"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Request
        </button>
      )}
    </m.div>
  )
}

export default ErrorDisplay
