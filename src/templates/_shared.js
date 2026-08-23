import { fitText } from '../lib/text.js'

/** Баруун дээд буланд байрлах жижиг уриа + өнгөт багана. */
export function drawTagline(ctx, { tagline, x, y, fontSize, color, accent, fontFamily }) {
  if (!tagline) return
  const lines = String(tagline).split('\n')
  const step = fontSize * 1.35
  ctx.font = `600 ${fontSize}px "${fontFamily}"`
  ctx.textBaseline = 'alphabetic'
  const capAscent = ctx.measureText('Х').actualBoundingBoxAscent
  const barW = Math.max(5, fontSize * 0.28)
  const gap = fontSize * 0.7

  ctx.fillStyle = color
  lines.forEach((line, i) => {
    const w = ctx.measureText(line).width
    ctx.fillText(line, x - barW - gap - w, y + i * step + capAscent)
  })

  ctx.fillStyle = accent
  ctx.fillRect(x - barW, y, barW, lines.length * step - fontSize * 0.35)
}

/** Гарчгийг өгөгдсөн хайрцагт багтаах хэмжээг сонгоно. */
export function layoutTitle(ctx, title, { fontFamily, maxWidth, maxHeight, max, min, lineHeight, maxLines }) {
  return fitText({
    text: title,
    measureAt: (t, size) => {
      ctx.font = `700 ${size}px "${fontFamily}"`
      return ctx.measureText(t).width
    },
    maxWidth,
    maxHeight,
    maxFontSize: max,
    minFontSize: min,
    lineHeight,
    maxLines,
  })
}
