#!/usr/bin/env python
"""Regression pass for the floating island.

Serves `dist/` and checks the things that have actually broken before:
  - the intro finishes and the hero copy appears (`.overlay.is-ready`)
  - the loading screen gets out of the way (procedural scenes never reach
    `progress === 100`, so this is a real trap)
  - the WebGL canvas renders something other than a flat field of sky
  - the menu sheet opens, and a chapter panel opens from it
  - both themes render, on desktop and on a 390px phone, with no console errors
    and no horizontal overflow

Usage: python qa/verify.py [outdir]
"""
import http.server
import json
import socketserver
import sys
import threading
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else (ROOT / "qa" / "shots")
PORT = 4390

ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
]

IGNORED_CONSOLE = ("GL Driver Message", "has been deprecated")
checks: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    checks.append((name, bool(ok), detail))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(DIST), **kw)

    def log_message(self, *a):
        pass


def spread(path: Path) -> tuple[float, int]:
    """Luma spread + distinct colour buckets, to prove the canvas really drew."""
    image = Image.open(path).convert("RGB")
    image = image.resize((160, 100))
    pixels = list(image.getdata())
    lumas = [0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in pixels]
    buckets = {(r // 24, g // 24, b // 24) for r, g, b in pixels}
    return max(lumas) - min(lumas), len(buckets)


def run_theme(page, label: str, viewport_width: int) -> None:
    page.wait_for_selector(".overlay.is-ready", timeout=30000)
    check(f"{label}: intro completes", True)

    loader = page.get_attribute(".loading-screen", "class") or ""
    check(f"{label}: loading screen dismissed", "is-done" in loader, loader)

    hero = (page.inner_text(".scene-intro h1") or "").strip()
    check(f"{label}: hero copy present", "Lisa" in hero, hero.replace("\n", " / "))

    signature = (page.inner_text(".scene-signature") or "").strip()
    check(f"{label}: signature present", "floating island" in signature, signature)

    shot = OUT / f"{label}.png"
    page.screenshot(path=str(shot))
    luma, buckets = spread(shot)
    check(f"{label}: canvas rendered", luma >= 40 and buckets >= 25, f"luma spread {luma:.1f}, {buckets} buckets")

    width = page.evaluate("document.documentElement.scrollWidth")
    check(f"{label}: no horizontal overflow", width <= viewport_width, f"scrollWidth {width} vs {viewport_width}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
    httpd.allow_reuse_address = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{PORT}/"
    errors: list[str] = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=ARGS)
            for device, vw, vh in (("desktop", 1440, 900), ("mobile", 390, 844)):
                page = browser.new_page(
                    viewport={"width": vw, "height": vh},
                    reduced_motion="no-preference",
                )
                page.on("pageerror", lambda e, d=device: errors.append(f"{d} pageerror: {e}"))
                page.on(
                    "console",
                    lambda m, d=device: errors.append(f"{d} console.{m.type}: {m.text}")
                    if m.type == "error" and not any(k in m.text for k in IGNORED_CONSOLE)
                    else None,
                )
                page.goto(url, wait_until="load")
                run_theme(page, f"{device}-day", vw)

                page.click('[aria-label*="night" i]')
                page.wait_for_timeout(2200)
                run_theme(page, f"{device}-night", vw)
                page.click('[aria-label*="day mode" i]')
                page.wait_for_timeout(1200)

                # Menu sheet + chapter panel.
                page.click('[aria-label="Open room menu"]')
                page.wait_for_timeout(1400)
                visible = page.evaluate(
                    "getComputedStyle(document.querySelector('.menu-sheet')).opacity"
                )
                check(f"{device}: menu sheet opens", float(visible) > 0.9, f"opacity {visible}")
                links = page.eval_on_selector_all(".menu-links button", "els => els.length")
                check(f"{device}: menu lists every chapter", links == 7, f"{links} entries")
                page.screenshot(path=str(OUT / f"{device}-menu.png"))

                page.click(".menu-links li:nth-child(2) button")
                page.wait_for_timeout(2400)
                panel = page.eval_on_selector_all(".content-panel h1", "els => els.length")
                check(f"{device}: chapter panel opens", panel == 1, f"{panel} panels")
                page.screenshot(path=str(OUT / f"{device}-panel.png"))
                page.click(".panel-close")
                page.wait_for_timeout(600)
                page.close()
            browser.close()
    finally:
        httpd.shutdown()

    check("no console errors", not errors, "; ".join(errors[:4]))

    failed = [c for c in checks if not c[1]]
    for name, ok, detail in checks:
        print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"  ({detail})" if detail else ""))
    print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
    (OUT / "qa-results.json").write_text(
        json.dumps(
            {
                "ok": not failed,
                "passed": len(checks) - len(failed),
                "total": len(checks),
                "checks": [{"name": n, "ok": o, "detail": d} for n, o, d in checks],
            },
            indent=2,
        )
    )
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
