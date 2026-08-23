/** Мессеж бэлтгэх туслахууд. */

/** Telegram нэг мессежид зөвшөөрөх дээд хэмжээ. */
export const MAX_MESSAGE = 4096

/** MarkdownV2-д тусгай утгатай тэмдэгтүүдийг хамгаална. */
export function escapeMd(text) {
  return String(text ?? '').replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&')
}

/**
 * Урт текстийг Telegram-д багтах хэсгүүдэд хуваана.
 * Догол мөр, дараа нь өгүүлбэрийн заагийг эрхэмлэж таслана.
 * @returns {string[]}
 */
export function chunk(text, limit = MAX_MESSAGE - 100) {
  const s = String(text ?? '')
  if (s.length <= limit) return s ? [s] : []

  const parts = []
  let rest = s

  while (rest.length > limit) {
    const window = rest.slice(0, limit)
    let cut = window.lastIndexOf('\n\n')
    if (cut < limit * 0.5) cut = window.lastIndexOf('\n')
    if (cut < limit * 0.5) cut = window.lastIndexOf('. ') + 1
    if (cut < limit * 0.5) cut = window.lastIndexOf(' ')
    if (cut <= 0) cut = limit

    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

/** Байтыг хүнд ойлгомжтой бичих. */
export function humanBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Алдааг хэрэглэгчид ойлгомжтой мессеж болгоно.
 * Дотоод техникийн дэлгэрэнгүйг гаргахгүй — зөвхөн бидний өөрсдөө бичсэн,
 * ойлгомжтой мессежийг дамжуулна.
 */
export function friendlyError(error) {
  const message = String(error?.message ?? '')

  if (error?.name === 'TimeoutError' || /timeout|aborted/i.test(message)) {
    return '⏱ Хугацаа хэтэрлээ. Дахин оролдоно уу, эсвэл жижиг файл илгээнэ үү.'
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|EAI_AGAIN/i.test(message)) {
    return '🌐 Сүлжээнд холбогдож чадсангүй. Хаяг зөв эсэхийг шалгаад дахин оролдоно уу.'
  }
  if (/rate.?limit|429/i.test(message)) {
    return '🚦 Хэт олон хүсэлт илгээгдлээ. Хэсэг хүлээгээд дахин оролдоно уу.'
  }
  if (/api key|authentication|401|403/i.test(message)) {
    return '🔑 API түлхүүр буруу эсвэл хүчингүй байна. Тохиргоог шалгана уу.'
  }
  // Өөрсдийн бичсэн монгол мессежийг шууд дамжуулна.
  if (/[Ѐ-ӿ]/.test(message)) return `⚠️ ${message}`

  return '⚠️ Алдаа гарлаа. Дахин оролдоно уу.'
}

/** Огноог уншихад ойлгомжтой болгоно. */
export function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
