# Clash Royale Deck Analytics

A clean full-stack app for Clash Royale deck ranking, matchup prediction, and deck evaluation.

---

## Features

- Dashboard with totals, top decks, card stats, and model status
- Leaderboard with win rate, Wilson score ranking, and min-games filtering
- Card analysis for popularity, win rate, and overrated/underrated status
- Deck evaluator with historical deck lookup, predicted win rate, and swap recommendations
- Matchup predictor with deck-vs-deck win probability, contributions, and matchup insights

---

## Project Structure

```
CR scraper/
├── backend/          # FastAPI backend
│   ├── main.py
│   └── requirements.txt
├── frontend/         # React + Vite UI
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── services/api.js
│       ├── hooks/useApi.js
│       ├── utils/constants.js
│       ├── components/
│       │   ├── DeckBadge.jsx
│       │   ├── DeckSelector.jsx
│       │   ├── ErrorDisplay.jsx
│       │   ├── Layout.jsx
│       │   ├── LoadingSpinner.jsx
│       │   ├── MetricCard.jsx
│       │   ├── WinRateGauge.jsx
│       │   └── DataTable.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Leaderboard.jsx
│           ├── CardAnalysis.jsx
│           ├── DeckEvaluator.jsx
│           └── MatchupPredictor.jsx
├── src/              # Data pipeline and ML scripts
│   ├── api_scraper.py
│   ├── preprocess.py
│   ├── aggregate_decks.py
│   ├── card_stats.py
│   ├── train_model.py
│   ├── train_synergy_model.py
│   └── simulated_round_robin.py
├── data/             # Processed CSV datasets
├── models/           # Trained model artifacts
└── README.md
```

---

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Data pipeline

```bash
cd src
python api_scraper.py --seed "#2Y0V8PG" --max-players 1000 --out ../data/raw_battlelog.jsonl
python preprocess.py --in-file ../data/raw_battlelog.jsonl --out-csv ../data/processed_battles.csv
python aggregate_decks.py --in-csv ../data/processed_battles.csv --out-csv ../data/deck_leaderboard.csv
python card_stats.py --in-csv ../data/processed_battles.csv --out-csv ../data/card_stats.csv
python train_model.py
python train_synergy_model.py
python simulated_round_robin.py --out-csv ../data/model_leaderboard.csv
```

---

## API Endpoints

- `GET /health`
- `GET /data`
- `GET /leaderboard`
- `GET /card-stats`
- `GET /model-leaderboard`
- `POST /evaluate-deck`
- `POST /predict-matchup`
- `POST /find-swaps`

---

## Notes

- Frontend: React, Vite, Tailwind, Recharts
- Backend: FastAPI, CSV-backed data, model inference
- Pipeline: scraper, preprocess, deck aggregation, card stats, model training
