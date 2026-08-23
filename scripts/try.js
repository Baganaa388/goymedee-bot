#!/usr/bin/env node
/**
 * LOCAL ТУРШИЛТЫН ХЭРЭГСЭЛ — Telegram-гүйгээр бүх функцийг шалгана.
 *
 *   node scripts/try.js providers
 *   node scripts/try.js enhance assets/new-photo.jpg
 *   node scripts/try.js resize  assets/new-photo.jpg 4:5 crop
 *   node scripts/try.js brand   assets/new-photo.jpg "ГАРЧИГ *УЛААН* ҮГ" classic
 *   node scripts/try.js article https://ikon.mn/n/3pt5
 *   node scripts/try.js proofread "шалгах текст"
 *   node scripts/try.js rewrite  "засах текст" news
 */
import fs from 'node:fs'
import path from 'node:path'

if (fs.existsSync('.env')) process.loadEnvFile('.env')

const OUT = 'out'
const [, , command, ...args] = process.argv

const save = (name, buffer) => {
  fs.mkdirSync(OUT, { recursive: true })
  const file = path.join(OUT, name)
  fs.writeFileSync(file, buffer)
  console.log(`  💾 ${file}  (${(buffer.length / 1024).toFixed(0)} KB)`)
  return file
}

const need = (value, message) => {
  if (!value) {
    console.error(`❌ ${message}`)
    process.exit(1)
  }
  return value
}

const commands = {
  async providers() {
    const { providerLabel } = await import('../src/text/llm.js')
    console.log('BOT_TOKEN       :', process.env.BOT_TOKEN ? '✅ тохируулсан' : '❌ алга')
    console.log('Текстийн загвар :', providerLabel())
  },

  async enhance([input]) {
    need(input, 'Зургийн зам өгнө үү')
    const { enhanceImage } = await import('../src/image/enhance.js')
    const r = await enhanceImage(fs.readFileSync(input))
    console.log(`  Өмнө : ${r.before.width}x${r.before.height}  ${(r.before.bytes / 1024).toFixed(0)} KB  ${r.before.format}`)
    console.log(`  Дараа: ${r.after.width}x${r.after.height}  ${(r.after.bytes / 1024).toFixed(0)} KB  jpeg`)
    console.log(`  Томсгосон: ${r.plan.upscaled ? 'тийм' : 'үгүй'}`)
    save('try-enhance.jpg', r.buffer)
  },

  async resize([input, preset = '4:5', mode = 'crop']) {
    need(input, 'Зургийн зам өгнө үү')
    const { resizeForPost } = await import('../src/image/resize.js')
    const r = await resizeForPost(fs.readFileSync(input), preset, mode)
    console.log(`  ${preset} / ${mode} → ${r.width}x${r.height}`)
    save(`try-resize-${preset.replace(':', 'x')}-${mode}.jpg`, r.buffer)
  },

  async brand([input, title = 'ТУРШИЛТЫН *ГАРЧИГ*', template = 'classic']) {
    need(input, 'Зургийн зам өгнө үү')
    const { renderPost } = await import('../src/render.js')
    const buffer = await renderPost({ image: input, title, template })
    save(`try-brand-${template}.png`, buffer)
  },

  async article([url]) {
    need(url, 'Хаяг өгнө үү')
    const { extractArticle } = await import('../src/article/extract.js')
    const a = await extractArticle(url)
    console.log(`  Эх сурвалж: ${a.source}   [аргачлал: ${a.method}]`)
    console.log(`  Гарчиг    : ${a.title ?? '—'}`)
    console.log(`  Огноо     : ${a.published ?? '—'}`)
    console.log(`  Зураг     : ${a.image ?? '—'}`)
    console.log(`  Урт       : ${a.length} тэмдэгт`)
    console.log(`\n${a.text.slice(0, 400)}...\n`)
    save('try-article.txt', Buffer.from(`${a.title}\n\n${a.text}`, 'utf8'))
  },

  async proofread([text]) {
    need(text, 'Текст өгнө үү')
    const { proofread } = await import('../src/text/proofread.js')
    const r = await proofread(text)
    console.log('\n--- Засварласан ---\n' + r.corrected)
    console.log(`\n--- Өөрчлөлт (${r.changes.length}) ---`)
    for (const c of r.changes) console.log(`  «${c.from}» → «${c.to}»  ${c.why ?? ''}`)
  },

  async rewrite([text, style = 'news']) {
    need(text, 'Текст өгнө үү')
    const { rewrite } = await import('../src/text/rewrite.js')
    const r = await rewrite(text, style)
    console.log(`\n--- ${r.style} ---\n` + r.rewritten)
    if (r.notes.length) console.log('\n--- Тэмдэглэл ---\n' + r.notes.map((n) => `  • ${n}`).join('\n'))
  },
}

const run = commands[command]
if (!run) {
  console.error(`Ашиглах: node scripts/try.js <команд> [аргумент...]\n`)
  console.error(`Командууд: ${Object.keys(commands).join(', ')}`)
  process.exit(1)
}

try {
  await run(args)
} catch (e) {
  console.error(`\n❌ ${e.message}`)
  process.exit(1)
}
