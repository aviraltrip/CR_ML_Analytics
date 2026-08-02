import axios from 'axios'

// ---------------------------------------------------------------------------
// API Configuration
// ---------------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.message
      console.error(`API Error ${error.response.status}:`, message)
    } else if (error.request) {
      // No response received (network error)
      console.error('Network Error: No response from server')
    } else {
      console.error('Request Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------
export const api = {
  // Health check
  health: () => apiClient.get('/health'),

  // Get all data
  getAllData: (minGames = 5) =>
    apiClient.get('/data', { params: { min_games: minGames } }),

  // Get leaderboard
  getLeaderboard: (minGames = 5) =>
    apiClient.get('/leaderboard', { params: { min_games: minGames } }),

  // Get card stats
  getCardStats: () => apiClient.get('/card-stats'),

  // Get model leaderboard
  getModelLeaderboard: (minGames = 5) =>
    apiClient.get('/model-leaderboard', { params: { min_games: minGames } }),

  // Evaluate a deck
  evaluateDeck: (payload) => apiClient.post('/evaluate-deck', payload),

  // Predict matchup
  predictMatchup: (payload) => apiClient.post('/predict-matchup', payload),

  // Find optimal swaps
  findSwaps: (payload) => apiClient.post('/find-swaps', payload),
}

export default apiClient
