"""Checks for the original-look island, after the detail pass.

Every assertion is measured in the browser: chapter framing is checked against
the panel's real rectangle, not against hand-written coordinates.
"""

import json
import socketserver
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else (ROOT / "qa" / "shots")
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 4801

ARGS = [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
]

CHAPTERS = ["philosophy", "about", "experience", "toolkit", "work", "art"]
MENU_ORDER = [
    "00Home",
    "01How I Work",
    "02About Lisa",
    "03Experience",
    "04Creative Toolkit",
    "05Selected Work",
    "06My Paintings",
]

READY_TIMEOUT = 120_000
# The object has to sit clear of the panel with room to read its label above it.
MIN_PANEL_GAP = 24
IGNORED_CONSOLE = ("GL Driver Message", "has been deprecated")

results: list[tuple[bool, str]] = []


def check(label: str, ok: bool, detail: str = "") -> bool:
    results.append((ok, f"{label}{f' — {detail}' if detail else ''}"))
    print(f"{'PASS' if ok else 'FAIL'}  {label}{f' — {detail}' if detail else ''}")
    return ok


def serve_on(port: int):
    handler = partial(SimpleHTTPRequestHandler, directory=str(DIST))
    # Must be set on the class before the instance binds its socket.
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def wait_ready(page, label: str) -> bool:
    try:
        page.wait_for_function(
            "() => window.__LW_FLIGHT__ && window.__LW_FLIGHT__.count > 0"
            " && !window.__LW_FLIGHT__.flying",
            timeout=READY_TIMEOUT,
        )
        return True
    except Exception as error:
        return check(f"scene settles ({label})", False, str(error)[:90])


def wait_still(page, tries: int = 200):
    """Return the flight count once the camera is genuinely parked.

    Closing a chapter sends the camera home, and that flight's completion would
    otherwise satisfy the next chapter's "a flight finished" wait — so the
    projection would be read mid-air. Two interactions must never overlap.
    """
    for _ in range(tries):
        state = page.evaluate("() => window.__LW_FLIGHT__ || null")
        if state and not state["flying"]:
            return state["count"]
        page.wait_for_timeout(100)
    return None


def settled(page, chapter: str, since: int, tries: int = 200):
    """Wait for the flight that this click started, then read the projection."""
    for _ in range(tries):
        state = page.evaluate(
            "() => ({flight: window.__LW_FLIGHT__ || {count: 0, flying: false}})"
        )
        if state["flight"]["count"] > since and not state["flight"]["flying"]:
            page.wait_for_timeout(120)
            return page.evaluate(f"() => window.__LW_AT__({chapter!r})"), True
        page.wait_for_timeout(100)
    return None, False


def panel_painted(page, timeout_ms: int = 4000):
    """A panel that is mounted but still transparent is not readable.

    Polled with a deadline rather than slept past: the requirement is that the
    text becomes visible promptly, and a fixed sleep would hide a panel that
    never paints at all.
    """
    deadline = timeout_ms
    last = None
    while deadline > 0:
        last = page.evaluate(
            """() => {
              const panel = document.querySelector('.content-panel')
              if (!panel) return null
              const style = getComputedStyle(panel)
              return {
                opacity: Number(style.opacity),
                visibility: style.visibility,
                title: (panel.querySelector('h1') || {}).textContent || '',
              }
            }"""
        )
        if last and last["opacity"] == 1 and last["visibility"] == "visible" and last["title"]:
            return last
        page.wait_for_timeout(100)
        deadline -= 100
    return last


def panel_rect(page):
    # offsetLeft/Top, not getBoundingClientRect: the panel animates in with a
    # transform, and the rect would be read mid-slide.
    return page.evaluate(
        """() => {
          const panel = document.querySelector('.content-panel')
          if (!panel) return null
          return {
            left: panel.offsetLeft,
            top: panel.offsetTop,
            width: panel.offsetWidth,
            height: panel.offsetHeight,
            opacity: Number(getComputedStyle(panel).opacity),
            title: (panel.querySelector('h1') || {}).textContent || '',
          }
        }"""
    )


def open_chapter(page, chapter: str, index: int):
    before = wait_still(page)
    if before is None:
        return None, False
    page.click('[aria-label="Open room menu"]')
    page.wait_for_selector(".room-menu-links button", state="visible")
    page.click(f".room-menu-links button:nth-child({index + 2})")
    return settled(page, chapter, before)


