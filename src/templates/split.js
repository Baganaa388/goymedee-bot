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

export const label = 'Хуваалт — дээр зураг, доор цул блок дээр гарчиг'

export function draw(ctx, { img, title, cfg, width, height, focus }) {
  const { colors, brand, fonts } = cfg

  const imgH = Math.round(height * 0.6)
  drawImageCover(ctx, img, 0, 0, width, imgH, focus)
  // Цайвар зураг дээр лого, уриа уншигдахуйц байхын тулд дээд талыг харанхуйлна.
  shade(ctx, 0, 0, width, imgH * 0.36, 'top', 0.86)

  ctx.fillStyle = colors.background
  ctx.fillRect(0, imgH, width, height - imgH)
  ctx.fillStyle = colors.accent
  ctx.fillRect(0, imgH, width, Math.max(6, height * 0.006))

  const margin = Math.round(width * 0.072)

  // --- лого зургийн дээд талд ---
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

  // --- шошго блокийн дээд талд ---
  const badgeSize = Math.round(width * 0.03)
  const badge = drawPill(ctx, brand.badge, 0, 0, {
    fontSize: badgeSize,
    bg: 'rgba(0,0,0,0)',
    color: 'rgba(0,0,0,0)',
    font: `700 ${badgeSize}px "${fonts.display}"`,
  })
  const badgeCY = imgH + height * 0.055
  drawPill(ctx, brand.badge, margin + badge.width / 2, badgeCY, {
    fontSize: badgeSize,
    bg: colors.accent,
    color: colors.text,
    font: `700 ${badgeSize}px "${fonts.display}"`,
  })

  // --- гарчиг ---
  const blockTop = badgeCY + badgeSize * 1.9
  const blockBottom = height - height * 0.055
  const maxWidth = width - margin * 2
  const { fontSize, lines } = layoutTitle(ctx, title, {
    fontFamily: fonts.display,
    maxWidth,
    maxHeight: blockBottom - blockTop,
    max: Math.round(width * 0.078),
    min: Math.round(width * 0.03),
    lineHeight: 1.08,
    maxLines: 4,
  })
  drawLines(ctx, lines, {
    font: `700 ${fontSize}px "${fonts.display}"`,
    x: margin,
    y: blockTop,
    width: maxWidth,
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
