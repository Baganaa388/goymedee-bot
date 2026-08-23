import {
  roundRectPath,
  drawImageCover,
  shade,
  drawLines,
  drawPill,
  drawBrandMark,
  drawFrame,
} from '../lib/draw.js'
import { drawTagline, layoutTitle } from './_shared.js'

export const label = 'Сонгодог — хар хүрээ, доор гарчиг'

export function draw(ctx, { img, title, cfg, width, height, focus }) {
  const { colors, brand, fonts } = cfg

  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, width, height)

  const pad = Math.round(width * 0.028)
  const radius = Math.round(width * 0.034)
  const imgW = width - pad * 2
  const imgH = Math.round(height * 0.665)
  const imgY = pad

  // --- зураг ---
  ctx.save()
  roundRectPath(ctx, pad, imgY, imgW, imgH, radius)
  ctx.clip()
  drawImageCover(ctx, img, pad, imgY, imgW, imgH, focus)
  shade(ctx, pad, imgY, imgW, imgH * 0.3, 'top', 0.72)
  shade(ctx, pad, imgY + imgH * 0.6, imgW, imgH * 0.4, 'bottom', 0.92)
  ctx.restore()
  if (cfg.frame?.enabled) {
    const f = cfg.frame.inset ?? 0
    drawFrame(ctx, pad + f, imgY + f, imgW - f * 2, imgH - f * 2, Math.max(4, radius - f * 0.7), cfg.frame)
  }

  // --- лого ба уриа ---
  const logoSize = Math.round(width * 0.058)
  drawBrandMark(ctx, {
    name: brand.name,
    x: pad + width * 0.038,
    y: imgY + height * 0.052,
    fontSize: logoSize,
    maxWidth: imgW * 0.46,
    color: colors.text,
    accent: colors.accent,
    fontFamily: fonts.display,
  })
  drawTagline(ctx, {
    tagline: brand.tagline,
    x: pad + imgW - width * 0.038,
    y: imgY + height * 0.059,
    fontSize: Math.round(width * 0.023),
    color: colors.muted,
    accent: colors.accent,
    fontFamily: fonts.body,
  })

  // --- шошго (зургийн доод ирмэг дээр) ---
  const badgeSize = Math.round(width * 0.031)
  const badgeCY = imgY + imgH - badgeSize * 1.9
  drawPill(ctx, brand.badge, width / 2, badgeCY, {
    fontSize: badgeSize,
    bg: colors.accent,
    color: colors.text,
    font: `700 ${badgeSize}px "${fonts.display}"`,
  })

  // --- гарчиг ---
  const blockTop = imgY + imgH + height * 0.035
  const blockBottom = height - height * 0.055
  const { fontSize, lines } = layoutTitle(ctx, title, {
    fontFamily: fonts.display,
    maxWidth: imgW - width * 0.055,
    maxHeight: blockBottom - blockTop,
    max: Math.round(width * 0.082),
    min: Math.round(width * 0.032),
    lineHeight: 1.1,
    maxLines: 4,
  })
  const blockH = lines.length * fontSize * 1.1
  drawLines(ctx, lines, {
    font: `700 ${fontSize}px "${fonts.display}"`,
    x: pad,
    y: blockTop + (blockBottom - blockTop - blockH) / 2,
    width: imgW,
    fontSize,
    lineHeight: 1.1,
    align: 'center',
    color: colors.text,
    highlightColor: colors.accent,
  })

  // --- доод зураас ---
  const lineW = width * 0.16
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.fillRect((width - lineW) / 2, height - height * 0.022, lineW, 4)
}
