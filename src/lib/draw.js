/** Canvas дээр зурах туслах функцууд. */

/**
 * Эх зургийг зорилтот хайрцгийг бүрэн дүүргэх (`object-fit: cover`) байдлаар
 * тайрах эх мужийг тооцоолно.
 * @param {number} srcW эх зургийн өргөн
 * @param {number} srcH эх зургийн өндөр
 * @param {number} dstW зорилтот өргөн
 * @param {number} dstH зорилтот өндөр
 * @param {number} [focus=0.5] тайралтын байрлал 0..1 (0 = эхнээс, 1 = төгсгөлөөс)
 * @returns {{sx: number, sy: number, sw: number, sh: number}}
 */
export function coverRect(srcW, srcH, dstW, dstH, focus = 0.5) {
  const srcAspect = srcW / srcH
  const dstAspect = dstW / dstH

  if (srcAspect > dstAspect) {
    // Эх зураг илүү өргөн — хажуу талыг нь тайрна.
    const sw = srcH * dstAspect
    return { sx: (srcW - sw) * focus, sy: 0, sw, sh: srcH }
  }
  // Эх зураг илүү өндөр (эсвэл ижил) — дээд доод талыг нь тайрна.
  const sh = srcW / dstAspect
  return { sx: 0, sy: (srcH - sh) * focus, sw: srcW, sh }
}

