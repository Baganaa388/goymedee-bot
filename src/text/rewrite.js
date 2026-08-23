import { complete, parseJsonReply } from './llm.js'

/** Найруулгын хэв маягууд — bot дээр товчлуур болж харагдана. */
export const STYLES = {
  news: {
    label: '📰 Мэдээний хэв маяг',
    instruction:
      'Мэдээний албан ёсны хэв маягт оруул. Гол мэдээллийг эхэнд байрлуул, ' +
      'богино тодорхой өгүүлбэр ашигла, сэтгэл хөдлөлийн үг хэрэглэхгүй.',
  },
  short: {
    label: '✂️ Товчлох',
    instruction:
      'Гол утгыг алдагдуулалгүйгээр 40-50 хувиар товчил. Давхардсан санаа, ' +
      'илүүц тодотголыг хас.',
  },
  detailed: {
    label: '📖 Дэлгэрүүлэх',
    instruction:
      'Өгүүлбэрүүдийг тэлж, шилжилтийг жигд болго, уншихад хялбар урсгалтай ' +
      'болго. ШИНЭ БАРИМТ БҮҮ ЗОХИО — зөвхөн байгаа мэдээллийг тайлбарла.',
  },
}

const system = (style) => `Чи бол монгол хэлний мэргэжлийн редактор.

Даалгавар: өгөгдсөн текстийн НАЙРУУЛГЫГ сайжруул.
${style.instruction}

Дүрэм:
- Баримт, тоо, нэр, огноог огт бүү өөрчил.
- Байхгүй мэдээллийг бүү зохио.
- Монгол хэлний бичгийн дүрмийг чанд баримтал.
- Догол мөрөөр тусгаарлаж, уншихад тохиромжтой бүтэцтэй болго.

Хариултаа ЗӨВХӨН дараах JSON хэлбэрээр буцаа, өөр текст бүү нэм:
{
  "rewritten": "сайжруулсан бүтэн текст",
  "notes": ["юуг яагаад өөрчилснийг тайлбарласан 1-3 богино өгүүлбэр"]
}`

/**
 * Текстийн найруулгыг сайжруулна.
 * @param {string} text
 * @param {keyof typeof STYLES} [styleKey='news']
 * @returns {Promise<{rewritten: string, notes: string[], style: string}>}
 */
export async function rewrite(text, styleKey = 'news') {
  const input = String(text ?? '').trim()
  if (!input) throw new Error('Засах текст хоосон байна.')

  const style = STYLES[styleKey]
  if (!style) {
    throw new Error(`Танихгүй хэв маяг: "${styleKey}". Боломжит: ${Object.keys(STYLES).join(', ')}`)
  }

  const reply = await complete({ system: system(style), user: input })
  const json = parseJsonReply(reply)

  if (!json || typeof json.rewritten !== 'string') {
    return { rewritten: reply || input, notes: [], style: style.label }
  }

  return {
    rewritten: json.rewritten,
    notes: Array.isArray(json.notes) ? json.notes.filter((n) => typeof n === 'string') : [],
    style: style.label,
  }
}
