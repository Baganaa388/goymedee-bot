import { InputFile } from 'grammy'
import { enhanceImage } from '../../image/enhance.js'
import { resizeForPost } from '../../image/resize.js'
import { renderPost, templateNames } from '../../render.js'
import { downloadFile } from '../telegram.js'
import { humanBytes } from '../ui.js'
import { imageActionMenu, sizeMenu, fitMenu, templateMenu } from '../menu.js'

/** Зурган дээр ажиллах бүх урсгал зургаа сессээс авна. */
async function photoBuffer(ctx, state) {
  const fileId = state.data.photo?.fileId
  if (!fileId) throw new Error('Эхлээд зургаа илгээнэ үү.')
  return downloadFile(ctx, fileId)
}

/** ✨ Чанар сайжруулах */
export async function runEnhance(ctx, state) {
  await ctx.replyWithChatAction('upload_photo')
  const input = await photoBuffer(ctx, state)
  const r = await enhanceImage(input)

  const grew = r.after.width > r.before.width
  const caption = [
    '✨ *Чанар сайжруулав*',
    '',
    `Өмнө: ${r.before.width}×${r.before.height} · ${humanBytes(r.before.bytes)}`,
    `Дараа: ${r.after.width}×${r.after.height} · ${humanBytes(r.after.bytes)}`,
    grew ? `\n_${(r.after.width / r.before.width).toFixed(1)}× томсгож, хурцлав_` : '',
    r.before.width < 1080
      ? '\n⚠️ Эх зураг жижиг байсан тул нарийвчлал хязгаарлагдмал. 1080px-ээс дээш зураг илүү сайн үр дүн өгнө.'
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  // Document-оор илгээнэ — Telegram дахин шахаж чанарыг бууруулахаас сэргийлнэ.
  await ctx.replyWithDocument(new InputFile(r.buffer, 'сайжруулсан.jpg'), {
    caption,
    parse_mode: 'Markdown',
    reply_markup: imageActionMenu(),
  })
}

/** 📐 Хэмжээ — алхам 1: хэмжээ сонгох */
export async function askSize(ctx) {
  await ctx.reply('📐 *Ямар хэмжээтэй болгох вэ?*', {
    parse_mode: 'Markdown',
    reply_markup: sizeMenu(),
  })
}

/** 📐 Хэмжээ — алхам 2: горим сонгох */
export async function askFit(ctx, preset) {
  await ctx.reply(
    [
      `📐 *${preset}* — зургийг хэрхэн багтаах вэ?`,
      '',
      '✂️ *Тайрах* — хайрцгийг бүрэн дүүргэнэ, ирмэг тайрагдана',
      '🖼 *Бүтнээр* — юу ч тайрагдахгүй, хажуугийн зайг бүдэг дэвсгэрээр дүүргэнэ',
    ].join('\n'),
    { parse_mode: 'Markdown', reply_markup: fitMenu(preset) },
  )
}

/** 📐 Хэмжээ — алхам 3: гүйцэтгэх */
export async function runResize(ctx, state, preset, mode) {
  await ctx.replyWithChatAction('upload_photo')
  const input = await photoBuffer(ctx, state)
  const r = await resizeForPost(input, preset, mode)

  await ctx.replyWithDocument(new InputFile(r.buffer, `${preset.replace(':', 'x')}.jpg`), {
    caption: `📐 *${preset}* · ${r.width}×${r.height} · ${mode === 'crop' ? 'тайрсан' : 'бүтнээр'}`,
    parse_mode: 'Markdown',
    reply_markup: imageActionMenu(),
  })
}

/** 🎨 Branding — алхам 1: гарчиг асуух */
export async function askTitle(ctx) {
  await ctx.reply(
    [
      '🎨 *Гарчгаа бичнэ үү*',
      '',
      'Улаанаар онцлох үгсийг `*од*` дотор бичнэ:',
      '`Г.СОЛОНГО НАРЫГ *30 ХОНОГ* ЦАГДАН ХОРИВ`',
      '',
      '_Гарчиг урт бол фонт автоматаар багасаж багтана._',
    ].join('\n'),
    { parse_mode: 'Markdown' },
  )
}

/** 🎨 Branding — алхам 2: загвар сонгох */
export async function askTemplate(ctx, title) {
  await ctx.reply(`🎨 *Загвараа сонгоно уу*\n\nГарчиг: _${title}_`, {
    parse_mode: 'Markdown',
    reply_markup: templateMenu(),
  })
}

/** 🎨 Branding — алхам 3: гүйцэтгэх */
export async function runBrand(ctx, state, template) {
  const { title } = state.data
  // Гарчгийг зураг татахаас ӨМНӨ шалгана — эс бөгөөс гарчиггүй үед
  // дэмий татаж, хоосон гарчигтай зураг үүсгэнэ.
  if (!title?.trim()) {
    await ctx.reply('✏️ Эхлээд гарчгаа бичнэ үү.')
    return askTitle(ctx)
  }

  await ctx.replyWithChatAction('upload_photo')
  const input = await photoBuffer(ctx, state)

  if (template === 'all') {
    const media = []
    for (const name of templateNames) {
      const buffer = await renderPost({ image: input, title, template: name })
      media.push({ type: 'photo', media: new InputFile(buffer, `${name}.png`) })
    }
    media[0].caption = `🎞 Бүх загвар: ${templateNames.join(' · ')}`
    await ctx.replyWithMediaGroup(media)
    await ctx.reply('Аль нь таалагдав?', { reply_markup: templateMenu() })
    return
  }

  const buffer = await renderPost({ image: input, title, template })
  await ctx.replyWithDocument(new InputFile(buffer, `${template}.png`), {
    caption: `🎨 *${template}*`,
    parse_mode: 'Markdown',
    reply_markup: templateMenu(),
  })
}