def run_device(browser, url: str, mobile: bool, errors: list[str]):
    name = "mobile" if mobile else "desktop"
    context = browser.new_context(
        viewport={"width": 390, "height": 844} if mobile else {"width": 1440, "height": 900},
        device_scale_factor=2 if mobile else 1,
        is_mobile=mobile,
        has_touch=mobile,
    )
    page = context.new_page()
    page.on(
        "console",
        lambda message: errors.append(f"{name}: {message.text}")
        if message.type == "error" and not any(n in message.text for n in IGNORED_CONSOLE)
        else None,
    )
    page.on("pageerror", lambda error: errors.append(f"{name}: {error}"))

    third_party: list[str] = []
    page.on(
        "request",
        lambda request: third_party.append(request.url)
        if "127.0.0.1" not in request.url and not request.url.startswith("data:")
        else None,
    )

    page.goto(url)
    if not wait_ready(page, name):
        context.close()
        return

    check(f"{name}: no third-party requests", not third_party, ", ".join(third_party[:2]))

    page.click('[aria-label="Open room menu"]')
    page.wait_for_selector(".room-menu-links button", state="visible")
    menu_labels = page.evaluate(
        "() => [...document.querySelectorAll('.room-menu-links button')].map(b => b.textContent)"
    )
    check(f"{name}: menu reads 00-06 in order", menu_labels == MENU_ORDER, str(menu_labels))
    page.keyboard.press("Escape")

    for index, chapter in enumerate(CHAPTERS):
        at, landed = open_chapter(page, chapter, index)
        if not landed or not at:
            check(f"{name}: {chapter} camera lands", False, "flight never settled")
            continue

        panel = panel_rect(page)
        if not panel:
            check(f"{name}: {chapter} panel opens", False, "no panel")
            continue

        painted = panel_painted(page)
        check(
            f"{name}: {chapter} panel is painted",
            bool(painted)
            and painted["opacity"] == 1
            and painted["visibility"] == "visible"
            and painted["title"] != "",
            f"opacity {painted['opacity']}, title {painted['title']!r}" if painted else "no panel",
        )

        on_screen = 0 <= at["x"] <= at["width"] and 0 <= at["y"] <= at["height"]
        check(
            f"{name}: {chapter} object is on screen",
            on_screen,
            f"at ({at['x']:.0f}, {at['y']:.0f}) of {at['width']}x{at['height']}",
        )

        inside_panel = (
            panel["left"] <= at["x"] <= panel["left"] + panel["width"]
            and panel["top"] <= at["y"] <= panel["top"] + panel["height"]
        )
        gap = panel["top"] - at["y"] if mobile else min(panel["left"] - at["x"], 1e9)
        check(
            f"{name}: {chapter} object clears the panel",
            not inside_panel and gap >= MIN_PANEL_GAP,
            f"gap {gap:.0f}px (object y={at['y']:.0f}, panel top={panel['top']})",
        )

        if index == 1:
            page.screenshot(path=str(OUT / f"{name}-chapter.png"))

        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        check(f"{name}: escape closes {chapter}", panel_rect(page) is None)

    page.screenshot(path=str(OUT / f"{name}-day.png"))

    page.click('[aria-label="Switch to night mode"]')
    page.wait_for_timeout(1200)
    page.screenshot(path=str(OUT / f"{name}-night.png"))
    stored = page.evaluate("() => localStorage.getItem('lisa-world:theme')")
    check(f"{name}: night mode is remembered", stored == "night", str(stored))

    page.reload()
    if wait_ready(page, f"{name} after reload"):
        theme = page.evaluate(
            """() => ({
              attr: document.documentElement.dataset.theme,
              shell: document.querySelector('.app-shell').className,
            })"""
        )
        check(
            f"{name}: reload comes back at night",
            theme["attr"] == "night" and "is-night" in theme["shell"],
            json.dumps(theme),
        )

    context.close()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    httpd = serve_on(PORT)
    url = f"http://127.0.0.1:{PORT}/"
    errors: list[str] = []

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(args=ARGS)
            run_device(browser, url, False, errors)
            run_device(browser, url, True, errors)
            browser.close()
    finally:
        httpd.shutdown()

    check("no page errors", not errors, "; ".join(errors[:3]))

    passed = sum(1 for ok, _ in results if ok)
    print(f"\n{passed}/{len(results)} checks passed")
    if passed != len(results):
        print("\nFailures:")
        for ok, label in results:
            if not ok:
                print(f"  - {label}")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
