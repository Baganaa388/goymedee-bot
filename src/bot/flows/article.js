import { InputFile } from 'grammy'
import { extractArticle } from '../../article/extract.js'
import { formatDate } from '../ui.js'
import { articleResultMenu } from '../menu.js'

/** Нийтлэлийг мессежээр илгээхээс өмнө урьдчилан харуулах хэмжээ. */
const PREVIEW = 900

/** 🔗 Линкээс нийтлэл хуулах */
export async function runArticle(ctx, url) {
  await ctx.replyWithChatAction('typing')
  const a = await extractArticle(url)

  const meta = [
    a.title ? `*${a.title}*` : null,
    [a.source, formatDate(a.published)].filter(Boolean).join(' · '),
    `${a.length.toLocaleString('mn-MN')} тэмдэгт`,
  ]
    .filter(Boolean)
    .join('\n')

  const full = a.title ? `${a.title}\n\n${a.text}` : a.text

  if (full.length <= PREVIEW * 2) {
    await ctx.reply(`${meta}\n\n${a.text}`, { parse_mode: 'Markdown' })
  } else {
    // Урт нийтлэлийг файлаар илгээж, эхний хэсгийг урьдчилан харуулна.
    await ctx.reply(`${meta}\n\n${a.text.slice(0, PREVIEW)}…`, { parse_mode: 'Markdown' })
    await ctx.replyWithDocument(
      new InputFile(Buffer.from(full, 'utf8'), `${a.source}-нийтлэл.txt`),
      { caption: '📄 Бүтэн эх бичвэр' },
    )
  }

  if (a.image) {
    await ctx
      .replyWithPhoto(a.image, { caption: '🖼 Нийтлэлийн зураг — branding хийхэд ашиглаж болно' })
      .catch(() => {}) // зураг татагдахгүй байж болно — нийтлэл гарсан тул саад биш
  }

  await ctx.reply('Дараа нь юу хийх вэ?', { reply_markup: articleResultMenu() })

  // Текстийг сессэд үлдээснээр шууд үг үсэг/найруулга руу шилжих боломжтой.
  return a.text
}
