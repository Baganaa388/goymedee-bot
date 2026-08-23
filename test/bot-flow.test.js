import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBot } from '../src/bot/index.js'

/**
 * Bot-ын урсгалыг ЖИНХЭНЭ Telegram-гүйгээр шалгана.
 * Бүх API дуудлагыг таслан авч бүртгэдэг тул сүлжээ шаардахгүй.
 */
function harness() {
  const botInfo = {
    id: 1,
    is_bot: true,
    first_name: 'test',
    username: 'test_bot',
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
    can_connect_to_business_account: false,
    has_main_web_app: false,
  }
  const { bot, store } = createBot('123:TEST', { botInfo })
  const calls = []

  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload })
    if (method === 'getFile') return { ok: true, result: { file_id: 'f', file_path: 'photo.jpg' } }
    return { ok: true, result: true }
  })

  return {
    bot,
    store,
    calls,
    sent: () => calls.filter((c) => c.method === 'sendMessage'),
    lastText: () => [...calls].reverse().find((c) => c.method === 'sendMessage')?.payload.text ?? '',
    lastKeyboard: () =>
      [...calls].reverse().find((c) => c.payload?.reply_markup)?.payload.reply_markup ?? null,
    buttons() {
      const kb = this.lastKeyboard()
      return (kb?.inline_keyboard ?? []).flat().map((b) => b.callback_data)
    },
  }
}

const FROM = { id: 42, is_bot: false, first_name: 'Хэрэглэгч' }
const CHAT = { id: 42, type: 'private' }
let seq = 0

const message = (extra) => ({
  update_id: ++seq,
  message: { message_id: ++seq, date: 0, chat: CHAT, from: FROM, ...extra },
})

const command = (name) =>
  message({
    text: `/${name}`,
    entities: [{ type: 'bot_command', offset: 0, length: name.length + 1 }],
  })

const callback = (data) => ({
  update_id: ++seq,
  callback_query: {
    id: String(++seq),
    from: FROM,
    chat_instance: 'ci',
    data,
    message: { message_id: ++seq, date: 0, chat: CHAT },
  },
})

const photoUpdate = (width = 1600) =>
  message({
    photo: [{ file_id: 'жижиг', width: 90, height: 90 }, { file_id: 'том', width, height: width, file_size: 300000 }],
  })

// ---------------- тестүүд ----------------

test('/start мэндчилгээ ба үндсэн цэсийг харуулна', async () => {
  const h = harness()
  await h.bot.handleUpdate(command('start'))
  assert.equal(h.sent().length, 2, 'мэндчилгээ + цэс')
  assert.deepEqual(h.buttons(), ['menu:image', 'menu:text', 'menu:article', 'menu:publish', 'menu:settings'])
})

test('Зураг цэс сонгоход зураг хүлээх төлөвт орно', async () => {
  const h = harness()
  await h.bot.handleUpdate(callback('menu:image'))
  assert.equal(h.store.get(42).step, 'зураг')
  assert.match(h.lastText(), /Зургаа илгээнэ үү/)
})

test('товчлуур дархад "ачаалж байна" тэмдгийг шууд арилгана', async () => {
  const h = harness()
  await h.bot.handleUpdate(callback('menu:image'))
  assert.ok(
    h.calls.some((c) => c.method === 'answerCallbackQuery'),
    'answerCallbackQuery дуудагдаагүй бол хэрэглэгчид гацсан мэт харагдана',
  )
})

test('зураг ирэхэд сессэд хадгалж, үйлдлийн цэс өгнө', async () => {
  const h = harness()
  await h.bot.handleUpdate(photoUpdate())
  assert.equal(h.store.get(42).data.photo.fileId, 'том')
  assert.deepEqual(h.buttons(), ['act:enhance', 'act:resize', 'act:brand', 'menu:image', 'menu:home'])
})

test('жижиг зураг ирэхэд анхааруулна', async () => {
  const h = harness()
  await h.bot.handleUpdate(photoUpdate(500))
  assert.match(h.lastText(), /500px/)
  assert.match(h.lastText(), /1080px-ээс бага/)
})

test('шахагдсан зураг ирэхэд файлаар илгээхийг зөвлөнө', async () => {
  const h = harness()
  await h.bot.handleUpdate(photoUpdate())
  assert.match(h.lastText(), /Файл-аар илгээнэ үү/)
})

test('зураг биш файлыг татгалзана', async () => {
  const h = harness()
  await h.bot.handleUpdate(message({ document: { file_id: 'd', mime_type: 'application/pdf' } }))
  assert.match(h.lastText(), /зураг гэж таньсангүй/)
})

test('Branding сонгоход гарчиг асууна', async () => {
  const h = harness()
  await h.bot.handleUpdate(photoUpdate())
  await h.bot.handleUpdate(callback('act:brand'))
  assert.equal(h.store.get(42).step, 'гарчиг')
  assert.match(h.lastText(), /Гарчгаа бичнэ үү/)
})

