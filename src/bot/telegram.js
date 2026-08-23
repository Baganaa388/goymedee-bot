import { humanBytes } from './ui.js'

/** Telegram-аас татах файлын дээд хэмжээ (Bot API-ийн хязгаар). */
export const MAX_DOWNLOAD = 20 * 1024 * 1024

/**
 * Мессежээс зургийн файлыг олно.
 *
 * Telegram зургийг хоёр янзаар илгээдэг:
 * - `photo`    — шахагдсан (чанар алдагдана)
 * - `document` — шахагдаагүй (эх чанараараа)
 *
 * @returns {{fileId: string, width: number|null, height: number|null, compressed: boolean, bytes: number|null}|null}
 */
export function findPhoto(message) {
  if (message?.photo?.length) {
    // Хамгийн том хувилбарыг сонгоно — жагсаалт нь өсөх дарааллаар ирдэг.
    const best = message.photo[message.photo.length - 1]
    return {
      fileId: best.file_id,
      width: best.width ?? null,
      height: best.height ?? null,
      compressed: true,
      bytes: best.file_size ?? null,
    }
  }

  const doc = message?.document
  if (doc && /^image\/(jpeg|png|webp|jpg)$/i.test(doc.mime_type ?? '')) {
    return {
      fileId: doc.file_id,
      width: null,
      height: null,
      compressed: false,
      bytes: doc.file_size ?? null,
    }
  }
  return null
}

/**
 * Telegram-аас файлыг татаж авна.
 * @returns {Promise<Buffer>}
 */
export async function downloadFile(ctx, fileId, { timeout = 60000 } = {}) {
  const file = await ctx.api.getFile(fileId)

  if (file.file_size && file.file_size > MAX_DOWNLOAD) {
    throw new Error(
      `Файл хэт том байна (${humanBytes(file.file_size)}). ` +
        `Дээд хэмжээ ${humanBytes(MAX_DOWNLOAD)}.`,
    )
  }
  if (!file.file_path) {
    throw new Error('Файлыг татаж чадсангүй. Дахин илгээнэ үү.')
  }

  const url = `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout) })
  if (!res.ok) {
    throw new Error('Файлыг татаж чадсангүй. Дахин илгээнэ үү.')
  }
  return Buffer.from(await res.arrayBuffer())
}
