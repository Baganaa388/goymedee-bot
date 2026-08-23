import { extractFromHtml } from '@extractus/article-extractor'
import { extractHeuristic, decodeEntities } from './heuristic.js'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Ерөнхий алгоритмын үр дүнг хангалттай гэж үзэх доод хэмжээ. */
const MIN_USEFUL_LENGTH = 200

/**
 * Хэрэглэгчийн өгсөн хаягийг шалгана.
 * Дотоод сүлжээ рүү хандахаас сэргийлнэ (хэрэглэгч дурын хаяг өгдөг тул).
 */
export function parseUrl(input) {
  let url
  try {
    url = new URL(input.trim())
  } catch {
    throw new Error('Хаяг буруу байна. `https://...` хэлбэрээр илгээнэ үү.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Зөвхөн http болон https хаягийг дэмжинэ.')
  }
  const host = url.hostname.toLowerCase()
  const isPrivate =
    host === 'localhost' ||
    host.endsWith('.local') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === '::1' ||
    host === '0.0.0.0'
  if (isPrivate) {
    throw new Error('Дотоод сүлжээний хаяг руу хандах боломжгүй.')
  }
  return url
}

/** Хуудсын HTML-ийг татна. */
export async function fetchHtml(url, { timeout = 15000 } = {}) {
  const res = await fetch(url, {
    headers: {
      'user-agent': UA,
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'mn,en;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  })

  if (!res.ok) {
    throw new Error(`Сайт ${res.status} хариу буцаалаа. Хаяг зөв эсэхийг шалгана уу.`)
  }
  const type = res.headers.get('content-type') ?? ''
  if (!type.includes('html')) {
    throw new Error(`Энэ хаяг нийтлэл биш байна (${type.split(';')[0] || 'тодорхойгүй'}).`)
  }
  return { html: await res.text(), finalUrl: res.url || url }
}

/** HTML-ийг цэвэр текст болгоно. */
function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|br)\s*>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim()
}

/**
 * Хаягаас нийтлэлийн мэдээллийг гаргана.
 *
 * Хоёр шатлалтай: эхлээд ерөнхий алгоритм, хоосон эсвэл хэт богино байвал
 * эвристик рүү шилжинэ. Ихэнх монгол сайт `<article>` таг хэрэглэдэггүй тул
 * энэ нөөц зам заавал хэрэгтэй.
 *
 * @param {string} input хэрэглэгчийн өгсөн хаяг
 * @returns {Promise<{title, text, image, published, url, source, method, length}>}
 */
export async function extractArticle(input, { timeout = 15000 } = {}) {
  const url = parseUrl(input)
  const { html, finalUrl } = await fetchHtml(url.href, { timeout })

  let title = null
  let text = ''
  let image = null
  let published = null
  let method = 'ерөнхий'

  try {
    const a = await extractFromHtml(html, finalUrl)
    if (a) {
      title = a.title || null
      image = a.image || null
      published = a.published || null
      text = a.content ? htmlToText(a.content) : ''
    }
  } catch {
    // Ерөнхий алгоритм унасан ч эвристик рүү үргэлжилнэ.
  }

  if (text.length < MIN_USEFUL_LENGTH) {
    const h = extractHeuristic(html)
    if (h.text.length > text.length) {
      text = h.text
      method = 'эвристик'
    }
    title ??= h.title
    image ??= h.image
    published ??= h.published
  }

  if (!text) {
    throw new Error(
      'Энэ хуудаснаас текст олдсонгүй. Нийтлэлийн шууд хаяг мөн эсэхийг шалгана уу ' +
        '(нүүр хуудас эсвэл JavaScript-ээр ачаалдаг хуудас байж магадгүй).',
    )
  }

  return {
    title,
    text,
    image,
    published,
    url: finalUrl,
    source: new URL(finalUrl).hostname.replace(/^www\./, ''),
    method,
    length: text.length,
  }
}
