import { COLORS } from '@/validators/option-validator'

export type RgbColor = { r: number; g: number; b: number }
export type HslColor = { h: number; s: number; l: number }

export type ImageColorProfile = RgbColor &
  HslColor & {
    hex: string
    closestColor: (typeof COLORS)[number]
    edgeUniformity: number
  }

export type AnalyzedImageResult = {
  profile: ImageColorProfile
  trimmedUrl: string
  transparentUrl: string | null
  hasUniformBackground: boolean
  trimApplied: boolean
}

export function hexToRgb(hex: string): RgbColor {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      default:
        h = (rn - gn) / d + 4
        break
    }
    h *= 60
  }

  return { h, s: s * 100, l: l * 100 }
}

function rgbDist(a: RgbColor, r2: number, g2: number, b2: number): number {
  const dr = a.r - r2
  const dg = a.g - g2
  const db = a.b - b2
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/** Perceptual weighted RGB distance (redmean approximation). */
function colorDistance(a: RgbColor, b: RgbColor): number {
  const rMean = (a.r + b.r) / 2
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rMean) / 256) * db * db
  )
}

export function findClosestCaseColor(rgb: RgbColor): (typeof COLORS)[number] {
  let best: (typeof COLORS)[number] = COLORS[0]
  let bestDist = Infinity
  for (const c of COLORS) {
    const dist = colorDistance(rgb, hexToRgb(c.hex))
    if (dist < bestDist) {
      bestDist = dist
      best = c
    }
  }
  return best
}

/**
 * Returns true if the target preset color belongs to the same hue/neutral
 * family as the sampled image edge color, allowing seamless shade adaptation.
 */
export function isSameColorFamily(
  edge: RgbColor & HslColor,
  presetHex: string
): boolean {
  const presetRgb = hexToRgb(presetHex)
  const presetHsl = rgbToHsl(presetRgb)

  if (edge.s < 18 && presetHsl.s < 18) {
    return Math.abs(edge.l - presetHsl.l) < 55
  }

  if (edge.s < 15 || presetHsl.s < 15) {
    return colorDistance(edge, presetRgb) < 95
  }

  const rawDiff = Math.abs(edge.h - presetHsl.h)
  const hueDiff = Math.min(rawDiff, 360 - rawDiff)
  return hueDiff <= 42
}

/**
 * Analyzes an uploaded image:
 * 1. Detects and trims any thin artificial screenshot/Canva border frame around edges.
 * 2. Detects the true inner background/perimeter color and uniformity.
 * 3. When the background is solid/uniform, performs fast BFS flood-fill + small-hole
 *    knockout so the design blends cleanly onto ANY selected case color.
 */
