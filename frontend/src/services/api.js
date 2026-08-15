import axios from 'axios'




const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})




apiClient.interceptors.request.use(
  (config) => {
    
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
      
      const message = error.response.data?.detail || error.message
      console.error(`API Error ${error.response.status}:`, message)
    } else if (error.request) {
      
      console.error('Network Error: No response from server')
    } else {
      console.error('Request Error:', error.message)
    }
    return Promise.reject(error)
  }
)




export const api = {
  
  health: () => apiClient.get('/health'),

  
  getAllData: (minGames = 5) =>
    apiClient.get('/data', { params: { min_games: minGames } }),

  
  getLeaderboard: (minGames = 5) =>
    apiClient.get('/leaderboard', { params: { min_games: minGames } }),

  
  getCardStats: () => apiClient.get('/card-stats'),

  
  getModelLeaderboard: (minGames = 5) =>
    apiClient.get('/model-leaderboard', { params: { min_games: minGames } }),

  
  evaluateDeck: (payload) => apiClient.post('/evaluate-deck', payload),

  
  predictMatchup: (payload) => apiClient.post('/predict-matchup', payload),

  
  findSwaps: (payload) => apiClient.post('/find-swaps', payload),
}

export default apiClient
