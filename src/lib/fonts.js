import { GlobalFonts } from '@napi-rs/canvas'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const fontsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../fonts')

/**
 * Төсөлд хамт ирсэн фонтуудыг бүртгэнэ.
 * Системийн фонтуудад найдахгүй — Windows-ийн Arial Narrow, Segoe UI Black зэрэг нь
 * Skia дээр кирилл үсгийг зөв гаргадаггүй (□ болдог) нь туршилтаар батлагдсан.
 */
let registered = false
export function registerFonts() {
  if (registered) return
  const faces = [
    ['Oswald.ttf', 'Oswald'],
    ['RobotoCondensed.ttf', 'RobotoCondensed'],
  ]
  for (const [file, family] of faces) {
    const p = path.join(fontsDir, file)
    if (!fs.existsSync(p)) {
      throw new Error(`Фонт олдсонгүй: ${p}. "npm run fonts" ажиллуулна уу.`)
    }
    GlobalFonts.registerFromPath(p, family)
  }
  registered = true
}
