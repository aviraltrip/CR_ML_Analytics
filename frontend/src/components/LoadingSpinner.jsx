import React from 'react'
import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ message = 'Loading intelligence...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-16 h-16 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Outer spinning ring with glow */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl"></div>
        <Loader2 className={`animate-spin text-indigo-500 relative z-10 ${
          size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10'
        }`} />
      </div>

      {message && (
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner
