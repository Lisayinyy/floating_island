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
import time
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else (ROOT / "qa" / "shots")
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 4390

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
FIRST_CHAPTER = next(iter(CHAPTER_LABELS))
# Not 1.0: the photo wall is four separate frames, so a sample or two legitimately
# slips between them and lands on the wall behind.
MIN_VISIBLE_RATIO = 0.85

# Where a chapter's object is supposed to land, and how big it should read.
#
# "Visible" was never the whole requirement, and asserting only that let a real
# regression through: the easel was completely unobstructed, it was just tiny and
# floating in empty sky next to the island.
#
# What replaced the hand-written NDC slots that used to live here is the question
# those slots were a proxy for: does the chapter view collide with the panel that
# is describing it? The slots were tuned against a 560px-tall phone panel, and
# when the panel grew to 494 of 844 pixels they still passed while the object's
# lower half sat behind it. The panel's own rectangle is the honest reference.
#
# A few percent of overlap is the object's bounding box catching the panel's
# rounded corner, which nobody can see; a third of it is the bug.
MAX_PANEL_OVERLAP = 0.06
# How far off-centre the object may sit inside the space the panel leaves. The
# island's idle float and the smallest objects clamping against the camera's
# minimum distance both nudge this, so it is a quarter of the band rather than a
# hairline — the failure it exists to catch was two thirds of the band.
MAX_BAND_OFFCENTRE = 0.25
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


def panel_overlap(probe: dict | None, panel: dict | None) -> float | None:
    """Fraction of the object's on-screen box that the chapter panel covers.

    Both rectangles are in CSS pixels: the object's comes from the probe's
    projected bounding box, the panel's from its own layout. Nothing here is a
    number someone tuned, which is the point — the panel is free to change size
    with its copy or its media query and this check follows it.
    """
    if not probe or not panel:
        return None
    rect = probe.get("rect")
    if not rect or rect["width"] <= 0 or rect["height"] <= 0:
        return None
    wide = min(rect["x"] + rect["width"], panel["x"] + panel["width"]) - max(
        rect["x"], panel["x"]
    )
    tall = min(rect["y"] + rect["height"], panel["y"] + panel["height"]) - max(
        rect["y"], panel["y"]
    )
    if wide <= 0 or tall <= 0:
        return 0.0
    return (wide * tall) / (rect["width"] * rect["height"])


def loader_gone(page, timeout_ms: int = 8000) -> tuple[bool, str]:
    """Whether the loading screen has actually left the pixels.

    The loader is a full-screen plate over the island, so "dismissed" cannot mean
    "wearing the class that is supposed to fade it". `is-done` lands a frame
    before the computed style follows it, and a fade that never completed would
    keep the plate up while the class insisted otherwise. Measured instead:
    computed opacity or visibility, plus a hit test at the middle of the
    viewport, because the requirement is that the visitor can see and click the
    island.
    """
    deadline = time.monotonic() + timeout_ms / 1000
    detail = "no loader"
    while True:
        state = page.evaluate(
            """() => {
                const el = document.querySelector('.loading-screen')
                if (!el) return { gone: true, detail: 'removed from the DOM' }
                const style = getComputedStyle(el)
                const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
                const name = hit
                    ? hit.tagName.toLowerCase() + (typeof hit.className === 'string' && hit.className.trim()
                        ? '.' + hit.className.trim().split(/\\s+/).join('.')
                        : '')
                    : 'nothing'
                const faded = style.visibility === 'hidden' || Number(style.opacity) === 0
                return {
                    gone: faded && !(hit && el.contains(hit)),
                    detail: `opacity ${style.opacity}, ${style.visibility}, centre hits ${name}`,
                }
            }"""
        )
        detail = state["detail"]
        if state["gone"]:
            return True, detail
        if time.monotonic() >= deadline:
            return False, detail
        page.wait_for_timeout(100)


def run_theme(page, label: str, viewport_width: int) -> dict | None:
    page.wait_for_selector(".overlay.is-ready", timeout=READY_TIMEOUT)
    check(f"{label}: intro completes", True)

    gone, detail = loader_gone(page)
    check(f"{label}: the loading screen actually leaves", gone, detail)

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


def flights_so_far(page) -> int:
    return int(page.evaluate("window.__ISLAND_FLIGHT__?.count ?? 0"))


