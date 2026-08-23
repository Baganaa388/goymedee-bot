import { createCanvas, loadImage } from '@napi-rs/canvas'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { registerFonts } from './lib/fonts.js'
import { templates, templateNames } from './templates/index.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** config.json-г уншина. */
export function loadConfig(file = path.join(root, 'config.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export { templateNames }

/** Загвар бүрийн танилцуулах нэр — bot-ын товчлуурт ашиглана. */
export const templateLabels = Object.fromEntries(
  templateNames.map((n) => [n, templates[n].label]),
)

/**
 * Facebook page post-д зориулсан зураг үүсгэнэ.
 * @param {object} opts
 * @param {string|Buffer} opts.image зургийн зам эсвэл буфер
 * @param {string} opts.title гарчиг, `*од*`-оор онцлолт заана
 * @param {string} [opts.template='classic']
 * @param {object} [opts.config]
 * @param {{width: number, height: number}} [opts.size]
 * @param {number} [opts.focus=0.5] зураг тайрах байрлал 0..1
 * @returns {Promise<Buffer>} PNG
 */
export async function renderPost({ image, title, template, config, size, focus = 0.5 }) {
  registerFonts()
  const cfg = config ?? loadConfig()
  const name = template ?? cfg.defaultTemplate
  const tpl = templates[name]
  if (!tpl) {
    throw new Error(`Танихгүй загвар: "${name}". Боломжит: ${templateNames.join(', ')}`)
  }

  const img = await loadImage(image)
  const { width, height } = size ?? cfg.size
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  tpl.draw(ctx, { img, title: title ?? '', cfg, width, height, focus })
  return canvas.toBuffer('image/png')
}