/** Одоогийн замд дугуй өнцөгт нэмнэ (beginPath дуудахгүй). */
export function roundRectSubPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** Дугуй өнцөгтэй тэгш өнцөгтийн замыг үүсгэнэ (fill/clip хийхэд бэлэн). */
export function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** Зургийг хайрцгийг бүрэн дүүргэх байдлаар (cover) зурна. */
export function drawImageCover(ctx, img, x, y, w, h, focus = 0.5) {
  const { sx, sy, sw, sh } = coverRect(img.width, img.height, w, h, focus)
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

/**
 * Босоо чиглэлийн бараан бүрхэвч — текстийг зураг дээр уншигдахуйц болгоно.
 * @param {'top'|'bottom'} from аль талаас нь харанхуйлах
 */
export function shade(ctx, x, y, w, h, from, strength = 0.85) {
  const g =
    from === 'top'
      ? ctx.createLinearGradient(0, y, 0, y + h)
      : ctx.createLinearGradient(0, y + h, 0, y)
  g.addColorStop(0, `rgba(0,0,0,${strength})`)
  g.addColorStop(0.55, `rgba(0,0,0,${strength * 0.35})`)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
}

/** Мөрний бүх хэсгийн нийт өргөн. */
export function measureLine(ctx, line) {
  return line.reduce((sum, seg) => sum + ctx.measureText(seg.text).width, 0)
}

/**
 * Мөрүүдийг блок болгон зурна. `y` нь блокийн ДЭЭД тал.
 * Мөр бүрийн доторх томоор бичсэн үсгийн өндөр нь мөрийн зайдаа голлоно.
 * @returns {number} блокийн нийт өндөр
 */
export function drawLines(ctx, lines, opts) {
  const { x, y, width, font, fontSize, lineHeight, align = 'center', color, highlightColor } = opts
  // Фонтоо өөрөө тохируулна — гаднаас юу тохируулсанаас хамаарахгүй байх нь
  // хэмжилт болон зурагдах хэмжээ зөрөх алдаанаас сэргийлнэ.
  ctx.font = font
  const step = fontSize * lineHeight
  const capAscent = ctx.measureText('Х').actualBoundingBoxAscent

  ctx.textBaseline = 'alphabetic'
  lines.forEach((line, i) => {
    const baseline = y + i * step + (step + capAscent) / 2
    const lineWidth = measureLine(ctx, line)
    let cursor = x
    if (align === 'center') cursor = x + (width - lineWidth) / 2
    else if (align === 'right') cursor = x + width - lineWidth

    for (const seg of line) {
      ctx.fillStyle = seg.highlight ? highlightColor : color
      ctx.fillText(seg.text, cursor, baseline)
      cursor += ctx.measureText(seg.text).width
    }
  })
  return lines.length * step
}

/** Дугуй өнцөгт өнгөт "шошго" (pill) зурна. Төвийг нь өгнө. */
export function drawPill(ctx, text, cx, cy, opts) {
  const { fontSize, bg, color, padX = fontSize * 1.1, height = fontSize * 2.0, font } = opts
  ctx.font = font
  const w = ctx.measureText(text).width + padX * 2
  ctx.fillStyle = bg
  roundRectPath(ctx, cx - w / 2, cy - height / 2, w, height, height / 2)
  ctx.fill()

  ctx.fillStyle = color
  ctx.textBaseline = 'alphabetic'
  const capAscent = ctx.measureText('Х').actualBoundingBoxAscent
  ctx.fillText(text, cx - ctx.measureText(text).width / 2, cy + capAscent / 2)
  return { width: w, height }
}

/**
 * Брэндийн лого — нэрийг НЭГ мөрөнд бичээд доор нь өнгөт зураас татна.
 * Өгөгдсөн өргөнд багтахгүй бол фонтын хэмжээг автоматаар багасгана.
 * @returns {number} логоны эзлэх нийт өндөр
 */
export function drawBrandMark(ctx, opts) {
  const { name, x, y, fontSize, maxWidth, color, accent, fontFamily, align = 'left' } = opts
  const text = name.trim()

  ctx.font = `700 ${fontSize}px "${fontFamily}"`
  const naturalWidth = ctx.measureText(text).width
  const size =
    maxWidth && naturalWidth > maxWidth
      ? Math.floor((fontSize * maxWidth) / naturalWidth)
      : fontSize

  ctx.font = `700 ${size}px "${fontFamily}"`
  ctx.textBaseline = 'alphabetic'
  const width = ctx.measureText(text).width
  const capAscent = ctx.measureText('Х').actualBoundingBoxAscent
  const tx = align === 'right' ? x - width : x

  ctx.fillStyle = color
  ctx.fillText(text, tx, y + capAscent)

  const barY = y + capAscent + size * 0.22
  const barH = Math.max(4, size * 0.12)
  ctx.fillStyle = accent
  ctx.fillRect(tx, barY, width, barH)

  return barY + barH - y
}

/**
 * Зөөлөн (бүдэг) дугуй өнцөгт хүрээ зурна.
 * @param {object} opts
 * @param {string} opts.color шугамын өнгө
 * @param {number} opts.width шугамын зузаан
 * @param {number} [opts.blur=0] бүдгэрүүлэлтийн радиус пикселээр; 0 бол хурц шугам
 * @param {number} [opts.opacity=1] тунгалаг байдал 0..1
 * @param {boolean} [opts.halo=false] доор нь бүдэг хар туяа нэмэх эсэх.
 *   Цайвар зураг дээр цагаан шугам алга болдгийг үүгээр шийднэ.
 * @param {string} [opts.haloColor='#000000']
 */
export function drawFrame(ctx, x, y, w, h, radius, opts) {
  const {
    color,
    width: lineWidth,
    blur = 0,
    opacity = 1,
    halo = false,
    haloColor = '#000000',
  } = opts

  const stroke = (strokeStyle, width, blurPx, alpha) => {
    ctx.save()
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = width
    ctx.globalAlpha = alpha
    if (blurPx > 0) ctx.filter = `blur(${blurPx}px)`
    roundRectPath(ctx, x, y, w, h, radius)
    ctx.stroke()
    ctx.restore()
  }

  if (halo) stroke(haloColor, lineWidth * 2.6, Math.max(blur * 1.9, 4), opacity * 0.6)
  stroke(color, lineWidth, blur, opacity)
}

/**
 * Дугуй өнцөгт мужаас ГАДНА талыг дэвсгэр өнгөөр битүүлнэ.
 * Ингэснээр бүтэн дүүрэн зураг хүрээний дотор "картан" харагдац авна.
 */
export function matteOutside(ctx, width, height, x, y, w, h, radius, color) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, width, height)
  roundRectSubPath(ctx, x, y, w, h, radius)
  ctx.fillStyle = color
  ctx.fill('evenodd')
  ctx.restore()
}
