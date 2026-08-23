import sharp from 'sharp'
import { presetSize } from './plan.js'

/**
 * Зургийг Facebook-ийн хэмжээнд оруулна.
 *
 * - `crop`   — хайрцгийг бүрэн дүүргэж, илүү хэсгийг тайрна (хамгийн цэвэрхэн)
 * - `blur`   — зургийг бүтнээр нь үлдээж, хажуугийн хоосон зайг тухайн
 *              зургийн бүдгэрүүлсэн хувилбараар дүүргэнэ (юу ч алдагдахгүй)
 *
 * @param {Buffer} input
 * @param {string} preset '4:5' | '1:1' | '16:9' | '9:16'
 * @param {'crop'|'blur'} [mode='crop']
 * @param {number} [focus=0.5] `crop` үед тайралтын байрлал 0..1
 * @returns {Promise<{buffer: Buffer, width: number, height: number}>}
 */
export async function resizeForPost(input, preset, mode = 'crop', focus = 0.5) {
  const { width, height } = presetSize(preset)
  const base = sharp(input).rotate()

  if (mode === 'crop') {
    const buffer = await base
      .resize(width, height, {
        fit: 'cover',
        position: focusToPosition(focus, width / height),
        kernel: 'lanczos3',
      })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer()
    return { buffer, width, height }
  }

  if (mode === 'blur') {
    // Дэвсгэр: зургийг хайрцаг дүүргэж тайраад хүчтэй бүдгэрүүлнэ.
    const background = await sharp(input)
      .rotate()
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .blur(28)
      .modulate({ brightness: 0.75 })
      .toBuffer()

    // Гол зураг: бүтнээр нь хайрцагт багтаана.
    const foreground = await sharp(input)
      .rotate()
      .resize(width, height, { fit: 'inside', kernel: 'lanczos3' })
      .toBuffer()

    const buffer = await sharp(background)
      .composite([{ input: foreground, gravity: 'centre' }])
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer()
    return { buffer, width, height }
  }

  throw new Error(`Танихгүй горим: "${mode}". Боломжит: crop, blur`)
}

/** 0..1 фокусыг sharp-ийн байрлалын нэр болгоно. */
function focusToPosition(focus, targetAspect) {
  if (focus <= 0.25) return targetAspect < 1 ? 'top' : 'left'
  if (focus >= 0.75) return targetAspect < 1 ? 'bottom' : 'right'
  return 'centre'
}