export async function analyzeAndCleanImage(
  imageUrl: string
): Promise<AnalyzedImageResult | null> {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Image load failed'))
    })

    const maxDim = 1000
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const W = Math.max(16, Math.round(img.width * scale))
    const H = Math.max(16, Math.round(img.height * scale))

    const srcCanvas = document.createElement('canvas')
    srcCanvas.width = W
    srcCanvas.height = H
    const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })
    if (!srcCtx) return null

    srcCtx.drawImage(img, 0, 0, W, H)
    const imgData = srcCtx.getImageData(0, 0, W, H)
    const data = imgData.data

    // 1. Sample an inner perimeter band (d = 8..13px) to find dominant background color
    const refOffset = Math.min(10, Math.floor(Math.min(W, H) * 0.08))
    const buckets = new Map<
      string,
      { count: number; rSum: number; gSum: number; bSum: number }
    >()
    let opaqueCount = 0
    let totalRefSamples = 0

    for (let y = refOffset; y < H - refOffset; y++) {
      for (let x = refOffset; x < W - refOffset; x++) {
        const isRefBand =
          x < refOffset + 4 ||
          x >= W - refOffset - 4 ||
          y < refOffset + 4 ||
          y >= H - refOffset - 4
        if (!isRefBand) continue
        totalRefSamples++
        const idx = (y * W + x) * 4
        const a = data[idx + 3]
        if (a < 128) continue
        opaqueCount++
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const key = `${r >> 4}-${g >> 4}-${b >> 4}`
        const entry = buckets.get(key)
        if (entry) {
          entry.count++
          entry.rSum += r
          entry.gSum += g
          entry.bSum += b
        } else {
          buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b })
        }
      }
    }

    if (buckets.size === 0 || opaqueCount === 0) return null

    let bestBucket = { count: 0, rSum: 0, gSum: 0, bSum: 0 }
    for (const bucket of buckets.values()) {
      if (bucket.count > bestBucket.count) bestBucket = bucket
    }

    const bgRgb: RgbColor = {
      r: Math.round(bestBucket.rSum / bestBucket.count),
      g: Math.round(bestBucket.gSum / bestBucket.count),
      b: Math.round(bestBucket.bSum / bestBucket.count),
    }

    // Measure how uniform the inner perimeter background is
    let uniformMatches = 0
    for (let y = refOffset; y < H - refOffset; y++) {
      for (let x = refOffset; x < W - refOffset; x++) {
        const isRefBand =
          x < refOffset + 4 ||
          x >= W - refOffset - 4 ||
          y < refOffset + 4 ||
          y >= H - refOffset - 4
        if (!isRefBand) continue
        const idx = (y * W + x) * 4
        if (data[idx + 3] < 128) continue
        if (rgbDist(bgRgb, data[idx], data[idx + 1], data[idx + 2]) <= 30) {
          uniformMatches++
        }
      }
    }

    const alreadyTransparentRatio = 1 - opaqueCount / Math.max(1, totalRefSamples)
    const edgeUniformity = uniformMatches / Math.max(1, opaqueCount)

    // 2. Detect thin artificial border frame on each edge independently (up to 10px)
    const maxBorderCheck = Math.min(10, Math.floor(Math.min(W, H) * 0.04))
    const detectEdgeTrim = (side: 'top' | 'bottom' | 'left' | 'right') => {
      let trim = 0
      const len = side === 'top' || side === 'bottom' ? W : H
      for (let d = 0; d < maxBorderCheck; d++) {
        let diff = 0
        let count = 0
        for (let k = maxBorderCheck; k < len - maxBorderCheck; k += 4) {
          const x = side === 'left' ? d : side === 'right' ? W - 1 - d : k
          const y = side === 'top' ? d : side === 'bottom' ? H - 1 - d : k
          const idx = (y * W + x) * 4
          if (data[idx + 3] < 128) continue
          count++
          if (rgbDist(bgRgb, data[idx], data[idx + 1], data[idx + 2]) > 32) {
            diff++
          }
        }
        if (count > 0 && diff / count > 0.25) {
          trim = d + 1
        }
      }
      return trim
    }

    const trimTop = detectEdgeTrim('top')
    const trimBottom = detectEdgeTrim('bottom')
    const trimLeft = detectEdgeTrim('left')
    const trimRight = detectEdgeTrim('right')
    const trimApplied =
      trimTop > 0 || trimBottom > 0 || trimLeft > 0 || trimRight > 0

    const cropW = Math.max(8, W - trimLeft - trimRight)
    const cropH = Math.max(8, H - trimTop - trimBottom)

    const trimCanvas = document.createElement('canvas')
    trimCanvas.width = cropW
    trimCanvas.height = cropH
    const trimCtx = trimCanvas.getContext('2d', { willReadFrequently: true })
    if (!trimCtx) return null
    trimCtx.drawImage(srcCanvas, trimLeft, trimTop, cropW, cropH, 0, 0, cropW, cropH)
    const trimmedUrl = trimCanvas.toDataURL('image/png')

    const hsl = rgbToHsl(bgRgb)
    const hex = rgbToHex(bgRgb)
    const closestColor = findClosestCaseColor(bgRgb)

    const hasUniformBackground =
      edgeUniformity >= 0.84 && alreadyTransparentRatio < 0.2

    // 3. When uniform solid background exists, knock out background cleanly via BFS + small enclosed holes
    let transparentUrl: string | null = null
    if (hasUniformBackground) {
      const cleanImgData = trimCtx.getImageData(0, 0, cropW, cropH)
      const px = cleanImgData.data
      const N = cropW * cropH
      const visited = new Uint8Array(N)
      const removeMask = new Uint8Array(N)
      const queue = new Int32Array(N)
      const softTol = 30
      const maxHoleArea = Math.floor(N * 0.025)

      for (let start = 0; start < N; start++) {
        if (visited[start]) continue
        const sIdx = start * 4
        if (
          px[sIdx + 3] < 128 ||
          rgbDist(bgRgb, px[sIdx], px[sIdx + 1], px[sIdx + 2]) > softTol
        ) {
          continue
        }

        let head = 0
        let tail = 0
        let touchesEdge = false
        queue[tail++] = start
        visited[start] = 1

        while (head < tail) {
          const cur = queue[head++]
          const cx = cur % cropW
          const cy = (cur - cx) / cropW
          if (cx === 0 || cx === cropW - 1 || cy === 0 || cy === cropH - 1) {
            touchesEdge = true
          }

          const neighbors = [
            cx > 0 ? cur - 1 : -1,
            cx < cropW - 1 ? cur + 1 : -1,
            cy > 0 ? cur - cropW : -1,
            cy < cropH - 1 ? cur + cropW : -1,
          ]
          for (const nb of neighbors) {
            if (nb < 0 || visited[nb]) continue
            const nIdx = nb * 4
            if (
              px[nIdx + 3] >= 32 &&
              rgbDist(bgRgb, px[nIdx], px[nIdx + 1], px[nIdx + 2]) <= softTol
            ) {
              visited[nb] = 1
              queue[tail++] = nb
            }
          }
        }

        if (touchesEdge || tail <= maxHoleArea) {
          for (let i = 0; i < tail; i++) {
            removeMask[queue[i]] = 1
          }
        }
      }

      // Apply removal + 1px anti-aliased edge feather on adjacent pixels close to bgRgb
      for (let i = 0; i < N; i++) {
        if (removeMask[i]) {
          px[i * 4 + 3] = 0
          continue
        }
        const x = i % cropW
        const y = (i - x) / cropW
        const nearRemoved =
          (x > 0 && removeMask[i - 1]) ||
          (x < cropW - 1 && removeMask[i + 1]) ||
          (y > 0 && removeMask[i - cropW]) ||
          (y < cropH - 1 && removeMask[i + cropW])
        if (nearRemoved) {
          const pIdx = i * 4
          const dist = rgbDist(bgRgb, px[pIdx], px[pIdx + 1], px[pIdx + 2])
          if (dist < 65) {
            px[pIdx + 3] = Math.round(((dist - softTol) / 35) * px[pIdx + 3])
            px[pIdx + 3] = Math.max(0, Math.min(255, px[pIdx + 3]))
          }
        }
      }

      trimCtx.putImageData(cleanImgData, 0, 0)
      transparentUrl = trimCanvas.toDataURL('image/png')
    }

    return {
      profile: {
        ...bgRgb,
        ...hsl,
        hex,
        closestColor,
        edgeUniformity,
      },
      trimmedUrl,
      transparentUrl,
      hasUniformBackground,
      trimApplied,
    }
  } catch {
    return null
  }
}
