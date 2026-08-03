# Clash Royale Deck Analytics

A full-stack web application for analyzing Clash Royale decks, predicting matchup outcomes, and optimizing deck builds using machine learning — built on real match data from the Clash Royale API.

---

## 🚀 Features

| Page | Description |
|---|---|
| **Dashboard** | Overview of total battles, ranked decks, top deck win rate, most popular card, and ML model status |
| **Leaderboard** | Ranked list of decks by win rate with confidence-adjusted Wilson scores; filterable by minimum games played |
| **Card Analysis** | Per-card statistics — win rate, popularity, and overrated/underrated classification |
| **Deck Evaluator** | Assemble an 8-card deck, view historical performance or ML-predicted synergy scores, and get auto-suggested card swaps via Leave-One-Out analysis |
| **Matchup Predictor** | Compare two 8-card decks head-to-head with a win probability gauge, advantage/disadvantage breakdown, and trophy-adjusted predictions |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | FastAPI (Python 3.10+) |
| **ML / Data** | scikit-learn, pandas, numpy |
| **API** | REST (JSON), CORS-enabled, Axios client with interceptors |
| **Data Source** | Clash Royale official API (raw battle logs → processed CSVs) |

---

## 📁 Project Structure

```
CR scraper/
├── backend/                  # FastAPI backend
│   ├── main.py              # API routes, ML model loading, inference logic
│   └── requirements.txt     # Python dependencies
│
├── frontend/                 # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js        # Dev server + /api proxy to :8000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx           # Route definitions
│       ├── main.jsx          # Entry point
│       ├── index.css         # Tailwind + custom styles (glassmorphism, animations)
│       ├── services/
│       │   └── api.js        # Axios client + endpoint wrappers
│       ├── hooks/
│       │   └── useApi.js     # Generic useApi / usePost hooks
│       ├── utils/
│       │   └── constants.js  # Deck size, elixir thresholds, trophy range, etc.
│       ├── components/
│       │   ├── Layout.jsx         # Sticky header + nav + footer
│       │   ├── DeckSelector.jsx   # Card picker with search & level adjustment
│       │   ├── WinRateGauge.jsx   # SVG arc gauge for matchup probability
│       │   ├── MetricCard.jsx     # Reusable stat card
│       │   ├── DataTable.jsx      # Generic table renderer
│       │   ├── DeckBadge.jsx      # Card badge component
│       │   ├── LoadingSpinner.jsx
│       │   └── ErrorDisplay.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Leaderboard.jsx
│           ├── CardAnalysis.jsx
│           ├── DeckEvaluator.jsx
│           └── MatchupPredictor.jsx
│
├── src/                      # Data pipeline & ML training scripts
│   ├── api_scraper.py        # Fetches raw battle logs from Clash Royale API
│   ├── preprocess.py         # Cleans & transforms raw data into CSVs
│   ├── aggregate_decks.py    # Aggregates deck signatures from battle logs
│   ├── card_stats.py         # Computes per-card win rates & popularity
│   ├── train_model.py        # Trains the MLP synergy prediction model
│   ├── train_synergy_model.py# Trains the deck-level synergy classifier
│   ├── simulated_round_robin.py  # Simulates meta matchups for leaderboard
│   └── save_player_page.py   # (legacy / utility)
│
├── app/
│   └── streamlit_app.py      # Original Streamlit dashboard (reference)
│
├── models/                   # Trained ML artifacts
│   ├── synergy_predictor.pkl
│   ├── matchup_predictor.pkl
│   ├── card_vocab.json
│   └── card_elixir.json
│
├── data/                     # Processed CSV datasets
│   ├── raw_battlelog.jsonl
│   ├── processed_battles.csv
│   ├── deck_leaderboard.csv
│   ├── card_stats.csv
│   └── model_leaderboard.csv
│
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend (Python)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`.

### 2. Frontend (Node.js)

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://127.0.0.1:3000` and proxies `/api` requests to the FastAPI backend automatically via Vite's dev proxy.

### 3. Data Pipeline (one-time setup)

Before using the ML features, run the data pipeline:

```bash
cd src
python api_scraper.py       # Fetch raw battle logs
python preprocess.py        # Generate processed CSVs
python aggregate_decks.py   # Build deck signatures
python card_stats.py        # Compute card-level stats
python train_model.py       # Train ML models
python simulated_round_robin.py  # Simulate meta matchups
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check + model load status |
| `GET` | `/data` | All datasets (battles, leaderboard, card stats) |
| `GET` | `/leaderboard` | Filtered deck leaderboard (`min_games` query param) |
| `GET` | `/card-stats` | Per-card statistics for analysis charts |
| `GET` | `/model-leaderboard` | ML-predicted leaderboard rankings |
| `POST` | `/evaluate-deck` | Evaluate a deck (historical lookup or ML prediction) |
| `POST` | `/predict-matchup` | Predict win probability between two decks |
| `POST` | `/find-swaps` | LOO-based auto-suggest card swaps |

### Example request — Evaluate a deck

```json
POST /evaluate-deck
{
  "cards": ["Arrows", "Baby Dragon", "Bandit", "Cannon", "Electro Wizard", "Ice Golem", "Knight", "Tombstone"],
  "levels": { "Arrows": 11, "Baby Dragon": 11, "Bandit": 11, "Cannon": 11, "Electro Wizard": 11, "Ice Golem": 11, "Knight": 11, "Tombstone": 11 }
}
```

---

## 🎨 Design Notes

- **Dark theme** with a crown/gold accent palette — Clash Royale branding
- **Glassmorphism cards** with subtle gold borders and hover effects
- **Responsive layout** — mobile nav with horizontal scroll, desktop sidebar-style nav
- **Tailwind CSS** for utility-first styling; custom animations for fade-in and slide-up transitions
- **Recharts** for data visualization (bar charts, line charts, pie charts)

---

## 📄 License

MIT
