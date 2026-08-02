import React from 'react'

/**
 * Loading spinner component with optional message.
 */
export function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${sizeClasses[size]} border-4 border-crown-500/30 border-t-crown-500 rounded-full animate-spin`}
      />
      {message && (
        <p className="mt-3 text-sm text-dark-400 animate-pulse-slow">
          {message}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner
