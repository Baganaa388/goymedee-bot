import sharp from 'sharp'
import { planEnhancement } from './plan.js'

/**
 * Зургийн чанарыг сайжруулна.
 *
 * Дараалал: томсгох/жижигрүүлэх (Lanczos3) → хурцлах (unsharp mask)
 * → автомат тодрол → өнгө бага зэрэг тодруулах → чанартай JPEG.
 *
 * @param {Buffer} input
 * @param {object} [opts] `planEnhancement`-д дамжина
 * @returns {Promise<{buffer: Buffer, before: object, after: object, plan: object}>}
 */
export async function enhanceImage(input, opts = {}) {
  const meta = await sharp(input).metadata()
  if (!meta.width || !meta.height) {
    throw new Error('Зургийн хэмжээг тодорхойлж чадсангүй. Файл гэмтсэн байж магадгүй.')
  }

  const plan = planEnhancement(meta, opts)

  let pipeline = sharp(input).rotate() // EXIF эргэлтийг зөв болгоно

  if (plan.resized) {
    pipeline = pipeline.resize(plan.targetWidth, plan.targetHeight, {
      kernel: 'lanczos3',
      fit: 'fill',
    })
  }

  const buffer = await pipeline
    .sharpen(plan.sharpen)
    // Контрастыг автоматаар сунгана. Хэт захын пикселийг тооцохгүй байснаар
    // ганц цайвар/бараан толбоноос болж зураг бүхэлдээ гажихаас сэргийлнэ.
    .normalise({ lower: 1, upper: 99 })
    .modulate({ saturation: 1.06 })
    .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer()

  const after = await sharp(buffer).metadata()

  return {
    buffer,
    before: { width: meta.width, height: meta.height, bytes: input.length, format: meta.format },
    after: { width: after.width, height: after.height, bytes: buffer.length, format: 'jpeg' },
    plan,
  }
}
