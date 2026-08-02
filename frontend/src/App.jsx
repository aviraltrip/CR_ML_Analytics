import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Leaderboard from './pages/Leaderboard'
import CardAnalysis from './pages/CardAnalysis'
import DeckEvaluator from './pages/DeckEvaluator'
import MatchupPredictor from './pages/MatchupPredictor'

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/cards" element={<CardAnalysis />} />
        <Route path="/evaluator" element={<DeckEvaluator />} />
        <Route path="/matchup" element={<MatchupPredictor />} />
        {/* Fallback to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
