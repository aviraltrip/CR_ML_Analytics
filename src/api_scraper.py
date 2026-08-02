"""
api_scraper.py — Snowball collection of Clash Royale battle logs.
"""

import argparse
import json
import os
import time
from collections import deque

import requests

API_BASE = "https://api.clashroyale.com/v1"


def normalize_tag(tag: str) -> str:
    """Clash Royale tags use '#' in the UI but must be URL-encoded as %23."""
    tag = tag.strip().upper()
    if not tag.startswith("#"):
        tag = "#" + tag
    return tag


def encoded_tag(tag: str) -> str:
    return normalize_tag(tag).replace("#", "%23")


def fetch_battlelog(session: requests.Session, tag: str) -> list | None:
    url = f"{API_BASE}/players/{encoded_tag(tag)}/battlelog"
    for attempt in range(3):
        try:
            resp = session.get(url, timeout=15)
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code == 429:
                wait = 5 * (attempt + 1)
                print(f"  rate limited, backing off {wait}s...")
                time.sleep(wait)
                continue
            if resp.status_code in (403, 404):
                print(f"  HTTP {resp.status_code} for tag {tag} (IP allowlist error or private/invalid tag)")
                return None
            print(f"  unexpected status {resp.status_code} for {tag}")
            return None
        except Exception as e:  # noqa: BLE001
            print(f"  error fetching {tag}: {e}")
            time.sleep(2)
    return None


def extract_battle_rows(tag: str, battles: list) -> list[dict]:
    """Keep only 1v1 ladder battles with complete 8-card decks on both sides."""
    rows = []
    for b in battles:
        b_type = b.get("type", "")
        game_mode_name = b.get("gameMode", {}).get("name", "").lower()
        
        is_ladder = b_type in ("PvP", "ladder", "PathOfLegend") or "ladder" in game_mode_name or "legend" in game_mode_name
        if not is_ladder:
            continue

        team = b.get("team", [])
        opponent = b.get("opponent", [])
        if len(team) != 1 or len(opponent) != 1:
            continue  # skip 2v2 / non-standard formats
        
        my_side, opp_side = team[0], opponent[0]
        my_cards = my_side.get("cards", [])
        opp_cards = opp_side.get("cards", [])
        if len(my_cards) != 8 or len(opp_cards) != 8:
            continue  # incomplete deck data, skip

        rows.append({
            "battle_time": b.get("battleTime"),
            "game_mode": b.get("gameMode", {}).get("name"),
            "player_tag": tag,
            "player_trophies": my_side.get("startingTrophies"),
            "player_crowns": my_side.get("crowns"),
            "player_deck": [c["name"] for c in my_cards],
            "player_deck_levels": [c.get("level") for c in my_cards],
            "opponent_tag": opp_side.get("tag"),
            "opponent_trophies": opp_side.get("startingTrophies"),
            "opponent_crowns": opp_side.get("crowns"),
            "opponent_deck": [c["name"] for c in opp_cards],
            "opponent_deck_levels": [c.get("level") for c in opp_cards],
            "player_won": my_side.get("crowns", 0) > opp_side.get("crowns", 0),
        })
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", required=True,
                         help="Comma-separated seed player tags, e.g. '#2Y0V8PG,#PP8L02Y'")
    parser.add_argument("--max-players", type=int, default=2000,
                         help="Stop after visiting this many distinct player tags")
    parser.add_argument("--out", default="../data/raw_battlelog.jsonl",
                         help="Output path (JSON Lines, one battle row per line)")
    parser.add_argument("--sleep", type=float, default=0.3,
                         help="Seconds to sleep between requests (be a good citizen)")
    args = parser.parse_args()

    token = os.environ.get("CR_API_TOKEN")
    if not token:
        raise SystemExit("Set CR_API_TOKEN env var with your Clash Royale API token first.")

    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {token}"})

    seed_tags = [normalize_tag(t) for t in args.seed.split(",") if t.strip()]
    queue = deque(seed_tags)
    visited = set()
    
    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    total_rows = 0
    with open(args.out, "a", encoding="utf-8") as f:
        while queue and len(visited) < args.max_players:
            tag = queue.popleft()
            if tag in visited:
                continue
            visited.add(tag)

            print(f"Fetching battles for player {tag} ({len(visited)}/{args.max_players})...")
            battles = fetch_battlelog(session, tag)
            time.sleep(args.sleep)
            if not battles:
                continue

            rows = extract_battle_rows(tag, battles)
            for row in rows:
                f.write(json.dumps(row) + "\n")
                total_rows += 1
                opp = row["opponent_tag"]
                if opp:
                    normalized_opp = normalize_tag(opp)
                    if normalized_opp not in visited:
                        queue.append(normalized_opp)

            if len(visited) % 25 == 0:
                print(f"visited={len(visited)} queued={len(queue)} rows_written={total_rows}")

    print(f"Done. Visited {len(visited)} players, wrote {total_rows} battle rows to {args.out}")


if __name__ == "__main__":
    main()