def settled_probe(page, chapter: str, since: int, tries: int = 40) -> dict | None:
    """Read the probe once the chapter's camera has actually landed.

    Two earlier versions of this were wrong in instructive ways. A fixed 4.2s
    sleep raced the tween — under software WebGL a 1.05s tween can take several
    wall-clock seconds, and a mid-flight probe reported the easel covering 156%
    of the frame when it settles at 40%. Watching for the projection to stop
    changing then failed the other way: "stopped" is indistinguishable from "not
    started", and when the page is frame-starved two samples 400ms apart can land
    on the same rendered frame while the camera is still mid-arc.

    So the scene publishes its flight state, and this waits for a flight *newer
    than the one in progress when the chapter was clicked* to finish.
    """
    for _ in range(tries):
        flight = page.evaluate("window.__ISLAND_FLIGHT__ ?? null")
        if flight and flight["count"] > since and not flight["flying"]:
            # One more beat for the idle float, which never stops.
            page.wait_for_timeout(300)
            break
        page.wait_for_timeout(300)
    return page.evaluate("(id) => window.__ISLAND_PROBE__?.(id) ?? null", chapter)


def run_focus(page, device: str) -> None:
    """Open every chapter and confirm the camera can actually see its object."""
    for chapter, label in CHAPTER_LABELS.items():
        before = flights_so_far(page)
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

        # Which chapter actually opened, before anything is concluded about the
        # framing: a probe reports on the object it was asked about whether or not
        # that is the chapter on screen.
        eyebrow = page.evaluate(
            "() => document.querySelector('.panel-eyebrow')?.textContent?.trim() ?? ''"
        )
        check(
            f"{device}: clicking {label} opens that chapter",
            label in eyebrow,
            f"panel reads '{eyebrow}'",
        )

        if chapter == FIRST_CHAPTER:
            painted, painted_detail = panel_painted(page)
            check(f"{device}: the chapter panel is readable", painted, painted_detail)

        probe = settled_probe(page, chapter, before)
        detail = json.dumps(probe)
        check(
            f"{device}: {chapter} chapter frames its object",
            bool(probe) and probe["visibleRatio"] >= MIN_VISIBLE_RATIO,
            detail,
        )

        layout = layout_rects(page)
        panel = layout["panel"] if layout else None
        overlap = panel_overlap(probe, panel)
        check(
            f"{device}: {chapter} clears the panel describing it",
            panel is not None and overlap is not None and overlap <= MAX_PANEL_OVERLAP,
            f"{overlap:.1%} of the object behind the panel {json.dumps(panel)}"
            if overlap is not None
            else f"probe {detail} panel {json.dumps(panel)}",
        )
        centring = band_offcentre(probe, layout)
        check(
            f"{device}: {chapter} sits centred in the space the panel leaves",
            centring is not None and centring[0] <= MAX_BAND_OFFCENTRE,
            f"{centring[1]} ({centring[0]:.0%} off-centre)" if centring else detail,
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


def panel_painted(page, timeout_ms: int = 4000) -> tuple[bool, str]:
    """Whether the chapter panel is actually readable, not merely present.

    Every other assertion about a chapter treats the panel as a rectangle: the
    object has to clear it and sit centred beside it. All of that stays true of a
    panel at zero opacity, which is a real failure mode here, because the panel
    arrives on a CSS animation — one missing `animation-fill-mode` and the words
    would be invisible while the layout around them behaved perfectly.
    """
    deadline = time.monotonic() + timeout_ms / 1000
    detail = "no panel"
    while True:
        state = page.evaluate(
            """() => {
                const el = document.querySelector('.content-panel')
                if (!el) return { ok: false, detail: 'no panel' }
                const style = getComputedStyle(el)
                const rect = el.getBoundingClientRect()
                const heading = el.querySelector('h1')
                const words = (heading?.textContent ?? '').trim()
                return {
                    ok: Number(style.opacity) === 1
                        && style.visibility === 'visible'
                        && rect.width > 200
                        && rect.height > 120
                        && words.length > 3,
                    detail: `opacity ${style.opacity}, ${Math.round(rect.width)}x${Math.round(rect.height)}, reads '${words}'`,
                }
            }"""
        )
        detail = state["detail"]
        if state["ok"]:
            return True, detail
        if time.monotonic() >= deadline:
            return False, detail
        page.wait_for_timeout(100)


def layout_rects(page) -> dict | None:
    """The chapter panel, the topbar and the viewport, in CSS pixels."""
    return page.evaluate(
        """() => {
            const panel = document.querySelector('.content-panel')
            if (!panel) return null
            const p = panel.getBoundingClientRect()
            const bar = document.querySelector('.topbar')?.getBoundingClientRect()
            return {
                panel: { x: p.x, y: p.y, width: p.width, height: p.height },
                barBottom: bar ? bar.y + bar.height : 0,
                vw: window.innerWidth,
                vh: window.innerHeight,
            }
        }"""
    )


def band_offcentre(probe: dict | None, layout: dict | None) -> tuple[float, str] | None:
    """How far off-centre the object sits in the space the panel leaves free.

    Expressed as a fraction of that space, from the gap on each side of the
    object. This is the honest form of a check that used to compare the object's
    position against two hand-written NDC constants: it says what the framing is
    actually for without repeating the framing's own arithmetic, so it stays true
    when the panel changes size.

    It earned its place immediately. Reduced motion was switched from a tween to
    `duration: 0`, which does not fire `onUpdate` — so nothing called
    `controls.update()`, OrbitControls' damping pulled the camera back toward its
    stale internal state, and the easel landed 350px right of its mark. Every
    other check passed: the object was visible, the right size, and clear of the
    panel by 34 pixels of luck.
    """
    if not probe or not layout:
        return None
    rect = probe.get("rect")
    if not rect:
        return None
    panel = layout["panel"]
    if panel["width"] > layout["vw"] * 0.6:
        # Docked bottom: the free band runs from under the topbar to the panel.
        start, end = layout["barBottom"], panel["y"]
        near, far = rect["y"], rect["y"] + rect["height"]
        axis = "vertical"
    else:
        # Docked to one side. The band is whichever side of it is bigger.
        if panel["x"] + panel["width"] / 2 > layout["vw"] / 2:
            start, end = 0.0, panel["x"]
        else:
            start, end = panel["x"] + panel["width"], float(layout["vw"])
        near, far = rect["x"], rect["x"] + rect["width"]
        axis = "horizontal"

    span = max(end - start, 1.0)
    before, after = near - start, end - far
    return (
        abs(before - after) / span,
        f"{axis} gaps {before:.0f}px vs {after:.0f}px in a {span:.0f}px band",
    )


def run_reduced_motion(browser, url: str, errors: list[str]) -> None:
    """The site a visitor gets when their system asks for less motion.

    This path had no coverage for five rounds, and it was wrong: the intro and
    the idle float respected the setting but the chapter camera did not, so the
    one interaction the whole site is built around still swung through a
    one-second arc at someone who had asked it not to. Nothing else in this suite
    would have noticed, because every other context here declares
    `no-preference` — which is exactly why an untested branch is worth a context
    of its own rather than a flag on an existing one.
    """
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        reduced_motion="reduce",
    )
    page = context.new_page()
    page.on("pageerror", lambda e: errors.append(f"reduced-motion pageerror: {e}"))
    page.on(
        "console",
        lambda m: errors.append(f"reduced-motion console.{m.type}: {m.text}")
        if m.type == "error" and not any(k in m.text for k in IGNORED_CONSOLE)
        else None,
    )
    page.goto(url, wait_until="load")

    # The entrance is skipped under this setting, so the loader lifting is the
    # only proof the scene got built at all.
    page.wait_for_selector(".loading-screen.is-done", timeout=READY_TIMEOUT)
    page.wait_for_selector(".overlay.is-ready", timeout=READY_TIMEOUT)
    gone, detail = loader_gone(page)
    check("reduced motion: the island still arrives", gone, detail)

    dust = page.evaluate(
        "() => { const d = document.querySelector('.dust'); return d ? getComputedStyle(d).display : 'absent' }"
    )
    check("reduced motion: drifting dust is gone", dust in ("none", "absent"), str(dust))

    before = flights_so_far(page)
    opened = page.evaluate(
        """(label) => {
            const el = [...document.querySelectorAll('.object-label')]
                .find((node) => node.textContent.trim() === label)
            if (!el) return false
            el.focus()
            el.click()
            return true
        }""",
        "MY PAINTINGS",
    )
    if not opened:
        check("reduced motion: a chapter is reachable", False, "no label")
    else:
        started = time.monotonic()
        landed = False
        for _ in range(40):
            flight = page.evaluate("window.__ISLAND_FLIGHT__ ?? null")
            if flight and flight["count"] > before and not flight["flying"]:
                landed = True
                break
            page.wait_for_timeout(100)
        elapsed = time.monotonic() - started
        # A cut, not a dolly. The generous ceiling is for the harness: reading the
        # flag costs a round trip through a software-rendered page.
        check(
            "reduced motion: the camera cuts instead of flying",
            landed and elapsed < 0.9,
            f"landed in {elapsed:.2f}s",
        )
        probe = page.evaluate("() => window.__ISLAND_PROBE__?.('art') ?? null")
        check(
            "reduced motion: the chapter still frames its object",
            bool(probe)
            and probe["visibleRatio"] >= MIN_VISIBLE_RATIO
            and MIN_FRAME_FILL <= probe["fill"] <= MAX_FRAME_FILL,
            json.dumps(probe),
        )
        # The cut has to arrive at the same place the flight would have. This is
        # the check that caught `duration: 0` leaving the camera 350px short.
        centring = band_offcentre(probe, layout_rects(page))
        check(
            "reduced motion: the cut lands where the framing aimed",
            centring is not None and centring[0] <= MAX_BAND_OFFCENTRE,
            f"{centring[1]} ({centring[0]:.0%} off-centre)" if centring else "no probe",
        )
        painted, painted_detail = panel_painted(page)
        check("reduced motion: the chapter is readable", painted, painted_detail)
        page.screenshot(path=str(OUT / "reduced-motion.png"))
        # Every other check in this context is answered by JavaScript: a flight
        # flag, a raycast against the scene graph. All of them are true of a page
        # that never painted a pixel, and for one round this context's only
        # artefact was a flat plate of loading screen while all five checks
        # passed. The image has to be asserted like the others.
        luma, buckets = spread(OUT / "reduced-motion.png")
        check(
            "reduced motion: the island is actually on screen",
            luma >= 40 and buckets >= 25,
            f"luma spread {luma:.1f}, {buckets} buckets",
        )

    page.close()
    context.close()


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
    # Poll: the stats snapshot is rebuilt on a 450ms timer, and a frame-starved
    # page delays timers, so a fixed wait reported "not in silhouette" while the
    # screenshot on the next line was plainly a silhouette.
    stats = None
    for _ in range(14):
        page.wait_for_timeout(400)
        stats = page.evaluate("window.__ISLAND_STATS__ ?? null")
        if stats and stats.get("silhouette") is True:
            break
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


