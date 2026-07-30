#!/usr/bin/env python
"""Headless WebGL screenshot helper for the floating island.

Usage: python qa/shot.py <outdir> [port]
Serves dist/ and captures desktop day/night + mobile shots.
"""
import http.server
import os
import socketserver
import sys
import threading
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else (ROOT / "qa" / "shots")
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 4321

ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
]


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(DIST), **kw)

    def log_message(self, *a):
        pass


def serve():
    socketserver.TCPServer.allow_request = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
    httpd.allow_reuse_address = True
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    httpd = serve()
    url = f"http://127.0.0.1:{PORT}/"
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=ARGS)
            for name, vw, vh in (("desktop", 1440, 900), ("mobile", 390, 844)):
                page = browser.new_page(viewport={"width": vw, "height": vh}, device_scale_factor=1)
                page.on("pageerror", lambda e: errors.append(f"{name}: {e}"))
                page.on("console", lambda m: errors.append(f"{name} console.{m.type}: {m.text}")
                        if m.type == "error" else None)
                page.goto(url, wait_until="load")
                page.wait_for_timeout(14000)
                page.screenshot(path=str(OUT / f"{name}-day.png"))
                # toggle theme via the overlay button
                try:
                    page.click('[aria-label*="night" i], [data-qa="theme-toggle"]', timeout=3000)
                    page.wait_for_timeout(4500)
                    page.screenshot(path=str(OUT / f"{name}-night.png"))
                except Exception as exc:  # noqa: BLE001
                    print(f"[warn] theme toggle failed on {name}: {exc}")
                if name == "desktop":
                    ow = page.evaluate("document.documentElement.scrollWidth")
                    print(f"[info] desktop scrollWidth={ow}")
                else:
                    ow = page.evaluate("document.documentElement.scrollWidth")
                    print(f"[info] mobile scrollWidth={ow} (viewport 390)")
                page.close()
            browser.close()
    finally:
        httpd.shutdown()
    if errors:
        print("=== page errors ===")
        for e in errors[:20]:
            print(" -", e)
    else:
        print("no page errors")
    print("shots ->", OUT)


if __name__ == "__main__":
    main()
