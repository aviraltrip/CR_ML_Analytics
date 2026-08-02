"""
streamlit_app.py — Interactive dashboard for Clash Royale Best Deck analytics.
"""

import os
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
import pickle
import numpy as np

# Load ML Model
@st.cache_resource
def load_ml_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "models", "synergy_predictor.pkl")
    vocab_path = os.path.join(base_dir, "models", "card_vocab.json")
    if not os.path.exists(model_path) or not os.path.exists(vocab_path):
        return None, None
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(vocab_path, "r", encoding="utf-8") as f:
        vocab = json.load(f)
    return model, vocab

model, card_vocab = load_ml_model()


def calculate_aec(deck_cards: list, card_elixir: dict) -> float:
    costs = [card_elixir.get(c, 3.5) for c in deck_cards]
    return sum(costs) / len(costs)

# Set page configuration
st.set_page_config(
    page_title="Clash Royale Best Deck Finder",
    page_icon="👑",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for premium glassmorphism and modern UI feel
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Outfit:wght@400;600;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .main-title {
        font-family: 'Outfit', sans-serif;
        font-weight: 800;
        font-size: 3rem;
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF4500 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    
    .subtitle {
        font-size: 1.2rem;
        color: #A0AEC0;
        margin-bottom: 2rem;
    }
    
    .metric-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
        transition: transform 0.2s, border-color 0.2s;
    }
    .metric-card:hover {
        transform: translateY(-2px);
        border-color: rgba(255, 215, 0, 0.3);
    }
    .metric-value {
        font-size: 2.2rem;
        font-weight: 700;
        color: #FFFFFF;
        margin-bottom: 0.2rem;
    }
    .metric-label {
        font-size: 0.9rem;
        color: #CBD5E0;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .card-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        padding: 4px 12px;
        margin: 4px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #E2E8F0;
    }
    
    .deck-container {
        background: rgba(26, 32, 44, 0.5);
        border: 1px solid rgba(255, 215, 0, 0.15);
        border-radius: 12px;
        padding: 1.2rem;
        margin-top: 1rem;
    }
</style>
""", unsafe_allow_html=True)

# Helper function to load data
@st.cache_data
def load_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    processed_path = os.path.join(base_dir, "data", "processed_battles.csv")
    leaderboard_path = os.path.join(base_dir, "data", "deck_leaderboard.csv")
    card_stats_path = os.path.join(base_dir, "data", "card_stats.csv")
    model_leaderboard_path = os.path.join(base_dir, "data", "model_leaderboard.csv")
    elixir_path = os.path.join(base_dir, "models", "card_elixir.json")
    
    # Check if files exist
    if not os.path.exists(processed_path) or not os.path.exists(leaderboard_path) or not os.path.exists(card_stats_path):
        return None, None, None, None, None
        
    df_battles = pd.read_csv(processed_path)
    df_leaderboard = pd.read_csv(leaderboard_path)
    df_card_stats = pd.read_csv(card_stats_path)
    
    if os.path.exists(model_leaderboard_path):
        df_model_leaderboard = pd.read_csv(model_leaderboard_path)
    else:
        df_model_leaderboard = None
        
    if os.path.exists(elixir_path):
        with open(elixir_path, "r", encoding="utf-8") as f:
            card_elixir = json.load(f)
    else:
        card_elixir = {}
        
    return df_battles, df_leaderboard, df_card_stats, df_model_leaderboard, card_elixir

df_battles, df_leaderboard, df_card_stats, df_model_leaderboard, card_elixir = load_data()

# Render fallbacks if data is missing
if df_battles is None or df_leaderboard is None or df_card_stats is None:
    st.error("⚠️ Data files are missing! Please make sure you have run the scraper and analysis scripts first:")
    st.code("""
    python src/api_scraper.py --seed "#LYQ2CLQU0" --max-players 500
    python src/preprocess.py
    python src/aggregate_decks.py
    python src/card_stats.py
    """)
    st.stop()

# Title and introduction
st.markdown('<div class="main-title">👑 Clash Royale "Best Deck" Analytics</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="subtitle">Scraped match statistics & confidence-adjusted rankings of decks using the official Clash Royale API.</div>',
    unsafe_allow_html=True
)

# Sidebar filters & info
with st.sidebar:
    st.markdown("### 📊 Dataset Overview")
    st.info(
        f"This dataset contains **{len(df_battles):,} unique matches** "
        f"across **{len(df_leaderboard):,} competitive decks** (min 5 plays) "
        f"scraped in a snowball fashion starting from seed player logs."
    )
    
    st.markdown("### ⚙️ Settings")
    min_games = st.slider("Min matches played for leaderboard", 2, 20, 5)
    
    st.markdown("---")
    st.markdown("Created for the **LinkedIn Weekend-Build** series. Backed by Wilson-score confidence intervals.")

# Recalculate leaderboard dynamically based on slider
df_leaderboard_filtered = df_leaderboard[df_leaderboard["matches_played"] >= min_games].copy().reset_index(drop=True)
# Recalculate rank after filter
df_leaderboard_filtered.insert(0, "Rank", df_leaderboard_filtered.index + 1)

# Highlights / Stats row
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.markdown(
        f'<div class="metric-card"><div class="metric-value">{len(df_battles):,}</div><div class="metric-label">Total Battles</div></div>',
        unsafe_allow_html=True
    )
with col2:
    st.markdown(
        f'<div class="metric-card"><div class="metric-value">{len(df_leaderboard_filtered):,}</div><div class="metric-label">Decks Ranked</div></div>',
        unsafe_allow_html=True
    )
with col3:
    # Top deck win rate
    top_wr = df_leaderboard_filtered.iloc[0]["win_rate"] if len(df_leaderboard_filtered) > 0 else 0
    st.markdown(
        f'<div class="metric-card"><div class="metric-value">{top_wr:.1%}</div><div class="metric-label">Top Deck Win Rate</div></div>',
        unsafe_allow_html=True
    )
with col4:
    # Most popular card
    most_popular = df_card_stats.sort_values(by="popularity", ascending=False).iloc[0]
    st.markdown(
        f'<div class="metric-card"><div class="metric-value">{most_popular["popularity"]:.1%}</div><div class="metric-label">Popularity ({most_popular["card"]})</div></div>',
        unsafe_allow_html=True
    )

st.markdown("<br>", unsafe_allow_html=True)

# Tabs setup
tab_leaderboard, tab_cards, tab_evaluator, tab_predictor = st.tabs([
    "🏆 Deck Leaderboard", 
    "📈 Overrated vs. Underrated Cards", 
    "🔍 Deck Evaluator",
    "🔮 Matchup Predictor"
])

# TAB 1: DECK LEADERBOARD
with tab_leaderboard:
    st.markdown("### 🏆 Deck Leaderboards")
    
    leaderboard_type = st.radio(
        "Select Leaderboard View:",
        options=["Historical (Wilson Score Adjusted)", "ML-Predicted (Simulated Round-Robin Synergy)"],
        horizontal=True
    )
    
    if leaderboard_type == "Historical (Wilson Score Adjusted)":
        st.write(
            "Decks are ranked by the **Wilson Score Lower Bound** of their historical win rate. "
            "This prevents low-sample flukes (like a deck going 2-0) from dominating the leaderboard "
            "and prioritizes decks that win consistently over a larger number of matches."
        )
        
        # Format table for display
        display_df = df_leaderboard_filtered.copy()
        display_df["win_rate"] = display_df["win_rate"].map(lambda x: f"{x:.1%}")
        display_df["wilson_score"] = display_df["wilson_score"].map(lambda x: f"{x:.3f}")
        
        # Show main table
        st.dataframe(
            display_df[["Rank", "wilson_score", "win_rate", "matches_played", "wins", "losses", "deck"]],
            use_container_width=True,
            hide_index=True,
            column_config={
                "deck": st.column_config.TextColumn("Deck Roster (Cards)"),
                "wilson_score": st.column_config.NumberColumn("Wilson Score", help="Adjusted win rate lower bound"),
                "win_rate": st.column_config.NumberColumn("Raw Win Rate"),
                "matches_played": st.column_config.NumberColumn("Matches"),
            }
        )
        
        # Inspector
        st.markdown("#### 🔍 Deck Inspector")
        selected_rank = st.number_input("Enter Deck Rank to inspect its cards:", min_value=1, max_value=max(1, len(df_leaderboard_filtered)), value=1, key="hist_inspect")
        
        if len(df_leaderboard_filtered) > 0:
            selected_deck_row = df_leaderboard_filtered.iloc[selected_rank - 1]
            cards = selected_deck_row["deck"].split(",")
            
            st.markdown(f"**Deck Rank #{selected_rank} Roster:**")
            
            # Display cards as custom HTML badges
            badge_html = "".join([f'<span class="card-badge">{c}</span>' for c in cards])
            st.markdown(f'<div class="deck-container">{badge_html}</div>', unsafe_allow_html=True)
            
            # Mini stat callout
            st.markdown(
                f"**Stats**: **{selected_deck_row['wins']} Wins** / **{selected_deck_row['losses']} Losses** "
                f"({selected_deck_row['win_rate']:.1%} raw win rate) across **{selected_deck_row['matches_played']} matches**. "
                f"Wilson Confidence Score: `{selected_deck_row['wilson_score']:.3f}`."
            )
    else:
        if df_model_leaderboard is None:
            st.warning("⚠️ ML-Predicted Leaderboard data is missing! Please run `python src/simulated_round_robin.py` to generate it first.")
        else:
            st.write(
                "Decks are ranked by their **Expected Win Rate** against the rest of the meta, "
                "simulated using our trained non-linear **MLP Synergy Model**. "
                "This highlights decks with strong overall synergy and counter-matchup profiles."
            )
            
            # Filter model leaderboard dynamically based on minimum games slider
            df_model_filtered = df_model_leaderboard[df_model_leaderboard["matches_played"] >= min_games].copy().reset_index(drop=True)
            df_model_filtered["Predictive_Rank"] = df_model_filtered.index + 1
            
            display_model_df = df_model_filtered.copy()
            display_model_df["simulated_win_rate"] = display_model_df["simulated_win_rate"].map(lambda x: f"{x:.1%}")
            display_model_df["win_rate"] = display_model_df["win_rate"].map(lambda x: f"{x:.1%}")
            
            st.dataframe(
                display_model_df[["Predictive_Rank", "simulated_win_rate", "elixir_cost", "win_rate", "matches_played", "wins", "losses", "deck"]],
                use_container_width=True,
                hide_index=True,
                column_config={
                    "Predictive_Rank": st.column_config.NumberColumn("ML Rank"),
                    "deck": st.column_config.TextColumn("Deck Roster (Cards)"),
                    "simulated_win_rate": st.column_config.NumberColumn("Simulated Win Rate", help="Model-predicted expected win rate against the meta"),
                    "elixir_cost": st.column_config.NumberColumn("Avg Elixir", format="%.2f", help="Average Elixir Cost of this deck"),
                    "win_rate": st.column_config.NumberColumn("Historical Win Rate"),
                    "matches_played": st.column_config.NumberColumn("Historical Matches"),
                }
            )
            
            # Inspector
            st.markdown("#### 🔍 Deck Inspector (ML Ranked)")
            selected_rank_ml = st.number_input("Enter ML Deck Rank to inspect its cards:", min_value=1, max_value=max(1, len(df_model_filtered)), value=1, key="ml_inspect")
            
            if len(df_model_filtered) > 0:
                selected_deck_row = df_model_filtered.iloc[selected_rank_ml - 1]
                cards = selected_deck_row["deck"].split(",")
                
                st.markdown(f"**ML Deck Rank #{selected_rank_ml} Roster:**")
                
                # Display cards as custom HTML badges
                badge_html = "".join([f'<span class="card-badge">{c}</span>' for c in cards])
                st.markdown(f'<div class="deck-container">{badge_html}</div>', unsafe_allow_html=True)
                
                # Mini stat callout
                st.markdown(
                    f"**Simulated Win Rate against Meta**: `{selected_deck_row['simulated_win_rate']:.1%}` | "
                    f"**Avg Elixir Cost**: `{selected_deck_row.get('elixir_cost', 0.0):.2f}`\n\n"
                    f"**Historical Stats**: **{selected_deck_row['wins']} Wins** / **{selected_deck_row['losses']} Losses** "
                    f"({selected_deck_row['win_rate']:.1%} raw win rate) across **{selected_deck_row['matches_played']} matches**."
                )

# TAB 2: OVERRATED VS UNDERRATED CARDS
with tab_cards:
    st.markdown("### 📈 Card Performance & Popularity")
    st.write(
        "By analyzing the win rates of individual cards across all decks they were included in, "
        "we can identify which cards are **Underrated** (low popularity, high win rate) "
        "versus **Overrated** (high popularity, low win rate)."
    )
    
    # Filter card stats for visualization
    # We'll plot the win_rate_diff (Win Rate - 50%)
    fig_df = df_card_stats.copy()
    fig_df["win_rate_diff_pct"] = fig_df["win_rate_diff"] * 100
    fig_df["popularity_pct"] = fig_df["popularity"] * 100
    fig_df["win_rate_pct"] = fig_df["win_rate"] * 100
    
    # Plotly bar chart
    fig = px.bar(
        fig_df.sort_values(by="win_rate_diff"), 
        x="win_rate_diff_pct", 
        y="card",
        color="status",
        orientation="h",
        color_discrete_map={
            "Underrated": "#2ECC71",  # Green
            "Strong/Meta": "#3498DB",  # Blue
            "Weak/Niche": "#95A5A6",   # Gray
            "Overrated": "#E74C3C"     # Red
        },
        labels={
            "win_rate_diff_pct": "Win Rate Margin vs 50% Average (%)",
            "card": "Card Name",
            "status": "Classification"
        },
        title="Card Win Rate Differentials (Colored by Status)",
        height=1200
    )
    
    fig.update_layout(
        template="plotly_dark",
        xaxis_title="Win Rate Margin (%)",
        yaxis_title="Card",
        font=dict(family="Inter, sans-serif"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)"
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Cards Table
    st.markdown("#### 📋 Full Card Statistics Table")
    display_cards = df_card_stats.copy()
    display_cards["win_rate"] = display_cards["win_rate"].map(lambda x: f"{x:.1%}")
    display_cards["popularity"] = display_cards["popularity"].map(lambda x: f"{x:.2%}")
    display_cards["win_rate_diff"] = display_cards["win_rate_diff"].map(lambda x: f"{x:+.1%}")
    
    st.dataframe(
        display_cards[["card", "status", "popularity", "win_rate", "win_rate_diff", "matches_played"]],
        use_container_width=True,
        hide_index=True,
        column_config={
            "card": "Card Name",
            "status": "Classification",
            "popularity": "Popularity",
            "win_rate": "Win Rate",
            "win_rate_diff": "Win Rate Diff",
            "matches_played": "Matches Played"
        }
    )

# TAB 3: DECK EVALUATOR
with tab_evaluator:
    st.markdown("### 🔍 Deck Evaluator")
    st.write(
        "Assemble any deck of 8 cards to check if it exists in the dataset, "
        "and receive a synergy breakdown based on individual card win rates and classifications."
    )
    
    # Get all unique cards
    all_cards_list = sorted(df_card_stats["card"].unique())
    
    # Multi-select input for 8 cards
    selected_cards = st.multiselect(
        "Select exactly 8 cards for your deck:",
        options=all_cards_list,
        max_selections=8
    )
    
    if len(selected_cards) < 8:
        st.warning(f"Please select exactly 8 cards. Currently selected: {len(selected_cards)}/8.")
    elif len(selected_cards) > 8:
        st.error("You selected more than 8 cards. Please remove some.")
    else:
        st.success("✅ 8-card roster assembled!")
        
        # Order cards alphabetically to look up signature
        search_sig = ",".join(sorted(selected_cards))
        
        # Look up deck in leaderboard
        deck_match = df_leaderboard[df_leaderboard["deck"] == search_sig]
        
        st.markdown("#### 📊 Deck Matchup Record")
        if len(deck_match) > 0:
            match_row = deck_match.iloc[0]
            st.metric(
                label="Leaderboard Rank",
                value=f"#{df_leaderboard[df_leaderboard['deck'] == search_sig].index[0] + 1}"
            )
            
            c1, c2, c3 = st.columns(3)
            with c1:
                st.metric("Matches Played", int(match_row["matches_played"]))
            with c2:
                st.metric("Win Rate", f"{match_row['win_rate']:.1%}")
            with c3:
                st.metric("Wilson Score", f"{match_row['wilson_score']:.3f}")
        else:
            if model is not None and card_vocab is not None and df_model_leaderboard is not None:
                st.info("ℹ️ This exact deck has no historical battles in the database. Let's calculate its predicted strength using the ML Synergy Model!")
                
                # Add expander to adjust levels for the live simulation
                sel_levels = {}
                with st.expander("Adjust Your Card Levels for Prediction (Defaults to 11)"):
                    level_cols = st.columns(4)
                    for idx_c, card in enumerate(selected_cards):
                        col_idx = idx_c % 4
                        with level_cols[col_idx]:
                            sel_levels[card] = st.number_input(
                                f"{card}", min_value=1, max_value=16, value=11, key=f"eval_lvl_{card}"
                            )
                
                meta_decks = df_model_leaderboard["deck"].tolist()
                num_meta = len(meta_decks)
                
                # Multi-hot vector and level vector for selected deck
                v_sel = np.zeros(len(card_vocab))
                v_sel_lvl = np.zeros(len(card_vocab))
                for card in selected_cards:
                    if card in card_vocab:
                        idx_v = card_vocab[card]
                        v_sel[idx_v] = 1.0
                        v_sel_lvl[idx_v] = sel_levels.get(card, 11.0)
                        
                X_eval = []
                for opponent_deck in meta_decks:
                    v_opp = np.zeros(len(card_vocab))
                    v_opp_lvl = np.zeros(len(card_vocab))
                    for card in opponent_deck.split(","):
                        if card in card_vocab:
                            idx_o = card_vocab[card]
                            v_opp[idx_o] = 1.0
                            v_opp_lvl[idx_o] = 11.0 # Assume standard tournament level for opponent meta decks
                            
                    presence_diff = v_sel - v_opp
                    level_diff = v_sel_lvl - v_opp_lvl
                    X_eval.append(np.concatenate([presence_diff, level_diff, [0.0]]))
                    
                X_eval = np.array(X_eval)
                probs = model.predict_proba(X_eval)[:, 1]
                
                # Calculate AEC and elixir penalty for the selected deck
                costs = [card_elixir.get(c, 3.5) for c in selected_cards]
                aec = sum(costs) / len(costs)
                if 2.8 <= aec <= 4.2:
                    penalty = 0.0
                elif aec < 2.8:
                    penalty = ((2.8 - aec) ** 2) * 0.15
                else:
                    penalty = ((aec - 4.2) ** 2) * 0.15
                    
                pred_win_rate = max(0.0, min(1.0, np.mean(probs) - penalty))
                
                # Estimate Rank among the 200 meta decks
                meta_rates = df_model_leaderboard["simulated_win_rate"].tolist()
                estimated_rank = 1
                for rate in meta_rates:
                    if pred_win_rate < rate:
                        estimated_rank += 1
                    else:
                        break
                        
                c1, c2, c3 = st.columns(3)
                with c1:
                    st.metric("Predicted Win Rate against Meta", f"{pred_win_rate:.1%}")
                with c2:
                    st.metric("Estimated ML Rank", f"#{estimated_rank} / {num_meta}")
                with c3:
                    st.metric("Avg Elixir Cost", f"{aec:.2f}")
            else:
                st.info("ℹ️ This exact 8-card deck was not found in our leaderboard dataset (it may have been played fewer than 5 times or not recorded yet). Let's check card synergy!")

        # Card-by-card stats breakdown
        st.markdown("#### 🃏 Individual Card Breakdown")
        
        # Filter stats for selected cards
        selected_stats = df_card_stats[df_card_stats["card"].isin(selected_cards)].copy()
        
        # Sort by win rate descending
        selected_stats = selected_stats.sort_values(by="win_rate", ascending=False)
        
        # Display selected cards table
        display_selected = selected_stats.copy()
        display_selected["win_rate"] = display_selected["win_rate"].map(lambda x: f"{x:.1%}")
        display_selected["popularity"] = display_selected["popularity"].map(lambda x: f"{x:.2%}")
        display_selected["win_rate_diff"] = display_selected["win_rate_diff"].map(lambda x: f"{x:+.1%}")
        
        st.dataframe(
            display_selected[["card", "status", "popularity", "win_rate", "win_rate_diff"]],
            use_container_width=True,
            hide_index=True,
            column_config={
                "card": "Card Name",
                "status": "Classification",
                "popularity": "Popularity",
                "win_rate": "Win Rate",
                "win_rate_diff": "Win Rate Diff vs Avg"
            }
        )
        
        # Calculate deck summary metrics
        avg_wr = selected_stats["win_rate"].mean()
        num_underrated = len(selected_stats[selected_stats["status"] == "Underrated"])
        num_overrated = len(selected_stats[selected_stats["status"] == "Overrated"])
        num_meta = len(selected_stats[selected_stats["status"] == "Strong/Meta"])
        
        st.markdown("#### 🧪 Synergy Summary")
        sc1, sc2, sc3 = st.columns(3)
        with sc1:
            st.metric("Average Card Win Rate", f"{avg_wr:.1%}")
        with sc2:
            st.metric("Underrated Cards", num_underrated, help="Rare but highly successful cards")
        with sc3:
            st.metric("Overrated Cards", num_overrated, help="Common but statistically lower win rate cards")
            
        # Synergy verdict
        st.markdown("**Deck Verdict:**")
        if num_overrated >= 3:
            st.warning("⚠️ **Highly Overrated Elements**: Your deck contains multiple popular cards that statistically underperform. Consider swapping them out for high-win-rate niche alternatives.")
        elif num_underrated >= 2:
            st.success("🚀 **Secret Powerhouse**: Your deck utilizes multiple underrated cards that win more than average but aren't widely played. This can catch opponents off guard!")
        elif num_meta >= 4:
            st.info("🛡️ **Stable Meta Deck**: Your deck relies heavily on highly-played, strong meta cards. It is statistically stable but highly predictable.")
        else:
            st.write("⚖️ **Balanced Deck**: A mix of card types with standard baseline performance.")

        # Auto-suggestions engine
        st.markdown("---")
        st.markdown("### 💡 Auto-Suggestions (Optimized Deck Builder)")
        st.write(
            "This engine uses the ML synergy model to identify the weakest card in your deck and loops through "
            "alternative cards to suggest the top 3 upgrades that will increase your deck's simulated win rate."
        )
        
        if model is None or card_vocab is None or df_model_leaderboard is None:
            st.warning("⚠️ Machine learning models are not loaded. Run retraining first.")
        else:
            if st.button("🚀 Find Optimal Card Swaps", key="btn_optimize"):
                with st.spinner("Analyzing synergies and calculating replacements..."):
                    # Step 1: Run LOO to identify the weakest card in the selected deck
                    v_base = np.zeros(len(card_vocab))
                    v_base_lvl = np.zeros(len(card_vocab))
                    for c in selected_cards:
                        if c in card_vocab:
                            idx = card_vocab[c]
                            v_base[idx] = 1.0
                            v_base_lvl[idx] = 11.0
                            
                    meta_decks = df_model_leaderboard["deck"].tolist()
                    
                    # Compute base win rate
                    X_base = []
                    for opp in meta_decks:
                        v_opp = np.zeros(len(card_vocab))
                        v_opp_lvl = np.zeros(len(card_vocab))
                        for card in opp.split(","):
                            if card in card_vocab:
                                idx_o = card_vocab[card]
                                v_opp[idx_o] = 1.0
                                v_opp_lvl[idx_o] = 11.0
                        
                        presence_diff = v_base - v_opp
                        level_diff = v_base_lvl - v_opp_lvl
                        X_base.append(np.concatenate([presence_diff, level_diff, [0.0]]))
                        
                    X_base = np.array(X_base)
                    base_wr_raw = np.mean(model.predict_proba(X_base)[:, 1])
                    
                    # Calculate Elixir Penalty for base deck
                    aec_base = calculate_aec(selected_cards, card_elixir)
                    if 2.8 <= aec_base <= 4.2:
                        penalty_base = 0.0
                    elif aec_base < 2.8:
                        penalty_base = ((2.8 - aec_base) ** 2) * 0.15
                    else:
                        penalty_base = ((aec_base - 4.2) ** 2) * 0.15
                    base_wr = max(0.0, min(1.0, base_wr_raw - penalty_base))
                    
                    # Run LOO to find the weakest card
                    loo_impacts = {}
                    for c in selected_cards:
                        v_mod = v_base.copy()
                        v_mod_lvl = v_base_lvl.copy()
                        if c in card_vocab:
                            v_mod[card_vocab[c]] = 0.0
                            v_mod_lvl[card_vocab[c]] = 0.0
                            
                        X_mod = []
                        for opp in meta_decks:
                            v_opp = np.zeros(len(card_vocab))
                            v_opp_lvl = np.zeros(len(card_vocab))
                            for card in opp.split(","):
                                if card in card_vocab:
                                    idx_o = card_vocab[card]
                                    v_opp[idx_o] = 1.0
                                    v_opp_lvl[idx_o] = 11.0
                            presence_diff = v_mod - v_opp
                            level_diff = v_mod_lvl - v_opp_lvl
                            X_mod.append(np.concatenate([presence_diff, level_diff, [0.0]]))
                        X_mod = np.array(X_mod)
                        mod_wr_raw = np.mean(model.predict_proba(X_mod)[:, 1])
                        loo_impacts[c] = base_wr_raw - mod_wr_raw
                        
                    # Weakest card has the lowest impact on win rate
                    weakest_card = min(loo_impacts, key=loo_impacts.get)
                    weakest_impact = loo_impacts[weakest_card]
                    
                    st.markdown(f"🔍 **Weakest Link identified:** **{weakest_card}** (LOO synergy contribution: `{weakest_impact:+.1%}`)")
                    
                    # Step 2: Try alternative cards to replace weakest_card
                    all_cards = list(card_vocab.keys())
                    candidates = [c for c in all_cards if c not in selected_cards]
                    
                    results = []
                    # Pre-encode meta opponent decks to speed up execution
                    opp_vectors = []
                    for opp in meta_decks:
                        v_opp = np.zeros(len(card_vocab))
                        v_opp_lvl = np.zeros(len(card_vocab))
                        for card in opp.split(","):
                            if card in card_vocab:
                                idx_o = card_vocab[card]
                                v_opp[idx_o] = 1.0
                                v_opp_lvl[idx_o] = 11.0
                        opp_vectors.append((v_opp, v_opp_lvl))
                        
                    # Iterate through candidates
                    for cand in candidates:
                        v_mut = v_base.copy()
                        v_mut_lvl = v_base_lvl.copy()
                        
                        # Remove weakest card
                        v_mut[card_vocab[weakest_card]] = 0.0
                        v_mut_lvl[card_vocab[weakest_card]] = 0.0
                        
                        # Add candidate card
                        v_mut[card_vocab[cand]] = 1.0
                        v_mut_lvl[card_vocab[cand]] = 11.0
                        
                        # Evaluate mutated deck
                        X_mut = []
                        for v_opp, v_opp_lvl in opp_vectors:
                            presence_diff = v_mut - v_opp
                            level_diff = v_mut_lvl - v_opp_lvl
                            X_mut.append(np.concatenate([presence_diff, level_diff, [0.0]]))
                            
                        X_mut = np.array(X_mut)
                        mut_wr_raw = np.mean(model.predict_proba(X_mut)[:, 1])
                        
                        # Apply Elixir Penalty to candidate deck
                        cand_deck_cards = [c for c in selected_cards if c != weakest_card] + [cand]
                        aec = calculate_aec(cand_deck_cards, card_elixir)
                        
                        if 2.8 <= aec <= 4.2:
                            penalty = 0.0
                        elif aec < 2.8:
                            penalty = ((2.8 - aec) ** 2) * 0.15
                        else:
                            penalty = ((aec - 4.2) ** 2) * 0.15
                            
                        final_mut_wr = max(0.0, min(1.0, mut_wr_raw - penalty))
                        
                        results.append({
                            "candidate": cand,
                            "simulated_win_rate": final_mut_wr,
                            "elixir_cost": aec,
                            "improvement": final_mut_wr - base_wr
                        })
                        
                    results_df = pd.DataFrame(results).sort_values(by="improvement", ascending=False)
                    
                    st.markdown("#### 🌟 Top Recommended Card Swaps:")
                    top_swaps = results_df.head(3)
                    
                    for idx_s, row_s in top_swaps.iterrows():
                        if row_s["improvement"] > 0:
                            st.success(
                                f"➕ Swap in **{row_s['candidate']}**: expected win rate increases from `{base_wr:.1%}` to **`{row_s['simulated_win_rate']:.1%}`** "
                                f"(`+{row_s['improvement']:.1%}` gain). Deck Avg Elixir: `{row_s['elixir_cost']:.2f}`."
                            )
                        else:
                            st.info(
                                f"➕ Swap in **{row_s['candidate']}**: expected win rate would be `{row_s['simulated_win_rate']:.1%}` "
                                f"(`{row_s['improvement']:.1%}` change). Deck Avg Elixir: `{row_s['elixir_cost']:.2f}`."
                            )

# TAB 4: MATCHUP PREDICTOR
with tab_predictor:
    st.markdown("### 🔮 Matchup Predictor (Machine Learning Model)")
    st.write(
        "This tool uses a trained non-linear **Multi-Layer Perceptron (MLP) Synergy Model** (accuracy: 59.34%) to predict "
        "the win probability between two decks based on complex card-to-card synergies and counters."
    )
    
    if model is None or card_vocab is None:
        st.warning("⚠️ Machine learning model artifacts are missing. Run `python src/train_synergy_model.py` to train the model first.")
    else:
        all_cards_list = sorted(list(card_vocab.keys()))
        
        col_deck1, col_deck2 = st.columns(2)
        
        with col_deck1:
            st.markdown("#### 👤 Your Deck")
            deck1_selection = st.multiselect(
                "Select 8 cards for Your Deck:",
                options=all_cards_list,
                key="p1_select",
                max_selections=8
            )
            
            p1_tr_val = st.slider("Your Trophies:", 1000, 15000, 11500, key="p1_tr_slider")
            
            deck1_levels = {}
            if len(deck1_selection) == 8:
                with st.expander("Adjust Your Card Levels (Defaults to 11)"):
                    level_cols = st.columns(4)
                    for i, card in enumerate(deck1_selection):
                        col_idx = i % 4
                        with level_cols[col_idx]:
                            deck1_levels[card] = st.number_input(
                                f"{card}", min_value=1, max_value=16, value=11, key=f"p1_lvl_{card}"
                            )
            
        with col_deck2:
            st.markdown("#### 👿 Opponent's Deck")
            deck2_selection = st.multiselect(
                "Select 8 cards for Opponent's Deck:",
                options=all_cards_list,
                key="p2_select",
                max_selections=8
            )
            
            p2_tr_val = st.slider("Opponent's Trophies:", 1000, 15000, 11500, key="p2_tr_slider")
            
            deck2_levels = {}
            if len(deck2_selection) == 8:
                with st.expander("Adjust Opponent's Card Levels (Defaults to 11)"):
                    level_cols = st.columns(4)
                    for i, card in enumerate(deck2_selection):
                        col_idx = i % 4
                        with level_cols[col_idx]:
                            deck2_levels[card] = st.number_input(
                                f"{card}", min_value=1, max_value=16, value=11, key=f"p2_lvl_{card}"
                            )
            
        if len(deck1_selection) == 8 and len(deck2_selection) == 8:
            # Multi-hot vector and level vector encoding
            num_cards = len(card_vocab)
            v1 = np.zeros(num_cards)
            v2 = np.zeros(num_cards)
            v1_lvl = np.zeros(num_cards)
            v2_lvl = np.zeros(num_cards)
            
            for c in deck1_selection:
                if c in card_vocab:
                    idx = card_vocab[c]
                    v1[idx] = 1.0
                    v1_lvl[idx] = deck1_levels.get(c, 11.0)
            for c in deck2_selection:
                if c in card_vocab:
                    idx = card_vocab[c]
                    v2[idx] = 1.0
                    v2_lvl[idx] = deck2_levels.get(c, 11.0)
                
            presence_diff = v1 - v2
            level_diff = v1_lvl - v2_lvl
            trophy_diff = (float(p1_tr_val) - float(p2_tr_val)) / 1000.0
            x_input = np.concatenate([presence_diff, level_diff, [trophy_diff]]).reshape(1, -1)
            
            # Predict
            prob = model.predict_proba(x_input)[0][1]
            
            # Visual display
            st.markdown("---")
            st.markdown("#### 🔮 Prediction Outcome")
            
            fig_gauge = go.Figure(go.Indicator(
                mode = "gauge+number",
                value = prob * 100,
                domain = {'x': [0, 1], 'y': [0, 1]},
                title = {'text': "Win Probability (%)", 'font': {'size': 20, 'family': 'Outfit'}},
                gauge = {
                    'axis': {'range': [0, 100], 'tickwidth': 1, 'tickcolor': "white"},
                    'bar': {'color': "#FFD700"}, # Gold
                    'bgcolor': "rgba(0,0,0,0)",
                    'borderwidth': 2,
                    'bordercolor': "gray",
                    'steps': [
                        {'range': [0, 45], 'color': 'rgba(231, 76, 60, 0.2)'},
                        {'range': [45, 55], 'color': 'rgba(241, 196, 15, 0.2)'},
                        {'range': [55, 100], 'color': 'rgba(46, 204, 113, 0.2)'}
                    ]
                }
            ))
            
            fig_gauge.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                height=250,
                margin=dict(l=10, r=10, t=40, b=10)
            )
            
            st.plotly_chart(fig_gauge, use_container_width=True)
            
            # Text verdict
            if prob > 0.55:
                st.success(f"🚀 **Favorable Matchup**: You have a **{prob:.1%}** chance of winning this match! Your deck has a solid statistical advantage.")
            elif prob < 0.45:
                st.error(f"⚠️ **Unfavorable Matchup**: You have only a **{prob:.1%}** chance of winning. Your opponent's cards have strong counter weights against your deck.")
            else:
                st.info(f"⚖️ **Even Matchup**: You have a **{prob:.1%}** chance of winning. This matchup is a coin flip and will rely heavily on in-game skill and play style.")
                
            # Cards contribution analysis using Model-Agnostic Leave-One-Out (LOO) Contribution
            st.markdown("#### 🧬 Matchup Analysis (Why?)")
            
            contribs = []
            base_prob = prob
            
            # Evaluate impact of Your cards (removing 1 card)
            for c in deck1_selection:
                v1_mod = v1.copy()
                v1_lvl_mod = v1_lvl.copy()
                
                v1_mod[card_vocab[c]] = 0.0
                v1_lvl_mod[card_vocab[c]] = 0.0
                
                presence_diff_mod = v1_mod - v2
                level_diff_mod = v1_lvl_mod - v2_lvl
                x_mod = np.concatenate([presence_diff_mod, level_diff_mod, [trophy_diff]]).reshape(1, -1)
                
                prob_mod = model.predict_proba(x_mod)[0][1]
                impact = base_prob - prob_mod
                contribs.append({
                    "card": c, 
                    "owner": "You (Advantage)" if impact >= 0 else "You (Disadvantage)", 
                    "impact": impact
                })
                
            # Evaluate impact of Opponent cards (removing 1 card)
            for c in deck2_selection:
                v2_mod = v2.copy()
                v2_lvl_mod = v2_lvl.copy()
                
                v2_mod[card_vocab[c]] = 0.0
                v2_lvl_mod[card_vocab[c]] = 0.0
                
                presence_diff_mod = v1 - v2_mod
                level_diff_mod = v1_lvl - v2_lvl_mod
                x_mod = np.concatenate([presence_diff_mod, level_diff_mod, [trophy_diff]]).reshape(1, -1)
                
                prob_mod = model.predict_proba(x_mod)[0][1]
                impact = prob_mod - base_prob
                contribs.append({
                    "card": c, 
                    "owner": "Opponent (Weakness)" if impact >= 0 else "Opponent (Threat)", 
                    "impact": impact
                })
                
            contrib_df = pd.DataFrame(contribs).sort_values("impact", ascending=False)
            
            c_left, c_right = st.columns(2)
            with c_left:
                st.markdown("**👍 Key Matchup Advantages:**")
                advs = contrib_df[contrib_df["impact"] > 0].head(3)
                if len(advs) > 0:
                    for _, row in advs.iterrows():
                        st.write(f" - **{row['card']}**: impact = `{row['impact']:+.1%}` ({row['owner']})")
                else:
                    st.write("No clear advantages detected.")
                    
            with c_right:
                st.markdown("**👎 Key Matchup Disadvantages:**")
                disadvs = contrib_df[contrib_df["impact"] < 0].sort_values("impact", ascending=True).head(3)
                if len(disadvs) > 0:
                    for _, row in disadvs.iterrows():
                        st.write(f" - **{row['card']}**: impact = `{row['impact']:.1%}` ({row['owner']})")
                else:
                    st.write("No clear disadvantages detected.")
        else:
            st.info("💡 Select exactly 8 cards for both decks to run the matchup prediction.")
