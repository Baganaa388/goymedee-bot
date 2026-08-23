/**
 * Гарчгийн текстийг өнгөт хэсгүүдэд задлах, мөрд багтаах туслах функцууд.
 * Энэ файл canvas-аас хамааралгүй — хэмжилтийг гаднаас `measure` функцээр авна.
 */

/**
 * `*од*`-оор ороосон хэсгийг онцлолт болгож задална.
 * Хосгүй үлдсэн од энгийн тэмдэгт хэвээр үлдэнэ.
 * @param {string} text
 * @returns {{text: string, highlight: boolean}[]}
 */
export function parseHighlights(text) {
  const segments = []
  const re = /\*([^*]*)\*/g
  let plain = ''
  let last = 0
  let m

  const flushPlain = () => {
    if (plain) {
      segments.push({ text: plain, highlight: false })
      plain = ''
    }
  }

  while ((m = re.exec(text)) !== null) {
    plain += text.slice(last, m.index)
    if (m[1]) {
      flushPlain()
      segments.push({ text: m[1], highlight: true })
    }
    last = re.lastIndex
  }
  plain += text.slice(last)
  flushPlain()

  return segments.length ? segments : [{ text: '', highlight: false }]
}

/**
 * Хэсгүүдийг өгөгдсөн өргөнд багтаах мөрүүд болгож таслана.
 * Мөр бүр нь `{text, highlight}` хэсгүүдийн жагсаалт бөгөөд тэдгээрийг
 * дараалуулан бичихэд анхны мөрийн текст гарна.
 * @param {{text: string, highlight: boolean}[]} segments
 * @param {(text: string) => number} measure текстийн өргөнийг пикселээр буцаана
 * @param {number} maxWidth
 * @returns {{text: string, highlight: boolean}[][]}
 */
export function wrapSegments(segments, measure, maxWidth) {
  const words = []
  for (const seg of segments) {
    for (const word of seg.text.split(/\s+/)) {
      if (word) words.push({ word, highlight: seg.highlight })
    }
  }
  if (!words.length) return []

  const joined = (ws) => ws.map((w) => w.word).join(' ')
  const lines = []
  let current = []

  for (const w of words) {
    // Мөрөнд ганц ч үг байхгүй бол багтахгүй ч гэсэн хүчээр байрлуулна.
    if (current.length && measure(joined([...current, w])) > maxWidth) {
      lines.push(current)
      current = [w]
    } else {
      current.push(w)
    }
  }
  lines.push(current)

  return lines.map(lineToSegments)
}

/** Мөрний үгсийг онцлолтын төлвөөр нь бүлэглэж хэсгүүд болгоно. */
function lineToSegments(words) {
  const groups = []
  for (const w of words) {
    const last = groups[groups.length - 1]
    if (last && last.highlight === w.highlight) last.words.push(w.word)
    else groups.push({ highlight: w.highlight, words: [w.word] })
  }
  return groups.map((g, i) => ({
    text: g.words.join(' ') + (i < groups.length - 1 ? ' ' : ''),
    highlight: g.highlight,
  }))
}

/**
 * Гарчгийг өгөгдсөн хайрцагт багтах хамгийн том фонтын хэмжээг олно.
 * @param {object} opts
 * @param {string} opts.text `*од*` онцлолт агуулж болно
 * @param {(text: string, fontSize: number) => number} opts.measureAt
 * @param {number} opts.maxWidth
 * @param {number} opts.maxHeight
 * @param {number} opts.maxFontSize
 * @param {number} opts.minFontSize
 * @param {number} [opts.lineHeight=1.15] мөр хоорондын зай (фонтын хэмжээний харьцаа)
 * @param {number} [opts.maxLines=Infinity]
 * @returns {{fontSize: number, lines: {text: string, highlight: boolean}[][]}}
 */
export function fitText({
  text,
  measureAt,
  maxWidth,
  maxHeight,
  maxFontSize,
  minFontSize,
  lineHeight = 1.15,
  maxLines = Infinity,
}) {
  const segments = parseHighlights(text)

  const layoutAt = (fontSize) => wrapSegments(segments, (s) => measureAt(s, fontSize), maxWidth)
  const fits = (fontSize, lines) =>
    lines.length <= maxLines && lines.length * fontSize * lineHeight <= maxHeight

  for (let fontSize = Math.round(maxFontSize); fontSize > minFontSize; fontSize--) {
    const lines = layoutAt(fontSize)
    if (fits(fontSize, lines)) return { fontSize, lines }
  }
  return { fontSize: minFontSize, lines: layoutAt(minFontSize) }
}
