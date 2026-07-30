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
 * The name prefix is how `qa/verify.py` proves — through
 * `window.__ISLAND_STATS__` — that the painted surfaces really reached the GPU
 * instead of silently falling back to a blank material. `screen:` is the two lit
 * UIs; `art:` is the painted artwork on the easel, the photo wall and the board.
 */
function toTexture(canvas: HTMLCanvasElement, name: string, prefix = 'screen') {
  const texture = new CanvasTexture(canvas)
  texture.name = `${prefix}:${name}`
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

/* ----------------------------------------------------------------- artwork -- */

/**
 * Painted artwork for the surfaces that used to be flat coloured planes.
 *
 * The easel canvas, the four photo frames and the pinned board were built from
 * primitives — a circle and two rectangles for a "painting", a single swatch for
 * a "photo". That was fine when the closest the camera ever came was the home
 * framing. Now every chapter derives its own close-up, and the easel in
 * particular fills a third of the frame, so the emptiest surfaces became the
 * ones on show.
 *
 * They stay flat and hand-placed rather than photographic, so they read as the
 * same world as the low-poly geometry around them. Nothing here is random, so
 * headless screenshots stay diffable.
 */

/** A few translucent horizontal strokes, so a flat fill reads as painted. */
function brushGrain(ctx: Ctx, width: number, height: number, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 26; i += 1) {
    const y = ((i * 97) % height) + (i % 3)
    const w = width * (0.28 + ((i * 37) % 55) / 100)
    const x = ((i * 149) % width) * 0.6
    ctx.fillRect(x, y, w, 1.6 + (i % 2))
  }
  ctx.restore()
}

function polygon(ctx: Ctx, points: Array<[number, number]>, fill: string) {
  ctx.fillStyle = fill
  ctx.beginPath()
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.closePath()
  ctx.fill()
}

