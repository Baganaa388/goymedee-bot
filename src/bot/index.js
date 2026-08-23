import { Bot, GrammyError, HttpError } from 'grammy'
import { run, sequentialize } from '@grammyjs/runner'
import { loadConfig } from '../render.js'
import { createStore, parseCallback } from './session.js'
import { findPhoto } from './telegram.js'
import { friendlyError, humanBytes } from './ui.js'
import {
  mainMenu,
  MAIN_TEXT,
  imageActionMenu,
  textActionMenu,
  homeMenu,
  settingsText,
} from './menu.js'
import * as image from './flows/image.js'
import * as text from './flows/text.js'
import * as article from './flows/article.js'

/** Хэрэглэгчээс юу хүлээж байгааг илэрхийлэх алхмууд. */
const STEP = {
  PHOTO: 'зураг',
  TITLE: 'гарчиг',
  TEXT: 'текст',
  URL: 'линк',
}

export function createBot(token, options = {}) {
  const bot = new Bot(token, options)
  const store = createStore()
  const cfg = loadConfig()

  const who = (ctx) => ctx.from?.id ?? ctx.chat?.id ?? 0

  // Нэг хэрэглэгчийн шинэчлэлтүүдийг дараалалд оруулна — зэрэг ирсэн
  // мессежүүд төлвийг эвдэхээс сэргийлнэ.
  bot.use(sequentialize((ctx) => String(who(ctx))))

  /**
   * Урт үйлдлийг түгжээтэйгээр гүйцэтгэнэ.
   * Хэрэглэгч товчоо давхар дарсан ч хоёр дахь үйлдэл эхлэхгүй, харин
   * ойлгомжтой мэдэгдэл өгнө. Алдаа гарсан ч түгжээ заавал тайлагдана.
   */
  async function guarded(ctx, work) {
    const id = who(ctx)
    if (!store.lock(id)) {
      await ctx.reply('⏳ Өмнөх үйлдэл дуусаагүй байна. Түр хүлээнэ үү.').catch(() => {})
      return
    }
    try {
      await work()
    } catch (error) {
      console.error('[урсгалын алдаа]', error)
      await ctx
        .reply(friendlyError(error), { reply_markup: homeMenu() })
        .catch(() => {})
    } finally {
      store.unlock(id)
    }
  }

  const showMain = (ctx, id) => {
    store.reset(id)
    return ctx.reply(MAIN_TEXT, { parse_mode: 'Markdown', reply_markup: mainMenu() })
  }

  // ---------------- командууд ----------------

  bot.command('start', async (ctx) => {
    await ctx.reply(
      [
        `👋 Сайн байна уу\\!`,
        '',
        `Би *${cfg.brand.name}* хуудсанд контент бэлдэхэд туслана\\.`,
      ].join('\n'),
      { parse_mode: 'MarkdownV2' },
    )
    await showMain(ctx, who(ctx))
  })

  bot.command('menu', (ctx) => showMain(ctx, who(ctx)))

  bot.command('cancel', async (ctx) => {
    store.reset(who(ctx))
    await ctx.reply('✅ Цуцаллаа.', { reply_markup: mainMenu() })
  })

  bot.command('help', (ctx) =>
    ctx.reply(
      [
        '*Тусламж*',
        '',
        '/menu — үндсэн цэс',
        '/cancel — одоогийн үйлдлийг цуцлах',
        '',
        '*Зөвлөмж*',
        '• Зургийг *файлаар* илгээвэл чанар алдагдахгүй',
        '• Эх зураг 1080px-ээс өргөн байвал хамгийн сайн',
        '• Гарчигт `*од*` дотор бичсэн үг улаанаар гарна',
      ].join('\n'),
      { parse_mode: 'Markdown', reply_markup: mainMenu() },
    ),
  )

  // ---------------- товчлуурууд ----------------

  bot.on('callback_query:data', async (ctx) => {
    // Товчлуурын "ачаалж байна" тэмдгийг шууд арилгана — эс бөгөөс
    // хэрэглэгчид bot гацсан мэт харагдана.
    await ctx.answerCallbackQuery().catch(() => {})

    const id = who(ctx)
    const { ns, value } = parseCallback(ctx.callbackQuery.data)
    const state = store.get(id)

    if (ns === 'menu') return handleMenu(ctx, id, value)
    if (ns === 'act') return handleAction(ctx, id, value, state)
    if (ns === 'size') {
      store.set(id, { data: { preset: value } })
      return image.askFit(ctx, value)
    }
    if (ns === 'fit') {
      const [preset, mode] = value.split('|')
      return guarded(ctx, () => image.runResize(ctx, store.get(id), preset, mode))
    }
    if (ns === 'tpl') {
      return guarded(ctx, () => image.runBrand(ctx, store.get(id), value))
    }
    if (ns === 'sty') {
      return guarded(ctx, () => text.runRewrite(ctx, store.get(id), value))
    }
  })

  async function handleMenu(ctx, id, value) {
    switch (value) {
      case 'home':
        return showMain(ctx, id)

      case 'image':
        store.set(id, { step: STEP.PHOTO, data: {} })
        return ctx.reply(
          [
            '🖼 *Зургаа илгээнэ үү*',
            '',
            '💡 _Чанар алдагдуулахгүйн тулд зургийг *файлаар* (📎 → Файл) илгээхийг зөвлөе._',
          ].join('\n'),
          { parse_mode: 'Markdown' },
        )

      case 'text':
      case 'textback':
        store.set(id, { step: STEP.TEXT, data: {} })
        return ctx.reply('✍️ *Текстээ илгээнэ үү*', { parse_mode: 'Markdown' })

      case 'article':
        store.set(id, { step: STEP.URL, data: {} })
        return ctx.reply(
          '🔗 *Нийтлэлийн линкээ илгээнэ үү*\n\n_Жишээ:_ `https://ikon.mn/n/...`',
          { parse_mode: 'Markdown' },
        )

      case 'publish':
        return ctx.reply(
          [
            '🚧 *Сайт руу нийтлэх*',
            '',
            'Энэ хэсэг хөгжүүлэлтэд явж байна.',
            '',
            '_Одоохондоо бэлдсэн зураг, текстээ татаж аваад гараар нийтлэнэ үү._',
          ].join('\n'),
          { parse_mode: 'Markdown', reply_markup: homeMenu() },
        )

      case 'settings':
        return ctx.reply(settingsText(cfg), {
          parse_mode: 'Markdown',
          reply_markup: homeMenu(),
        })
    }
  }

  async function handleAction(ctx, id, value, state) {
    switch (value) {
      case 'enhance':
        return guarded(ctx, () => image.runEnhance(ctx, state))

      case 'resize':
        return image.askSize(ctx)

      case 'brand':
        store.set(id, { step: STEP.TITLE })
        return image.askTitle(ctx)

      case 'proofread':
        return guarded(ctx, () => text.runProofread(ctx, store.get(id)))

      case 'rewrite':
        return text.askStyle(ctx)

      case 'back':
        return ctx.reply('Юу хийх вэ?', { reply_markup: imageActionMenu() })
    }
  }

  // ---------------- зураг ----------------

  bot.on(['message:photo', 'message:document'], async (ctx) => {
    const photo = findPhoto(ctx.message)
    if (!photo) {
      return ctx.reply('⚠️ Энэ файлыг зураг гэж таньсангүй. JPG эсвэл PNG илгээнэ үү.')
    }

    const id = who(ctx)
    store.set(id, { step: null, data: { photo } })

    const notes = []
    if (photo.compressed) {
      notes.push('_Telegram энэ зургийг шахсан байна. Илүү сайн чанар хүсвэл 📎 → Файл-аар илгээнэ үү._')
    }
    if (photo.width && photo.width < 1080) {
      notes.push(`⚠️ _Өргөн ${photo.width}px — 1080px-ээс бага. Томсгоход бүдгэрч магадгүй._`)
    }

    await ctx.reply(
      [
        '✅ *Зураг хүлээж авлаа*',
        photo.width ? `${photo.width}×${photo.height}` : null,
        photo.bytes ? humanBytes(photo.bytes) : null,
        notes.length ? `\n${notes.join('\n')}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
        .replace(' · \n', '\n'),
      { parse_mode: 'Markdown', reply_markup: imageActionMenu() },
    )
  })

  // ---------------- текст ----------------

  bot.on('message:text', async (ctx) => {
    const id = who(ctx)
    const state = store.get(id)
    const body = ctx.message.text.trim()

    // Алхам заагаагүй ч линк илгээвэл нийтлэл хуулна — байгалийн зан төлөв.
    const looksLikeUrl = /^https?:\/\/\S+$/i.test(body)

    if (state.step === STEP.URL || (looksLikeUrl && state.step === null)) {
      return guarded(ctx, async () => {
        const extracted = await article.runArticle(ctx, body)
        store.set(id, { step: null, data: { text: extracted } })
      })
    }

    if (state.step === STEP.TITLE) {
      store.set(id, { step: null, data: { title: body } })
      return image.askTemplate(ctx, body)
    }

    if (state.step === STEP.TEXT) {
      store.set(id, { step: null, data: { text: body } })
      return ctx.reply(
        `✅ *Текст хүлээж авлаа* · ${body.length.toLocaleString('mn-MN')} тэмдэгт`,
        { parse_mode: 'Markdown', reply_markup: textActionMenu() },
      )
    }

    if (state.step === STEP.PHOTO) {
      return ctx.reply('🖼 Зураг хүлээж байна. Зургаа илгээнэ үү, эсвэл /menu дарж буцна уу.')
    }

    // Юу ч хүлээгээгүй үед: текст ирсэн тул шууд текстийн урсгалд оруулна.
    store.set(id, { step: null, data: { text: body } })
    await ctx.reply(
      `✅ *Текст хүлээж авлаа* · ${body.length.toLocaleString('mn-MN')} тэмдэгт`,
      { parse_mode: 'Markdown', reply_markup: textActionMenu() },
    )
  })

  // ---------------- алдаа барих ----------------

  bot.catch((err) => {
    const ctx = err.ctx
    const e = err.error
    if (e instanceof GrammyError) {
      console.error('[Telegram API]', e.description)
    } else if (e instanceof HttpError) {
      console.error('[Telegram холболт]', e)
    } else {
      console.error('[баригдаагүй алдаа]', e)
    }
    ctx
      ?.reply?.('⚠️ Алдаа гарлаа. /menu дарж дахин эхлүүлнэ үү.')
      .catch(() => {})
  })

  return { bot, store }
}

/** Bot-ыг ажиллуулж, зөв унтраах боломжтой болгоно. */
export async function startBot(token) {
  const { bot } = createBot(token)

  await bot.api.setMyCommands([
    { command: 'menu', description: 'Үндсэн цэс' },
    { command: 'cancel', description: 'Одоогийн үйлдлийг цуцлах' },
    { command: 'help', description: 'Тусламж' },
  ])

  const me = await bot.api.getMe()
  // Олон шинэчлэлтийг зэрэг боловсруулна — нэг удаан үйлдэл бусдыг хүлээлгэхгүй.
  const runner = run(bot)

  const stop = async () => {
    console.log('\nBot зогсож байна…')
    if (runner.isRunning()) await runner.stop()
    process.exit(0)
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  return { bot, runner, me }
}
