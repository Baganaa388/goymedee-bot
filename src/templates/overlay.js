import {
  drawImageCover,
  shade,
  drawLines,
  drawPill,
  drawBrandMark,
  drawFrame,
  matteOutside,
} from '../lib/draw.js'
import { drawTagline, layoutTitle } from './_shared.js'

export const label = 'Бүрхэвч — зураг бүтэн, доор gradient дээр гарчиг'

export function draw(ctx, { img, title, cfg, width, height, focus }) {
  const { colors, brand, fonts } = cfg

  drawImageCover(ctx, img, 0, 0, width, height, focus)
  shade(ctx, 0, 0, width, height * 0.28, 'top', 0.75)

  // Доод хэсгийн бараан бүрхэвч — гарчиг уншигдахуйц болгоно.
  const g = ctx.createLinearGradient(0, height, 0, height * 0.32)
  g.addColorStop(0, 'rgba(6,7,10,0.97)')
  g.addColorStop(0.5, 'rgba(6,7,10,0.94)')
  g.addColorStop(1, 'rgba(6,7,10,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, height * 0.3, width, height * 0.7)

  const margin = Math.round(width * 0.072)

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

  // --- гарчиг (доод талд зүүн зэрэгцүүлсэн) ---
  const maxWidth = width - margin * 2
  const { fontSize, lines } = layoutTitle(ctx, title, {
    fontFamily: fonts.display,
    maxWidth,
    maxHeight: height * 0.36,
    max: Math.round(width * 0.088),
    min: Math.round(width * 0.034),
    lineHeight: 1.06,
    maxLines: 4,
  })
  const blockH = lines.length * fontSize * 1.06
  const bottomRule = height - height * 0.052
  const titleTop = bottomRule - height * 0.03 - blockH

  // --- шошго гарчгийн дээр ---
  const badgeSize = Math.round(width * 0.03)
  const badge = drawPill(ctx, brand.badge, 0, 0, {
    fontSize: badgeSize,
    bg: 'rgba(0,0,0,0)',
    color: 'rgba(0,0,0,0)',
    font: `700 ${badgeSize}px "${fonts.display}"`,
  })
  drawPill(ctx, brand.badge, margin + badge.width / 2, titleTop - height * 0.032, {
    fontSize: badgeSize,
    bg: colors.accent,
    color: colors.text,
    font: `700 ${badgeSize}px "${fonts.display}"`,
  })

  drawLines(ctx, lines, {
    font: `700 ${fontSize}px "${fonts.display}"`,
    x: margin,
    y: titleTop,
    width: maxWidth,
    fontSize,
    lineHeight: 1.06,
    align: 'left',
    color: colors.text,
    highlightColor: colors.accent,
  })

  ctx.fillStyle = colors.accent
  ctx.fillRect(margin, bottomRule, width * 0.11, 5)

  // --- хүрээ ---
  if (cfg.frame?.enabled) {
    const m = Math.round(width * 0.03)
    const r = Math.round(width * 0.03)
    matteOutside(ctx, width, height, m, m, width - m * 2, height - m * 2, r, colors.background)
    const f = m + (cfg.frame.inset ?? 0)
    drawFrame(ctx, f, f, width - f * 2, height - f * 2, Math.max(4, r - (f - m) * 0.7), cfg.frame)
  }
}