function disc(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

/** Plane is 2.04 × 1.24 → aspect 1.645. */
const EASEL_W = 1024
const EASEL_H = 622

/**
 * The work in progress on the easel is the island itself.
 *
 * A painter's own world is the thing most likely to be on their easel, and it
 * gives the chapter a reason to be a close-up: you fly in and recognise where
 * you are standing.
 */
export function createEaselCanvasTexture() {
  const { canvas, ctx } = createCanvas(EASEL_W, EASEL_H)

  // Flat sky bands rather than a smooth gradient, to match the faceted rock.
  const bands: Array<[number, string]> = [
    [0.0, '#f7e6e6'],
    [0.34, '#f2d9dc'],
    [0.58, '#ecccd3'],
    [0.78, '#e3bfc9'],
  ]
  bands.forEach(([start, color], index) => {
    const end = index + 1 < bands.length ? bands[index + 1][0] : 1
    ctx.fillStyle = color
    ctx.fillRect(0, start * EASEL_H, EASEL_W, (end - start) * EASEL_H + 1)
  })

  // Low sun and two cloud lozenges.
  disc(ctx, 726, 176, 62, '#f6dcc6')
  disc(ctx, 726, 176, 40, '#f7e7d6')
  ;[
    [188, 138, 118, 26],
    [286, 196, 78, 18],
    [612, 112, 92, 20],
  ].forEach(([x, y, w, h]) => {
    ctx.fillStyle = 'rgba(255, 252, 250, 0.62)'
    roundRect(ctx, x, y, w, h, h / 2)
    ctx.fill()
  })

  // The island: flat top, faceted underside, hanging rock below it.
  polygon(
    ctx,
    [
      [176, 392],
      [386, 356],
      [612, 362],
      [828, 398],
      [792, 448],
      [560, 470],
      [318, 456],
    ],
    '#cbb2ae',
  )
  polygon(
    ctx,
    [
      [318, 456],
      [560, 470],
      [792, 448],
      [688, 552],
      [560, 596],
      [426, 548],
    ],
    '#a98a8c',
  )
  polygon(
    ctx,
    [
      [426, 548],
      [560, 596],
      [688, 552],
      [572, 622],
      [468, 604],
    ],
    '#8d6f76',
  )
  // Grass cap, so the top reads as ground rather than more stone.
  polygon(
    ctx,
    [
      [176, 392],
      [386, 356],
      [612, 362],
      [828, 398],
      [676, 412],
      [402, 404],
    ],
    '#b9a58f',
  )

  // The tree, three leaf lozenges over a lean trunk.
  ctx.strokeStyle = '#8a6a63'
  ctx.lineWidth = 13
  ctx.beginPath()
  ctx.moveTo(624, 386)
  ctx.lineTo(636, 288)
  ctx.stroke()
  disc(ctx, 616, 258, 58, '#c2a2a8')
  disc(ctx, 668, 282, 44, '#b4919a')
  disc(ctx, 654, 232, 38, '#cdb0b3')

  // The cabin, reduced to a shed roof and a lit opening.
  polygon(
    ctx,
    [
      [300, 382],
      [300, 318],
      [452, 296],
      [452, 372],
    ],
    '#b8a08f',
  )
  polygon(
    ctx,
    [
      [286, 322],
      [466, 292],
      [470, 306],
      [290, 336],
    ],
    '#8d6f76',
  )
  ctx.fillStyle = '#f0d9ae'
  ctx.fillRect(330, 336, 42, 44)

  // Two birds and the signature.
  ctx.strokeStyle = 'rgba(120, 96, 104, 0.7)'
  ctx.lineWidth = 4
  ;[
    [462, 186, 15],
    [508, 210, 11],
  ].forEach(([x, y, s]) => {
    ctx.beginPath()
    ctx.moveTo(x - s, y)
    ctx.lineTo(x, y - s * 0.62)
    ctx.lineTo(x + s, y)
    ctx.stroke()
  })

  brushGrain(ctx, EASEL_W, EASEL_H, 0.05)

  ctx.font = '500 30px "Shadows Into Light Two", cursive'
  ctx.fillStyle = 'rgba(120, 92, 100, 0.72)'
  ctx.textAlign = 'right'
  ctx.fillText('Lisa', EASEL_W - 44, EASEL_H - 34)
  ctx.textAlign = 'left'

  return toTexture(canvas, 'easel', 'art')
}

/* --------------------------------------------------------------- photo wall -- */

/**
 * Four frames, four different pictures.
 *
 * Each canvas matches its own plane's aspect ratio: one shared square texture
 * stretched across a tall portrait and a wide landscape would visibly squash the
 * subject in at least one of them.
 */
const PHOTO_SCENES: Array<{
  name: string
  width: number
  height: number
  paint: (ctx: Ctx, w: number, h: number) => void
}> = [
  {
    // Plane 0.78 × 0.98 → 0.796.
    name: 'portrait',
    width: 512,
    height: 643,
    paint: (ctx, w, h) => {
      ctx.fillStyle = '#f0d5de'
      ctx.fillRect(0, 0, w, h)
      disc(ctx, w * 0.5, h * 0.72, w * 0.46, '#e2b3c4')
      // Shoulders, then head, then a ponytail off to one side.
      polygon(
        ctx,
        [
          [w * 0.12, h],
          [w * 0.22, h * 0.66],
          [w * 0.78, h * 0.66],
          [w * 0.88, h],
        ],
        '#8f6274',
      )
      disc(ctx, w * 0.5, h * 0.44, w * 0.22, '#a97286')
      polygon(
        ctx,
        [
          [w * 0.7, h * 0.4],
          [w * 0.84, h * 0.52],
          [w * 0.74, h * 0.64],
          [w * 0.66, h * 0.5],
        ],
        '#8f6274',
      )
      disc(ctx, w * 0.5, h * 0.2, w * 0.07, '#f6e2c8')
    },
  },
  {
    // Plane 0.72 × 0.82 → 0.878.
    name: 'ridges',
    width: 512,
    height: 583,
    paint: (ctx, w, h) => {
      ctx.fillStyle = '#e9cdd6'
      ctx.fillRect(0, 0, w, h)
      disc(ctx, w * 0.68, h * 0.26, w * 0.15, '#f6dfc9')
      polygon(
        ctx,
        [
          [0, h],
          [0, h * 0.62],
          [w * 0.34, h * 0.34],
          [w * 0.62, h * 0.66],
          [w, h * 0.46],
          [w, h],
        ],
        '#b18e9c',
      )
      polygon(
        ctx,
        [
          [0, h],
          [w * 0.28, h * 0.7],
          [w * 0.58, h * 0.9],
          [w * 0.82, h * 0.72],
          [w, h * 0.84],
          [w, h],
        ],
        '#8a6675',
      )
      ctx.fillStyle = 'rgba(250, 240, 244, 0.75)'
      ctx.beginPath()
      ctx.moveTo(w * 0.26, h * 0.42)
      ctx.lineTo(w * 0.34, h * 0.34)
      ctx.lineTo(w * 0.42, h * 0.42)
      ctx.closePath()
      ctx.fill()
    },
  },
  {
    // Plane 0.68 × 0.58 → 1.172.
    name: 'desk',
    width: 600,
    height: 512,
    paint: (ctx, w, h) => {
      ctx.fillStyle = '#e6c8cf'
      ctx.fillRect(0, 0, w, h)
      fillRound(ctx, w * 0.1, h * 0.16, w * 0.5, h * 0.42, 10, '#4a3b44')
      fillRound(ctx, w * 0.13, h * 0.2, w * 0.44, h * 0.28, 6, '#7f9e88')
      fillRound(ctx, w * 0.06, h * 0.62, w * 0.58, h * 0.14, 8, '#3a2f37')
      disc(ctx, w * 0.79, h * 0.42, w * 0.13, '#f4ece6')
      disc(ctx, w * 0.79, h * 0.42, w * 0.09, '#a8705c')
      fillRound(ctx, w * 0.68, h * 0.72, w * 0.26, h * 0.05, 4, '#d3a25e')
    },
  },
  {
    // Plane 0.82 × 0.66 → 1.242.
    name: 'water',
    width: 636,
    height: 512,
    paint: (ctx, w, h) => {
      ctx.fillStyle = '#f2dbdd'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#e8c2c6'
      ctx.fillRect(0, 0, w, h * 0.3)
      disc(ctx, w * 0.32, h * 0.36, w * 0.12, '#f3d9b6')
      ctx.fillStyle = '#b9909c'
      ctx.fillRect(0, h * 0.52, w, h * 0.48)
      // Flat highlight bars for the water, rather than a noisy ripple.
      ctx.fillStyle = 'rgba(248, 232, 232, 0.5)'
      ;[0.6, 0.7, 0.8, 0.9].forEach((t, index) => {
        const barW = w * (0.34 - index * 0.05)
        ctx.fillRect(w * 0.28 - barW / 2 + index * 12, h * t, barW, 5)
      })
      polygon(
        ctx,
        [
          [w * 0.68, h * 0.54],
          [w * 0.68, h * 0.3],
          [w * 0.84, h * 0.54],
        ],
        '#f6ece8',
      )
      ctx.fillStyle = '#6f5560'
      ctx.fillRect(w * 0.62, h * 0.54, w * 0.26, h * 0.03)
    },
  },
]

export const PHOTO_COUNT = PHOTO_SCENES.length

export function createPhotoTexture(index: number) {
  const scene = PHOTO_SCENES[index % PHOTO_SCENES.length]
  const { canvas, ctx } = createCanvas(scene.width, scene.height)
  scene.paint(ctx, scene.width, scene.height)
  brushGrain(ctx, scene.width, scene.height, 0.04)
  return toTexture(canvas, scene.name, 'art')
}

/* --------------------------------------------------------------- pin board -- */

/** Plane is 2.12 × 1.2 → aspect 1.767. */
const BOARD_W = 1024
const BOARD_H = 580

/** The board above the desk: what is being figured out, not what is finished. */
export function createBoardTexture() {
  const { canvas, ctx } = createCanvas(BOARD_W, BOARD_H)

  ctx.fillStyle = '#93a89c'
  ctx.fillRect(0, 0, BOARD_W, BOARD_H)
  brushGrain(ctx, BOARD_W, BOARD_H, 0.05)

  const pinned = (x: number, y: number, w: number, h: number, tilt: number, fill: string) => {
    ctx.save()
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(tilt)
    ctx.fillStyle = 'rgba(40, 34, 38, 0.16)'
    roundRect(ctx, -w / 2 + 5, -h / 2 + 7, w, h, 6)
    ctx.fill()
    fillRound(ctx, -w / 2, -h / 2, w, h, 6, fill)
    return () => ctx.restore()
  }

  // A wireframe card: header bar, two columns, a button.
  let done = pinned(74, 96, 258, 320, -0.035, '#f4efe8')
  ctx.fillStyle = '#c9c0bb'
  ctx.fillRect(-108, -138, 216, 26)
  ctx.fillRect(-108, -96, 128, 12)
  ctx.fillRect(-108, -74, 92, 12)
  ctx.fillStyle = '#dcd4cf'
  ctx.fillRect(-108, -44, 100, 96)
  ctx.fillRect(8, -44, 100, 96)
  fillRound(ctx, -108, 74, 110, 32, 6, '#bd4b68')
  done()

  // A colour study: five swatches and their notes.
  done = pinned(378, 132, 264, 250, 0.028, '#f6f1ea')
  const swatches = ['#bd4b68', '#d3a25e', '#7f9e88', '#8b687b', '#e8d3d8']
  swatches.forEach((color, index) => {
    fillRound(ctx, -108, -92 + index * 40, 74, 30, 5, color)
    ctx.fillStyle = 'rgba(70, 58, 64, 0.35)'
    ctx.fillRect(-24, -80 + index * 40, 96 - index * 12, 8)
  })
  done()

  // A loose sketch of the island, drawn in line rather than filled.
  done = pinned(686, 88, 262, 300, -0.02, '#f3ece4')
  ctx.strokeStyle = 'rgba(90, 72, 80, 0.62)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(-96, -18)
  ctx.lineTo(-30, -44)
  ctx.lineTo(52, -40)
  ctx.lineTo(98, -12)
  ctx.lineTo(34, 32)
  ctx.lineTo(-46, 26)
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-46, 26)
  ctx.lineTo(0, 96)
  ctx.lineTo(34, 32)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(40, -40)
  ctx.lineTo(46, -96)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(46, -114, 26, 0, Math.PI * 2)
  ctx.stroke()
  ctx.font = '400 26px "Shadows Into Light Two", cursive'
  ctx.fillStyle = 'rgba(90, 72, 80, 0.7)'
  ctx.textAlign = 'center'
  ctx.fillText('next one', 0, 128)
  ctx.textAlign = 'left'
  done()

  // Tape corners, to sell that these are pinned to a board.
  ctx.fillStyle = 'rgba(246, 240, 232, 0.55)'
  ;[
    [92, 82, -0.5],
    [612, 120, 0.4],
    [702, 74, -0.45],
  ].forEach(([x, y, tilt]) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tilt)
    ctx.fillRect(-26, -9, 52, 18)
    ctx.restore()
  })

  return toTexture(canvas, 'board', 'art')
}
