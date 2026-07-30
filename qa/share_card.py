#!/usr/bin/env python
"""Capture the social share card from the real scene.

The card is a screenshot of the site rather than a hand-made graphic, so it can
never drift from what a visitor actually sees. Writes `public/share-card.png` at
the 1200x630 that Open Graph and Twitter expect.

Usage: python qa/share_card.py [port]
"""

import http.server
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = ROOT / "public" / "share-card.png"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4330

# Without these a headless browser cannot create a WebGL context and captures
# nothing but the loading screen.
ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
]

CARD_W = 1200
CARD_H = 630


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(DIST), **kw)

    def log_message(self, *a):
        pass


def main() -> int:
    if not (DIST / "index.html").exists():
        print("dist/index.html is missing — run `npm run build` first")
        return 1

    httpd = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
    httpd.allow_reuse_address = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=ARGS)
            page = browser.new_page(
                viewport={"width": CARD_W, "height": CARD_H}, device_scale_factor=1
            )
            page.goto(f"http://127.0.0.1:{PORT}/", wait_until="load")
            page.wait_for_selector(".overlay.is-ready", timeout=120000)
            # A beat past the entrance so the hero copy has finished fading in.
            page.wait_for_timeout(2500)
            OUT.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(OUT))
            browser.close()
    finally:
        httpd.shutdown()

    print(f"share card -> {OUT} ({OUT.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