def serve_on(port: int) -> tuple[socketserver.TCPServer, str]:
    """Serve `dist/` on a port that a back-to-back run can bind again.

    `allow_reuse_address` has to be set on the class *before* the server is
    constructed, because that is when the socket is bound. Setting it on the
    instance afterwards did nothing, so a second run inside a minute of the first
    died on "address already in use" — which is why every run so far was given a
    hand-picked fresh port.
    """
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", port), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, f"http://127.0.0.1:{port}/"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    httpd, url = serve_on(PORT)
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
                # Every byte this page needs has to come from this page's own
                # origin. Fonts used to come from Google, which cost a DNS
                # lookup, a TLS handshake and a stylesheet round trip that also
                # blocked script execution — and an `@import` is one line, so it
                # could come back without anyone noticing.
                offsite: list[str] = []
                page.on(
                    "request",
                    lambda r: offsite.append(r.url)
                    if not r.url.startswith(url) and not r.url.startswith("data:")
                    else None,
                )
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

                check(
                    f"{device}: nothing is loaded from a third party",
                    not offsite,
                    ", ".join(sorted({u.split("/")[2] for u in offsite})) or "same origin only",
                )

                # Leave the island in night mode, then confirm a fresh visit in
                # the same browser profile still opens at night.
                page.click('[aria-label*="night" i]')
                page.wait_for_timeout(900)
                page.close()
                run_persistence(context, url, device)
                context.close()

            run_reduced_motion(browser, url, errors)

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
