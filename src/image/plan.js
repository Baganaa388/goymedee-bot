/**
 * Зураг боловсруулахын өмнөх тооцоолол.
 * Энэ файл `sharp`-аас хамааралгүй — зөвхөн тоо бодно.
 */

/** Facebook пост дээр тохирох хэмжээнүүд. */
export const PRESETS = {
  '4:5': { width: 1080, height: 1350, label: '📱 4:5 — Feed (хамгийн их анхаарал татдаг)' },
  '1:1': { width: 1080, height: 1080, label: '⬜ 1:1 — Дөрвөлжин' },
  '16:9': { width: 1200, height: 675, label: '🖥 16:9 — Хэвтээ / линк' },
  '9:16': { width: 1080, height: 1920, label: '📖 9:16 — Story / Reels' },
}

/** Хэмжээний түлхүүрээс пиксел хэмжээг өгнө. */
export function presetSize(key) {
  const p = PRESETS[key]
  if (!p) {
    throw new Error(`Танихгүй хэмжээ: "${key}". Боломжит: ${Object.keys(PRESETS).join(', ')}`)
  }
  return { width: p.width, height: p.height }
}

/**
 * Чанар сайжруулах үйлдлийн параметрүүдийг тооцно.
 *
 * Жижиг зургийг томсгоход шинэ нарийвчлал бий болдоггүй тул 4 дахин
 * хэтрүүлэхгүй — түүнээс цааш зөвхөн зөөлөрч муудна.
 *
 * @param {{width: number, height: number}} meta эх зургийн хэмжээ
 * @param {object} [opts]
 * @param {number} [opts.minWidth=1080] зорилтот доод өргөн
 * @param {number} [opts.maxWidth=2160] дээд өргөн (үүнээс том бол жижигрүүлнэ)
 * @param {number} [opts.maxUpscale=4] томсголтын дээд коэффициент
 */
export function planEnhancement(meta, opts = {}) {
  const { minWidth = 1080, maxWidth = 2160, maxUpscale = 4 } = opts
  const { width, height } = meta

  let targetWidth
  let upscaled = false

  if (width > maxWidth) {
    targetWidth = maxWidth
  } else if (width < minWidth) {
    targetWidth = Math.min(minWidth, Math.round(width * maxUpscale))
    upscaled = targetWidth > width
  } else {
    targetWidth = width
  }

  const targetHeight = Math.round((height * targetWidth) / width)

  return {
    targetWidth,
    targetHeight,
    upscaled,
    resized: targetWidth !== width,
    // Томсгосон зураг зөөлөрдөг тул илүү хүчтэй хурцлана.
    sharpen: upscaled ? { sigma: 1.5, m1: 0.6, m2: 2.4 } : { sigma: 0.9, m1: 0.5, m2: 2 },
  }
}
