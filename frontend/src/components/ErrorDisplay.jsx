import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Error display component with retry action.
 */
export function ErrorDisplay({ message, onRetry }) {
  return (
    <div className="glass-card p-6 text-center animate-fade-in">
      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
      <p className="text-dark-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-crown-600 hover:bg-crown-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorDisplay
