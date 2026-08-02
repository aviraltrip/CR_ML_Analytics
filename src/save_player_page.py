"""
save_player_page.py — Helper script to save the RoyaleAPI player battles page HTML.
Run this script locally, solve the captcha in the browser window, and it will save the page source.
"""

import argparse
import os
import sys

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Playwright is not installed. Please run:")
    print("  pip install playwright")
    print("  playwright install")
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--tag", default="2Y0V8PG", help="Clash Royale player tag (without #)"
    )
    parser.add_argument(
        "--out",
        default="../data/sample_player_page.html",
        help="Path to save the HTML file",
    )
    args = parser.parse_args()

    # Normalize tag
    tag = args.tag.strip().upper().replace("#", "")

    url = f"https://royaleapi.com/player/{tag}/battles"
    print(f"Starting browser to open: {url}")
    print("Please solve any Cloudflare verification in the browser window.")

    with sync_playwright() as p:
        # Launch non-headless browser so the user can interact with it
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.goto(url, wait_until="commit", timeout=0)

        # Prompt the user to solve the captcha and load the battles
        print("\n" + "=" * 60)
        print("ACTION REQUIRED:")
        print("1. Solve the Cloudflare Turnstile challenge in the browser window.")
        print("2. Ensure the page finishes loading and shows the player's battles.")
        print(
            "3. Once the page is fully loaded, return to this terminal and press ENTER."
        )
        print("=" * 60 + "\n")

        input("Press Enter here once the battles page is fully loaded...")

        # Get HTML source
        content = page.content()

        # Ensure parent directory exists
        out_path = args.out
        out_dir = os.path.dirname(out_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"\nSuccess! Saved HTML source to: {os.path.abspath(out_path)}")
        browser.close()


if __name__ == "__main__":
    main()