test('гарчиг бичихэд загварын сонголт гарна', async () => {
  const h = harness()
  await h.bot.handleUpdate(photoUpdate())
  await h.bot.handleUpdate(callback('act:brand'))
  await h.bot.handleUpdate(message({ text: 'ТУРШИЛТ *УЛААН* ҮГ' }))
  assert.equal(h.store.get(42).data.title, 'ТУРШИЛТ *УЛААН* ҮГ')
  assert.deepEqual(h.buttons(), ['tpl:classic', 'tpl:overlay', 'tpl:split', 'tpl:sidebar', 'tpl:all', 'act:brand', 'menu:home'])
})

test('хэмжээ сонгоод горимын сонголт гарна', async () => {
  const h = harness()
  await h.bot.handleUpdate(photoUpdate())
  await h.bot.handleUpdate(callback('act:resize'))
  assert.deepEqual(h.buttons(), ['size:4:5', 'size:1:1', 'size:16:9', 'size:9:16', 'act:back', 'menu:home'])

  await h.bot.handleUpdate(callback('size:4:5'))
  assert.equal(h.store.get(42).data.preset, '4:5')
  assert.deepEqual(h.buttons(), ['fit:4:5|crop', 'fit:4:5|blur', 'act:resize', 'menu:home'])
})

test('энгийн текст ирэхэд текстийн урсгалд орно', async () => {
  const h = harness()
  await h.bot.handleUpdate(message({ text: 'Шалгах ёстой текст энд байна' }))
  assert.equal(h.store.get(42).data.text, 'Шалгах ёстой текст энд байна')
  assert.match(h.lastText(), /Текст хүлээж авлаа/)
})

test('түлхүүргүй үед текстийн товчлуурууд харагдахгүй', async () => {
  const h = harness()
  await h.bot.handleUpdate(message({ text: 'текст' }))
  const buttons = h.buttons()
  assert.ok(!buttons.includes('act:proofread'), 'түлхүүргүй үед үг үсгийн товч гарах ёсгүй')
  assert.deepEqual(buttons, ['menu:text', 'menu:home'])
})

test('зураггүйгээр чанар сайжруулахыг оролдоход ойлгомжтой мэдэгдэл өгнө', async () => {
  const h = harness()
  await h.bot.handleUpdate(callback('act:enhance'))
  assert.match(h.lastText(), /Эхлээд зургаа илгээнэ үү/)
})

test('дотоод сүлжээний линк дээр bot унахгүй, алдааг ойлгомжтой хэлнэ', async () => {
  const h = harness()
  await h.bot.handleUpdate(callback('menu:article'))
  await h.bot.handleUpdate(message({ text: 'http://localhost:8080/admin' }))
  assert.match(h.lastText(), /Дотоод сүлжээ/)
  assert.equal(h.store.isLocked(42), false, 'алдааны дараа түгжээ тайлагдах ёстой')
})

test('"Сайт руу нийтлэх" нь хөгжүүлэлтэд явааг мэдэгдэнэ', async () => {
  const h = harness()
  await h.bot.handleUpdate(callback('menu:publish'))
  assert.match(h.lastText(), /хөгжүүлэлтэд явж байна/)
})

test('Тохиргоо нь брэнд болон загварын мэдээллийг харуулна', async () => {
  const h = harness()
  await h.bot.handleUpdate(callback('menu:settings'))
  assert.match(h.lastText(), /ГОЁ МЭДЭЭ/)
  assert.match(h.lastText(), /тохируулаагүй/)
})

test('/cancel төлвийг цэвэрлэнэ', async () => {
  const h = harness()
  await h.bot.handleUpdate(photoUpdate())
  await h.bot.handleUpdate(command('cancel'))
  assert.deepEqual(h.store.get(42).data, {})
})

test('үндсэн цэс рүү буцахад төлөв цэвэрлэгдэнэ', async () => {
  const h = harness()
  await h.bot.handleUpdate(photoUpdate())
  await h.bot.handleUpdate(callback('menu:home'))
  assert.deepEqual(h.store.get(42).data, {})
})

test('хоёр хэрэглэгчийн төлөв хоорондоо холилдохгүй', async () => {
  const h = harness()
  const other = { ...FROM, id: 99 }
  await h.bot.handleUpdate(photoUpdate())
  await h.bot.handleUpdate({
    update_id: ++seq,
    message: { message_id: ++seq, date: 0, chat: { id: 99, type: 'private' }, from: other, text: 'бусад текст' },
  })
  assert.ok(h.store.get(42).data.photo, 'эхний хэрэглэгчийн зураг хэвээр')
  assert.equal(h.store.get(99).data.text, 'бусад текст')
  assert.equal(h.store.get(99).data.photo, undefined)
})

test('гарчиггүйгээр загвар сонгоход ойлгомжтой мэдэгдэл өгнө', async () => {
  const h = harness()
  await h.bot.handleUpdate(photoUpdate())
  await h.bot.handleUpdate(callback('tpl:classic')) // гарчиг бичихээс өмнө
  assert.match(h.lastText(), /гарчиг/i)
  assert.equal(h.store.isLocked(42), false)
})
