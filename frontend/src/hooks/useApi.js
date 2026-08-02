import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Generic API hook with loading, error, and data state management.
 */
export function useApi(apiFn, immediate = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiFn(...args)
        if (mountedRef.current) {
          setData(response)
          setLoading(false)
        }
        return response
      } catch (err) {
        if (mountedRef.current) {
          setError(err.response?.data?.detail || err.message || 'An error occurred')
          setLoading(false)
        }
        throw err
      }
    },
    [apiFn]
  )

  useEffect(() => {
    mountedRef.current = true
    if (immediate) {
      execute()
    }
    return () => {
      mountedRef.current = false
    }
  }, [execute, immediate])

  return { data, loading, error, execute, setData }
}

/**
 * Hook for POST requests with loading and error state.
 */
export function usePost(apiFn) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const execute = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFn(payload)
      setData(response)
      setLoading(false)
      return response
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'An error occurred'
      setError(message)
      setLoading(false)
      throw err
    }
  }, [apiFn])

  return { data, loading, error, execute }
}
