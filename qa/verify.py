#!/usr/bin/env python
"""Regression pass for the floating island.

Serves `dist/` and checks the things that have actually broken before:
  - the intro finishes and the hero copy appears (`.overlay.is-ready`)
  - the loading screen gets out of the way (procedural scenes never reach
    `progress === 100`, so this is a real trap)
  - the WebGL canvas renders something other than a flat field of sky
  - `window.__ISLAND_STATS__` proves the scene graph was really built: both
    painted screen textures reached the GPU, and night adds lights
  - the menu sheet opens, and a chapter panel opens from it
  - a chapter can be reached and dismissed with the keyboard alone
  - the chosen theme survives a reload, and a dark OS preference is honoured
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

# Floors, not exact counts: the scene is meant to keep growing, but dropping
# below these means something silently stopped rendering.
MIN_MESHES = 140
MIN_TRIANGLES = 20000
EXPECTED_SCREENS = 2
# The easel canvas, four photo frames and the pinned board. Exact rather than a
# floor: these are the surfaces the chapter close-ups land on, and a Canvas2D
# failure degrades silently into an untextured material that still renders.
EXPECTED_ARTWORKS = 6
CHAPTERS = 6

# Opening a chapter has to show the object it is about. Camera framing is
# derived arithmetic, and arithmetic that reads correctly still parked the AI
# console behind the cabin's end wall — every chapter view was a wall of timber.
# The scene-side raycast probe samples points on the object itself.
CHAPTER_LABELS = {
    "philosophy": "HOW I WORK",
    "about": "ABOUT LISA",
    "experience": "EDUCATION",
    "toolkit": "AI CREATIVE TOOLKIT",
    "work": "SELECTED WORK",
    "art": "MY PAINTINGS",
}
# Not 1.0: the photo wall is four separate frames, so a sample or two legitimately
# slips between them and lands on the wall behind.
MIN_VISIBLE_RATIO = 0.85

# Where a chapter's object is supposed to land, and how big it should read.
#
# "Visible" was never the whole requirement, and asserting only that let a real
# regression through: the easel was completely unobstructed, it was just tiny and
# floating in empty sky next to the island. These mirror `focusFraming` in
# `src/scene/World.tsx` — the point is that if someone retunes the framing and
# a chapter slides under the content panel or shrinks back to a speck, the suite
# says so instead of the deploy being the first place anyone notices.
FRAMING_SLOTS = {
    "desktop": {"x": -0.36, "y": 0.0},
    "mobile": {"x": 0.0, "y": 0.3},
}
# Generous enough to absorb the island's idle float and pointer tilt, tight
# enough that a mis-slotted chapter cannot hide inside it.
NDC_TOLERANCE = 0.18
# The floor is "a close-up, not a room shot"; the ceiling is "the object still
# has air around it". The smallest objects clamp against the camera's minimum
# distance, which is why the floor is 0.12 rather than the 0.46 `fill` target.
MIN_FRAME_FILL = 0.12
MAX_FRAME_FILL = 0.72

# Software rasterisation is 50-100x slower than a GPU, and how long a cold start
# takes depends on what else the machine is doing. On real hardware the intro is
# a ~3s timeline; this ceiling only exists so the harness does not report a
# machine-load hiccup as a product failure.
READY_TIMEOUT = 90000

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


def run_theme(page, label: str, viewport_width: int) -> dict | None:
    page.wait_for_selector(".overlay.is-ready", timeout=READY_TIMEOUT)
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

    # A screenshot proves "something drew"; it cannot tell a painted laptop
    # screen from a blank plane. The scene graph counters can.
    stats = page.evaluate("window.__ISLAND_STATS__ ?? null")
    check(f"{label}: scene stats published", bool(stats), json.dumps(stats))
    if stats:
        check(
            f"{label}: geometry built",
            stats["meshes"] >= MIN_MESHES and stats["triangles"] >= MIN_TRIANGLES,
            f"{stats['meshes']} meshes, {stats['triangles']} triangles",
        )
        check(
            f"{label}: both screens painted",
            stats["screens"] == EXPECTED_SCREENS,
            f"{stats['screens']} canvas-textured screens",
        )
        check(
            f"{label}: artwork painted",
            stats.get("artworks") == EXPECTED_ARTWORKS,
            f"{stats.get('artworks')} canvas-textured artworks",
        )
    return stats


def run_keyboard(page, device: str) -> None:
    """A chapter must be reachable without a pointer."""
    labels = page.eval_on_selector_all(".object-label", "els => els.length")
    check(f"{device}: every object is focusable", labels == CHAPTERS, f"{labels} labels")

    page.eval_on_selector(".object-label", "el => el.focus()")
    page.wait_for_timeout(400)
    focused = page.evaluate(
        "document.activeElement?.className?.includes?.('object-label') === true"
    )
    check(f"{device}: focus lands on an object", focused, str(focused))

    # Poll rather than sleep: under software WebGL the render loop can starve
    # React for a few hundred milliseconds, so a fixed wait raced the fade-in.
    opacity = 0.0
    for _ in range(24):
        opacity = float(
            page.evaluate("getComputedStyle(document.querySelector('.object-label')).opacity")
        )
        if opacity > 0.9:
            break
        page.wait_for_timeout(250)
    check(f"{device}: focus reveals the label", opacity > 0.9, f"opacity {opacity:.3f}")

    page.keyboard.press("Enter")
    page.wait_for_timeout(2400)
    panel = page.eval_on_selector_all(".content-panel h1", "els => els.length")
    check(f"{device}: keyboard opens a chapter", panel == 1, f"{panel} panels")

    page.keyboard.press("Escape")
    page.wait_for_timeout(700)
    panel = page.eval_on_selector_all(".content-panel h1", "els => els.length")
    check(f"{device}: escape closes the chapter", panel == 0, f"{panel} panels")


def run_focus(page, device: str) -> None:
    """Open every chapter and confirm the camera can actually see its object."""
    for chapter, label in CHAPTER_LABELS.items():
        opened = page.evaluate(
            """(label) => {
                const el = [...document.querySelectorAll('.object-label')]
                    .find((node) => node.textContent.trim() === label)
                if (!el) return false
                el.focus()
                el.click()
                return true
            }""",
            label,
        )
        if not opened:
            check(f"{device}: {chapter} chapter reachable", False, f"no label '{label}'")
            continue

        page.wait_for_timeout(4200)
        probe = page.evaluate("(id) => window.__ISLAND_PROBE__?.(id) ?? null", chapter)
        detail = json.dumps(probe)
        check(
            f"{device}: {chapter} chapter frames its object",
            bool(probe) and probe["visibleRatio"] >= MIN_VISIBLE_RATIO,
            detail,
        )

        slot = FRAMING_SLOTS[device]
        check(
            f"{device}: {chapter} lands on its framing slot",
            bool(probe)
            and abs(probe["ndc"]["x"] - slot["x"]) <= NDC_TOLERANCE
            and abs(probe["ndc"]["y"] - slot["y"]) <= NDC_TOLERANCE,
            detail,
        )
        check(
            f"{device}: {chapter} reads as a close-up",
            bool(probe) and MIN_FRAME_FILL <= probe["fill"] <= MAX_FRAME_FILL,
            detail,
        )
        page.keyboard.press("Escape")
        page.wait_for_timeout(1400)


def run_persistence(context, url: str, device: str) -> None:
    """A theme choice has to outlive the visit.

    Checked with a brand-new page in the same browser context rather than
    `page.reload()`: recreating a WebGL context in place takes ~27s under
    software rasterisation, which is a quirk of this harness and not something a
    visitor experiences. A fresh page is also the truer test — it is what a
    returning visitor actually gets.
    """
    page = context.new_page()
    page.goto(url, wait_until="load")

    early = page.get_attribute("html", "data-theme")
    check(f"{device}: document theme set before React", early == "night", str(early))

    page.wait_for_selector(".overlay.is-ready", timeout=READY_TIMEOUT)
    shell = page.get_attribute(".app-shell", "class") or ""
    check(f"{device}: theme survives a fresh visit", "is-night" in shell, shell)
    page.close()


def run_share_assets(page, url: str) -> None:
    """The link's own presentation: tab icon and social card.

    Both fail silently. The favicon shipped for a while was the purple lightning
    bolt left over from a scaffold, and a missing `og:image` turns a site whose
    entire point is a picture into a text-only card. Neither shows up in any
    screenshot of the page itself.
    """
    icon = page.get_attribute('link[rel="icon"]', "href") or ""
    check(
        "share: favicon path is base-relative",
        icon.startswith("./") or icon.startswith("favicon"),
        icon,
    )
    icon_status = page.evaluate(
        "(href) => fetch(href).then((r) => r.status).catch(() => 0)", icon
    )
    check("share: favicon resolves", icon_status == 200, f"HTTP {icon_status}")

    card = page.get_attribute('meta[property="og:image"]', "content") or ""
    check("share: og:image is absolute", card.startswith("https://"), card)

    twitter_card = page.get_attribute('meta[name="twitter:card"]', "content") or ""
    check(
        "share: twitter card is large",
        twitter_card == "summary_large_image",
        twitter_card,
    )

    # The card is served from the same build, so fetch it by filename rather than
    # by the production URL in the meta tag.
    name = card.rsplit("/", 1)[-1]
    size = page.evaluate(
        """(name) => new Promise((resolve) => {
            const image = new Image()
            image.onload = () => resolve([image.naturalWidth, image.naturalHeight])
            image.onerror = () => resolve([0, 0])
            image.src = name
        })""",
        name,
    )
    check(
        "share: card is 1200x630",
        size == [1200, 630],
        f"{name} is {size[0]}x{size[1]}",
    )


def region_signature(page, box: dict) -> tuple[int, float]:
    """Distinct colour buckets and mean luma inside a screen rectangle."""
    path = OUT / "_scratch.png"
    page.screenshot(path=str(path), clip=box)
    image = Image.open(path).convert("RGB")
    pixels = list(image.getdata())
    lumas = [0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in pixels]
    buckets = {(r // 20, g // 20, b // 20) for r, g, b in pixels}
    return len(buckets), sum(lumas) / len(lumas)


def run_easter_eggs(page, device: str) -> None:
    """The three things on the island that answer back.

    Every one of these is invisible to a static screenshot of the home view, and
    two of them are the only interactions on the island that are not chapters, so
    nothing else in this suite would notice if they stopped responding.
    """
    island = {"x": 380, "y": 150, "width": 700, "height": 640}

    # --- silhouette mode (press S) -------------------------------------------
    before_buckets, _ = region_signature(page, island)
    page.keyboard.press("s")
    page.wait_for_timeout(1400)
    stats = page.evaluate("window.__ISLAND_STATS__ ?? null")
    check(
        f"{device}: pressing S enters silhouette mode",
        bool(stats) and stats.get("silhouette") is True,
        json.dumps(stats),
    )
    flat_buckets, _ = region_signature(page, island)
    # A silhouette is by definition fewer tones: if the flatten silently stopped
    # working the flag would still flip, so the pixels have to be checked too.
    check(
        f"{device}: silhouette collapses the island's tones",
        flat_buckets < before_buckets * 0.6,
        f"{before_buckets} buckets normally vs {flat_buckets} flattened",
    )

    page.keyboard.press("s")
    page.wait_for_timeout(1400)
    restored_buckets, _ = region_signature(page, island)
    check(
        f"{device}: pressing S again restores the island",
        restored_buckets > flat_buckets * 1.5,
        f"{flat_buckets} flattened vs {restored_buckets} restored",
    )

    # --- campfire poke -------------------------------------------------------
    fire = page.evaluate("window.__ISLAND_AT__?.('campfire') ?? null")
    if not fire:
        check(f"{device}: campfire is reachable", False, "no campfire in the graph")
    else:
        box = {"x": fire["x"] - 70, "y": fire["y"] - 90, "width": 140, "height": 140}
        _, calm = region_signature(page, box)
        page.mouse.click(fire["x"], fire["y"])
        page.wait_for_timeout(140)
        _, poked = region_signature(page, box)
        check(
            f"{device}: poking the campfire flares it up",
            poked > calm + 1.5,
            f"mean luma {calm:.1f} calm vs {poked:.1f} poked",
        )
        page.wait_for_timeout(1600)

    # --- lantern snuff -------------------------------------------------------
    lantern = page.evaluate("window.__ISLAND_AT__?.('lantern-cage') ?? null")
    if not lantern:
        check(f"{device}: lantern is reachable", False, "no lantern in the graph")
    else:
        box = {
            "x": lantern["x"] - 40,
            "y": lantern["y"] - 30,
            "width": 80,
            "height": 70,
        }
        _, lit = region_signature(page, box)
        page.mouse.click(lantern["x"], lantern["y"])
        page.wait_for_timeout(1200)
        _, snuffed = region_signature(page, box)
        check(
            f"{device}: the lantern can be blown out",
            snuffed < lit - 4,
            f"mean luma {lit:.1f} lit vs {snuffed:.1f} snuffed",
        )
        page.mouse.click(lantern["x"], lantern["y"])
        page.wait_for_timeout(1200)
        _, relit = region_signature(page, box)
        check(
            f"{device}: the lantern can be lit again",
            relit > snuffed + 4,
            f"mean luma {snuffed:.1f} snuffed vs {relit:.1f} relit",
        )


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
                context = browser.new_context(
                    viewport={"width": vw, "height": vh},
                    reduced_motion="no-preference",
                )
                page = context.new_page()
                page.on("pageerror", lambda e, d=device: errors.append(f"{d} pageerror: {e}"))
                page.on(
                    "console",
                    lambda m, d=device: errors.append(f"{d} console.{m.type}: {m.text}")
                    if m.type == "error" and not any(k in m.text for k in IGNORED_CONSOLE)
                    else None,
                )
                page.goto(url, wait_until="load")
                day_stats = run_theme(page, f"{device}-day", vw)

                page.click('[aria-label*="night" i]')
                page.wait_for_timeout(2200)
                night_stats = run_theme(page, f"{device}-night", vw)

                # Night is meant to be lit by fire, lamp, candle and windows.
                if day_stats and night_stats:
                    check(
                        f"{device}: night adds light sources",
                        night_stats["lights"] > day_stats["lights"],
                        f"{day_stats['lights']} day vs {night_stats['lights']} night",
                    )

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
                # The sheet's order and the panel numbering used to be two
                # independent lists, and they disagreed: 00, 02, 06, 05, 01, 03,
                # 04 down the page made the numbers read as decoration.
                numbers = page.eval_on_selector_all(
                    ".menu-links button i", "els => els.map((e) => e.textContent.trim())"
                )
                check(
                    f"{device}: menu runs in chapter order",
                    numbers == sorted(numbers),
                    " ".join(numbers),
                )
                page.screenshot(path=str(OUT / f"{device}-menu.png"))

                page.click(".menu-links li:nth-child(2) button")
                page.wait_for_timeout(2400)
                panel = page.eval_on_selector_all(".content-panel h1", "els => els.length")
                check(f"{device}: chapter panel opens", panel == 1, f"{panel} panels")
                page.screenshot(path=str(OUT / f"{device}-panel.png"))
                page.click(".panel-close")
                page.wait_for_timeout(600)

                run_keyboard(page, device)
                run_focus(page, device)
                if device == "desktop":
                    run_share_assets(page, url)
                    run_easter_eggs(page, device)

                # Leave the island in night mode, then confirm a fresh visit in
                # the same browser profile still opens at night.
                page.click('[aria-label*="night" i]')
                page.wait_for_timeout(900)
                page.close()
                run_persistence(context, url, device)
                context.close()

            # A fresh profile with a dark OS preference and no stored choice.
            page = browser.new_page(
                viewport={"width": 1440, "height": 900},
                color_scheme="dark",
                reduced_motion="no-preference",
            )
            page.on("pageerror", lambda e: errors.append(f"os-dark pageerror: {e}"))
            page.goto(url, wait_until="load")
            early = page.get_attribute("html", "data-theme")
            check("os dark preference: document theme set before React", early == "night", str(early))
            page.wait_for_selector(".overlay.is-ready", timeout=READY_TIMEOUT)
            shell = page.get_attribute(".app-shell", "class") or ""
            check("os dark preference: island opens at night", "is-night" in shell, shell)
            page.screenshot(path=str(OUT / "os-dark.png"))
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
