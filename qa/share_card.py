"""Share card + a first-paint measurement, both from the real scene."""

import socketserver
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4811

ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
]


def main():
    handler = partial(SimpleHTTPRequestHandler, directory=str(DIST))
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{PORT}/"

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(args=ARGS)
            context = browser.new_context(
                # 1200x630 at scale 1: the size link previews actually use.
                viewport={"width": 1200, "height": 630}, device_scale_factor=1
            )
            page = context.new_page()
            page.goto(url)
            page.wait_for_function(
                "() => window.__LW_FLIGHT__ && window.__LW_FLIGHT__.count > 0"
                " && !window.__LW_FLIGHT__.flying",
                timeout=120_000,
            )
            page.wait_for_timeout(700)

            timing = page.evaluate(
                """() => {
                  const nav = performance.getEntriesByType('navigation')[0]
                  const firstOwnScript = performance
                    .getEntriesByType('resource')
                    .filter(r => r.name.includes('/assets/') && r.name.endsWith('.js'))
                    .map(r => r.startTime)
                    .sort((a, b) => a - b)[0]
                  return {
                    domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
                    firstOwnScript: Math.round(firstOwnScript || -1),
                    requests: performance.getEntriesByType('resource').length,
                  }
                }"""
            )
            print(f"DOMContentLoaded      {timing['domContentLoaded']}ms")
            print(f"first own JS starts   {timing['firstOwnScript']}ms")
            print(f"requests              {timing['requests']}")

            card = ROOT / "public" / "share-card.png"
            page.screenshot(path=str(card))
            print(f"share card            {card} ({card.stat().st_size // 1024}KB)")

            browser.close()
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    main()
