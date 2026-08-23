import { InputFile } from 'grammy'
import { proofread } from '../../text/proofread.js'
import { rewrite } from '../../text/rewrite.js'
import { isTextEnabled } from '../../text/llm.js'
import { chunk, MAX_MESSAGE } from '../ui.js'
import { textActionMenu, styleMenu, homeMenu } from '../menu.js'

/** Урт хариултыг мессежээр эсвэл файлаар илгээнэ. */
async function sendLong(ctx, title, body, keyboard, filename) {
  const parts = chunk(`${title}\n\n${body}`)

  if (parts.length > 3) {
    // Хэт урт бол мессеж үерлүүлэхийн оронд файл болгоно.
    await ctx.replyWithDocument(new InputFile(Buffer.from(body, 'utf8'), filename), {
      caption: `${title}\n\n_Урт тул файлаар илгээв._`,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })
    return
  }

  for (let i = 0; i < parts.length; i++) {
    const last = i === parts.length - 1
    await ctx.reply(parts[i], last ? { reply_markup: keyboard } : {})
  }
}

/** Түлхүүр тохируулаагүй үед тайлбарлана. */
export async function textDisabled(ctx) {
  await ctx.reply(
    [
      '🔑 *Текст засах функц идэвхгүй байна*',
      '',
      'Энэ хэсэг хиймэл оюуны загвар ашигладаг тул API түлхүүр шаардлагатай.',
      '',
      '`.env` файлд дараахын аль нэгийг нэмнэ үү:',
      '`ANTHROPIC_API_KEY=...`',
      '`OPENAI_API_KEY=...`',
      '',
      '_Бусад бүх үйлдэл хэвийн ажиллана._',
    ].join('\n'),
    { parse_mode: 'Markdown', reply_markup: homeMenu() },
  )
}

/** 🔤 Үг үсгийн алдаа засах */
export async function runProofread(ctx, state) {
  if (!isTextEnabled()) return textDisabled(ctx)

  const text = state.data.text
  if (!text) throw new Error('Эхлээд текстээ илгээнэ үү.')

  await ctx.replyWithChatAction('typing')
  const r = await proofread(text)

  const header = r.changes.length
    ? `🔤 *${r.changes.length} алдаа зассан*`
    : '🔤 *Алдаа олдсонгүй* — текст цэвэр байна.'

  await sendLong(ctx, header, r.corrected, textActionMenu(), 'зассан.txt')

  if (r.changes.length) {
    const list = r.changes
      .slice(0, 25)
      .map((c, i) => `${i + 1}. «${c.from}» → «${c.to}»${c.why ? `\n   _${c.why}_` : ''}`)
      .join('\n')
    const more = r.changes.length > 25 ? `\n\n_…бас ${r.changes.length - 25} өөрчлөлт_` : ''
    const body = `*Өөрчлөлтүүд:*\n${list}${more}`
    await ctx.reply(body.slice(0, MAX_MESSAGE), { parse_mode: 'Markdown' })
  }
}

/** 📝 Найруулга — хэв маяг сонгох */
export async function askStyle(ctx) {
  if (!isTextEnabled()) return textDisabled(ctx)
  await ctx.reply('📝 *Ямар байдлаар сайжруулах вэ?*', {
    parse_mode: 'Markdown',
    reply_markup: styleMenu(),
  })
}

/** 📝 Найруулга сайжруулах */
export async function runRewrite(ctx, state, styleKey) {
  if (!isTextEnabled()) return textDisabled(ctx)

  const text = state.data.text
  if (!text) throw new Error('Эхлээд текстээ илгээнэ үү.')

  await ctx.replyWithChatAction('typing')
  const r = await rewrite(text, styleKey)

  await sendLong(ctx, `📝 *${r.style}*`, r.rewritten, textActionMenu(), 'найруулсан.txt')

  if (r.notes.length) {
    await ctx.reply(`*Тэмдэглэл:*\n${r.notes.map((n) => `• ${n}`).join('\n')}`.slice(0, MAX_MESSAGE), {
      parse_mode: 'Markdown',
    })
  }
}
