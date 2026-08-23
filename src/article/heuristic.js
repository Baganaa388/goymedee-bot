/**
 * Нөөц задлагч — ерөнхий алгоритм ажиллаагүй үед хэрэглэнэ.
 *
 * Ихэнх монгол мэдээний сайт `<article>` таг хэрэглэдэггүй тул стандарт
 * алгоритмууд хоосон буцаадаг (gogo.mn дээр батлагдсан). Энэ нь оронд нь
 * og: мета өгөгдөл болон утга бүхий `<p>` доголуудад тулгуурлана.
 */

const ENTITIES = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  laquo: '«',
  raquo: '»',
  mdash: '—',
  ndash: '–',
  hellip: '…',
}

/** HTML тэмдэгтийн кодыг жинхэнэ тэмдэгт болгоно. */
export function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9#]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
}

/** Таг цэвэрлэж, зайг нэгтгэнэ. */
function toText(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

/** Мета тагийн утгыг олно (property эсвэл name аль нь ч байж болно). */
function meta(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = re.exec(html)
    if (m?.[1]) return decodeEntities(m[1]).trim()
  }
  return null
}

/** `<title>`-ээс сайтын нэрийг таслаж, зөвхөн нийтлэлийн гарчгийг үлдээнэ. */
function titleFromTag(html) {
  const raw = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  if (!raw) return null
  const text = toText(raw)
  // "Сайтын нэр — Гарчиг" эсвэл "Гарчиг | Сайтын нэр" хэлбэрээс уртыг нь авна.
  const parts = text.split(/\s+[—–|]\s+/)
  return parts.length > 1 ? parts.reduce((a, b) => (b.length > a.length ? b : a)) : text
}

/**
 * HTML-ээс нийтлэлийн мэдээллийг эвристикээр гаргана.
 * @param {string} html
 * @returns {{title: string|null, image: string|null, published: string|null, text: string}}
 */
export function extractHeuristic(html) {
  // Скрипт, загвар, тайлбарыг эхлээд бүрэн хасна — эс бөгөөс код нь текст болж орно.
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')

  const paragraphs = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => toText(m[1]))
    .filter((t) => t.length > 40)

  return {
    title: meta(html, 'og:title') ?? meta(html, 'twitter:title') ?? titleFromTag(html),
    image: meta(html, 'og:image') ?? meta(html, 'twitter:image'),
    published:
      meta(html, 'article:published_time') ??
      meta(html, 'og:article:published_time') ??
      meta(html, 'publishdate') ??
      /<time[^>]+datetime=["']([^"']+)["']/i.exec(body)?.[1] ??
      null,
    text: paragraphs.join('\n\n'),
  }
}
