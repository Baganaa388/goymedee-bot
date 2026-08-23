import {
  roundRectPath,
  drawImageCover,
  shade,
  drawLines,
  drawBrandMark,
  drawFrame,
  matteOutside,
} from '../lib/draw.js'
import { drawTagline, layoutTitle } from './_shared.js'

export const label = 'Карт — зураг бүтэн, доор өнгөт баганатай хайрцаг'

export function draw(ctx, { img, title, cfg, width, height, focus }) {
  const { colors, brand, fonts } = cfg

  drawImageCover(ctx, img, 0, 0, width, height, focus)
  shade(ctx, 0, 0, width, height * 0.26, 'top', 0.7)
  shade(ctx, 0, height * 0.5, width, height * 0.5, 'bottom', 0.72)

  const margin = Math.round(width * 0.058)

  drawBrandMark(ctx, {
    name: brand.name,
    x: margin,
    y: height * 0.075,
    fontSize: Math.round(width * 0.058),
    maxWidth: width * 0.46,
    color: colors.text,
    accent: colors.accent,
    fontFamily: fonts.display,
  })
  drawTagline(ctx, {
    tagline: brand.tagline,
    x: width - margin,
    y: height * 0.082,
    fontSize: Math.round(width * 0.023),
    color: colors.muted,
    accent: colors.accent,
    fontFamily: fonts.body,
  })

  // --- гарчгийн хайрцаг ---
  const barW = Math.round(width * 0.016)
  const cardPad = Math.round(width * 0.045)
  const cardW = width - margin * 2
  const textW = cardW - barW - cardPad * 2

  const { fontSize, lines } = layoutTitle(ctx, title, {
    fontFamily: fonts.display,
    maxWidth: textW,
    maxHeight: height * 0.3,
    max: Math.round(width * 0.072),
    min: Math.round(width * 0.03),
    lineHeight: 1.08,
    maxLines: 4,
  })
  const badgeSize = Math.round(width * 0.026)
  const headOffset = badgeSize * 2.2
  const textH = lines.length * fontSize * 1.08
  const cardH = cardPad * 2 + headOffset + textH
  const cardY = height - margin - cardH
  const radius = Math.round(width * 0.022)

  ctx.save()
  roundRectPath(ctx, margin, cardY, cardW, cardH, radius)
  ctx.clip()
  ctx.fillStyle = 'rgba(9,10,14,0.88)'
  ctx.fillRect(margin, cardY, cardW, cardH)
  ctx.fillStyle = colors.accent
  ctx.fillRect(margin, cardY, barW, cardH)
  ctx.restore()

  // --- хайрцаг доторх шошго ба гарчиг ---
  ctx.font = `700 ${badgeSize}px "${fonts.display}"`
  ctx.textBaseline = 'alphabetic'
  const badgeAscent = ctx.measureText('Х').actualBoundingBoxAscent
  ctx.fillStyle = colors.accent
  ctx.fillText(brand.badge, margin + barW + cardPad, cardY + cardPad + badgeAscent)

  drawLines(ctx, lines, {
    font: `700 ${fontSize}px "${fonts.display}"`,
    x: margin + barW + cardPad,
    y: cardY + cardPad + headOffset,
    width: textW,
    fontSize,
    lineHeight: 1.08,
    align: 'left',
    color: colors.text,
    highlightColor: colors.accent,
  })

  // --- хүрээ ---
  if (cfg.frame?.enabled) {
    const m = Math.round(width * 0.03)
    const r = Math.round(width * 0.03)
    matteOutside(ctx, width, height, m, m, width - m * 2, height - m * 2, r, colors.background)
    const f = m + (cfg.frame.inset ?? 0)
    drawFrame(ctx, f, f, width - f * 2, height - f * 2, Math.max(4, r - (f - m) * 0.7), cfg.frame)
  }
}
