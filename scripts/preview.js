/**
 * LOCAL ТЕСТ — жишээ зургаар бүх загварыг зурж `out/` руу хадгална.
 * Ашиглах: node scripts/preview.js ["гарчиг"] [зургийн зам]
 */
import fs from 'node:fs'
import path from 'node:path'
import { renderPost, templateNames, loadConfig } from '../src/render.js'

const [, , titleArg, imageArg] = process.argv
const image = imageArg ?? 'assets/photo-wide.jpg'
const cfg = loadConfig()

const cases = titleArg
  ? [['custom', titleArg]]
  : [
      ['short', 'ГАМШГИЙН ДОХИО *ӨГЛӨӨ* ДУУГАРНА'],
      ['medium', 'Г.СОЛОНГО, Г.АДИЛБИШ НАРЫГ *30 ХОНОГ* ЦАГДАН ХОРИХООР ШИЙДВЭРЛЭЖЭЭ'],
      ['long', 'УЛААНБААТАР ХОТЫН АГААРЫН БОХИРДЛЫГ БУУРУУЛАХ ЗОРИЛГООР *2026 ОНЫ 1 ДҮГЭЭР САРААС* ТҮҮХИЙ НҮҮРС ХЭРЭГЛЭХИЙГ БҮРЭН ХОРИГЛОХ ШИЙДВЭР ГАРГАЛАА'],
    ]

fs.mkdirSync('out', { recursive: true })
for (const file of fs.readdirSync('out')) fs.unlinkSync(path.join('out', file))

for (const [caseName, title] of cases) {
  for (const template of templateNames) {
    const buf = await renderPost({ image, title, template, config: cfg })
    const out = path.join('out', `${caseName}-${template}.png`)
    fs.writeFileSync(out, buf)
    console.log(`${out}  (${(buf.length / 1024).toFixed(0)} KB)`)
  }
}
