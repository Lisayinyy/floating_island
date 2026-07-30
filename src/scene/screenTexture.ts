import { CanvasTexture, SRGBColorSpace } from 'three'

/**
 * Screen content painted with Canvas2D and uploaded as a texture.
 *
 * The laptop and the AI console used to be flat pink/green planes. From the
 * home framing they read as "a screen", but every chapter view flies the camera
 * close enough that the emptiness became the most detailed thing on the island.
 * Drawing the UI keeps the flat, hand-placed look of the rest of the scene while
 * giving those two objects something to actually say.
 *
 * Everything here is deterministic — no `Math.random` — so headless screenshots
 * stay diffable between builds.
 */

type Ctx = CanvasRenderingContext2D

const MONO = '600 20px "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace'

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas2D is unavailable, cannot paint screen textures')
  return { canvas, ctx }
}

/**
 * The `screen:` name prefix is how `qa/verify.py` proves — through
 * `window.__ISLAND_STATS__` — that both painted screens really reached the GPU
 * instead of silently falling back to a blank material.
 */
function toTexture(canvas: HTMLCanvasElement, name: string) {
  const texture = new CanvasTexture(canvas)
  texture.name = `screen:${name}`
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function fillRound(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = fill
  roundRect(ctx, x, y, w, h, r)
  ctx.fill()
}

/** A window chrome strip with the three traffic-light dots. */
function titleBar(ctx: Ctx, width: number, height: number, bg: string, title: string) {
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)
  const dots = ['#d97a8c', '#d8b26a', '#7f9e88']
  dots.forEach((color, index) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(34 + index * 30, height / 2, 8.5, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.fillStyle = 'rgba(240, 230, 236, 0.6)'
  ctx.font = '500 17px "IBM Plex Mono", ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(title, width / 2, height / 2 + 1)
  ctx.textAlign = 'left'
}

/* ------------------------------------------------------------------ laptop -- */

/** Plane is 1.25 × 0.66, so keep the texture on the same 1.894 aspect. */
const LAPTOP_W = 1024
const LAPTOP_H = 540

const CODE_LINES: Array<Array<[string, string]>> = [
  [
    ['export ', '#c58fb4'],
    ['function ', '#7fa8d4'],
    ['island', '#e8dfe4'],
    ['(', '#8d8792'],
    ['seed', '#d8a86a'],
    [') {', '#8d8792'],
  ],
  [
    ['  const ', '#c58fb4'],
    ['rim ', '#e8dfe4'],
    ['= ', '#8d8792'],
    ['rimNoise', '#8fbf9f'],
    ['(seed)', '#8d8792'],
  ],
  [
    ['  return ', '#c58fb4'],
    ['lump', '#8fbf9f'],
    ['(rim, ', '#8d8792'],
    ['0.42', '#d8a86a'],
    [')', '#8d8792'],
  ],
  [['}', '#8d8792']],
  [],
  [
    ['// six objects, six chapters', '#6f6a77'],
  ],
  [
    ['const ', '#c58fb4'],
    ['chapters ', '#e8dfe4'],
    ['= ', '#8d8792'],
    ['[', '#8d8792'],
  ],
  [
    ["  'philosophy'", '#9dbfa8'],
    [', ', '#8d8792'],
    ["'about'", '#9dbfa8'],
    [',', '#8d8792'],
  ],
  [
    ["  'experience'", '#9dbfa8'],
    [', ', '#8d8792'],
    ["'toolkit'", '#9dbfa8'],
    [',', '#8d8792'],
  ],
  [
    ["  'work'", '#9dbfa8'],
    [', ', '#8d8792'],
    ["'art'", '#9dbfa8'],
    [',', '#8d8792'],
  ],
  [[']', '#8d8792']],
]

export function createLaptopScreenTexture() {
  const { canvas, ctx } = createCanvas(LAPTOP_W, LAPTOP_H)

  // Editor field.
  ctx.fillStyle = '#221a26'
  ctx.fillRect(0, 0, LAPTOP_W, LAPTOP_H)
  titleBar(ctx, LAPTOP_W, 44, '#181220', 'islandGeometry.ts — floating_island')

  // Sidebar with a file tree.
  const sidebarW = 208
  ctx.fillStyle = '#1c1522'
  ctx.fillRect(0, 44, sidebarW, LAPTOP_H - 44)
  ctx.font = '500 16px "IBM Plex Mono", ui-monospace, monospace'
  const files = [
    ['src/', false],
    ['  App.tsx', false],
    ['  scene/', false],
    ['    World.tsx', false],
    ['    Room.tsx', false],
    ['    islandGeometry.ts', true],
    ['  store/', false],
    ['qa/verify.py', false],
  ] as const
  files.forEach(([name, active], index) => {
    const y = 76 + index * 30
    if (active) fillRound(ctx, 8, y - 15, sidebarW - 16, 26, 5, 'rgba(213, 130, 160, 0.22)')
    ctx.fillStyle = active ? '#f0cfdd' : 'rgba(232, 223, 228, 0.5)'
    ctx.fillText(name, 16, y + 3)
  })

  // Gutter + syntax-coloured code.
  ctx.font = MONO
  CODE_LINES.forEach((tokens, index) => {
    const y = 82 + index * 33
    ctx.fillStyle = 'rgba(150, 140, 156, 0.45)'
    ctx.fillText(String(index + 1).padStart(2, ' '), sidebarW + 22, y)
    let x = sidebarW + 74
    tokens.forEach(([text, color]) => {
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
      x += ctx.measureText(text).width
    })
  })

  // Caret parked at the end of the last line, as if mid-edit.
  ctx.fillStyle = 'rgba(240, 207, 221, 0.85)'
  ctx.fillRect(sidebarW + 74 + 12, 82 + 10 * 33 - 16, 3, 24)

  // Status bar.
  ctx.fillStyle = '#181220'
  ctx.fillRect(sidebarW, LAPTOP_H - 34, LAPTOP_W - sidebarW, 34)
  ctx.font = '500 15px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillStyle = 'rgba(232, 223, 228, 0.55)'
  ctx.fillText('main ✓  31/31 qa checks', sidebarW + 20, LAPTOP_H - 12)
  ctx.fillStyle = '#8fbf9f'
  ctx.fillText('TypeScript', LAPTOP_W - 128, LAPTOP_H - 12)

  return toTexture(canvas, 'laptop')
}

/* ----------------------------------------------------------------- console -- */

/** Plane is 1.35 × 0.82 → aspect 1.646. */
const CONSOLE_W = 1024
const CONSOLE_H = 622

export function createConsoleScreenTexture() {
  const { canvas, ctx } = createCanvas(CONSOLE_W, CONSOLE_H)

  ctx.fillStyle = '#16211d'
  ctx.fillRect(0, 0, CONSOLE_W, CONSOLE_H)
  titleBar(ctx, CONSOLE_W, 48, '#101a17', 'AI CREATIVE TOOLKIT')

  // Prompt field.
  fillRound(ctx, 36, 76, CONSOLE_W - 72, 78, 12, '#1e2c26')
  ctx.font = '500 22px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillStyle = 'rgba(196, 219, 205, 0.55)'
  ctx.fillText('prompt', 56, 108)
  ctx.font = '600 24px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillStyle = '#e6f1e9'
  ctx.fillText('a floating island, low poly, dusk', 56, 140)

  // Run button.
  fillRound(ctx, CONSOLE_W - 208, 92, 152, 46, 10, '#7f9e88')
  ctx.font = '600 20px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillStyle = '#12211a'
  ctx.textAlign = 'center'
  ctx.fillText('GENERATE', CONSOLE_W - 132, 122)
  ctx.textAlign = 'left'

  // Deterministic "latency per run" bar chart.
  const bars = [0.42, 0.61, 0.35, 0.78, 0.55, 0.9, 0.47, 0.68, 0.83, 0.52, 0.72, 0.6]
  const chartX = 36
  const chartY = 190
  const chartW = 560
  const chartH = 220
  fillRound(ctx, chartX, chartY, chartW, chartH, 12, '#1b2823')
  const slot = chartW / bars.length
  bars.forEach((value, index) => {
    const h = value * (chartH - 56)
    const x = chartX + index * slot + slot * 0.24
    const w = slot * 0.52
    fillRound(ctx, x, chartY + chartH - 26 - h, w, h, 4, index === 5 ? '#d8b26a' : '#6f9c82')
  })
  ctx.font = '500 15px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillStyle = 'rgba(196, 219, 205, 0.5)'
  ctx.fillText('ITERATIONS / DAY', chartX + 18, chartY + chartH - 8)

  // Model checklist.
  const listX = 624
  fillRound(ctx, listX, chartY, CONSOLE_W - listX - 36, chartH, 12, '#1b2823')
  const rows = [
    ['diffusion', '#7f9e88'],
    ['agent loop', '#7f9e88'],
    ['voice', '#d8b26a'],
    ['render farm', '#6f9c82'],
  ] as const
  rows.forEach(([name, color], index) => {
    const y = chartY + 42 + index * 46
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(listX + 30, y - 6, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '500 19px "IBM Plex Mono", ui-monospace, monospace'
    ctx.fillStyle = 'rgba(230, 241, 233, 0.82)'
    ctx.fillText(name, listX + 50, y)
  })

  // Waveform strip along the bottom — a fixed sine sum, so it never shifts.
  const waveY = 470
  fillRound(ctx, 36, waveY, CONSOLE_W - 72, 118, 12, '#1b2823')
  ctx.strokeStyle = '#9dc4ad'
  ctx.lineWidth = 3
  ctx.beginPath()
  for (let x = 0; x <= CONSOLE_W - 112; x += 6) {
    const t = x / 96
    const y = waveY + 59 + Math.sin(t) * 22 + Math.sin(t * 2.7) * 11 + Math.sin(t * 0.6) * 8
    if (x === 0) ctx.moveTo(56 + x, y)
    else ctx.lineTo(56 + x, y)
  }
  ctx.stroke()

  return toTexture(canvas, 'console')
}
