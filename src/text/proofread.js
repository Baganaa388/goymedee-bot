import { complete, parseJsonReply } from './llm.js'

const SYSTEM = `Чи бол монгол хэлний мэргэжлийн хянан тохиолдуулагч (корректор).

Даалгавар: өгөгдсөн текстийн ҮГ ҮСГИЙН болон ЦЭГ ТАСЛАЛЫН алдааг зас.

Дүрэм:
- Зөвхөн алдаа зас. Найруулга, өгүүлбэрийн бүтэц, үгийн сонголтыг ӨӨРЧЛӨХГҮЙ.
- Утга агуулгыг огт бүү өөрчил. Шинэ мэдээлэл бүү нэм, байгааг нь бүү хас.
- Монгол кирилл бичгийн дүрэм баримтал: үсгийн уртын зөрүү (үү/уу, өө/оо),
  зайлшгүй н/ н-гүй, ь болон й-ийн ялгаа, дагавар залгавар.
- Догол мөрийн бүтцийг яг хэвээр нь хадгал.
- Нэр томьёо, хүний нэр, газрын нэрийг өөрчлөхгүй.

Хариултаа ЗӨВХӨН дараах JSON хэлбэрээр буцаа, өөр текст бүү нэм:
{
  "corrected": "засварласан бүтэн текст",
  "changes": [
    { "from": "алдаатай хэсэг", "to": "зассан хэсэг", "why": "богино шалтгаан" }
  ]
}

Алдаа олдоогүй бол "changes" нь хоосон жагсаалт байна.`

/**
 * Текстийн үг үсэг, цэг таслалын алдааг засна.
 * @param {string} text
 * @returns {Promise<{corrected: string, changes: {from: string, to: string, why: string}[]}>}
 */
export async function proofread(text) {
  const input = String(text ?? '').trim()
  if (!input) throw new Error('Шалгах текст хоосон байна.')

  const reply = await complete({ system: SYSTEM, user: input })
  const json = parseJsonReply(reply)

  // Загвар JSON биш хариу өгвөл түүнийг засварласан текст гэж үзнэ —
  // хэрэглэгч хоосон хариу авахаас дээр.
  if (!json || typeof json.corrected !== 'string') {
    return { corrected: reply || input, changes: [] }
  }

  return {
    corrected: json.corrected,
    changes: Array.isArray(json.changes)
      ? json.changes.filter((c) => c && typeof c.from === 'string' && typeof c.to === 'string')
      : [],
  }
}
