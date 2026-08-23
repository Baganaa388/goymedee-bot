import { InlineKeyboard } from 'grammy'
import { PRESETS } from '../image/plan.js'
import { STYLES } from '../text/rewrite.js'
import { templateLabels } from '../render.js'
import { isTextEnabled, providerLabel } from '../text/llm.js'

const HOME = '🏠 Үндсэн цэс'
const BACK = '◀️ Буцах'

/** Үндсэн цэс. */
export function mainMenu() {
  return new InlineKeyboard()
    .text('🖼 Зураг', 'menu:image')
    .row()
    .text('✍️ Текст', 'menu:text')
    .row()
    .text('🔗 Нийтлэл хуулах', 'menu:article')
    .row()
    .text('🌐 Сайт руу нийтлэх', 'menu:publish')
    .row()
    .text('⚙️ Тохиргоо', 'menu:settings')
}

export const MAIN_TEXT = [
  '*Юу хийх вэ?*',
  '',
  '🖼 *Зураг* — чанар сайжруулах, хэмжээ тохируулах, брэнд нэмэх',
  '✍️ *Текст* — үг үсгийн алдаа, найруулга засах',
  '🔗 *Нийтлэл хуулах* — линкээс текстийг гаргах',
].join('\n')

/** Зураг ирсний дараах үйлдлийн цэс. */
export function imageActionMenu() {
  return new InlineKeyboard()
    .text('✨ Чанар сайжруулах', 'act:enhance')
    .row()
    .text('📐 Хэмжээ тохируулах', 'act:resize')
    .row()
    .text('🎨 Branding нэмэх', 'act:brand')
    .row()
    .text('🔄 Өөр зураг', 'menu:image')
    .text(HOME, 'menu:home')
}

/** Хэмжээний сонголт. */
export function sizeMenu() {
  const kb = new InlineKeyboard()
  for (const [key, preset] of Object.entries(PRESETS)) {
    kb.text(preset.label, `size:${key}`).row()
  }
  return kb.text(BACK, 'act:back').text(HOME, 'menu:home')
}

/** Хэмжээ сонгосны дараах горим. */
export function fitMenu(preset) {
  return new InlineKeyboard()
    .text('✂️ Тайрах (цэвэрхэн)', `fit:${preset}|crop`)
    .row()
    .text('🖼 Бүтнээр (бүдэг дэвсгэртэй)', `fit:${preset}|blur`)
    .row()
    .text(BACK, 'act:resize')
    .text(HOME, 'menu:home')
}

/** Загварын сонголт. */
export function templateMenu() {
  const kb = new InlineKeyboard()
  for (const [key, label] of Object.entries(templateLabels)) {
    kb.text(label, `tpl:${key}`).row()
  }
  return kb
    .text('🎞 Бүгдийг харах', 'tpl:all')
    .row()
    .text('✏️ Гарчиг солих', 'act:brand')
    .text(HOME, 'menu:home')
}

/** Текст ирсний дараах үйлдлийн цэс. */
export function textActionMenu() {
  const kb = new InlineKeyboard()
  if (isTextEnabled()) {
    kb.text('🔤 Үг үсгийн алдаа', 'act:proofread').row()
    kb.text('📝 Найруулга сайжруулах', 'act:rewrite').row()
  }
  return kb.text('🔄 Өөр текст', 'menu:text').text(HOME, 'menu:home')
}

/** Найруулгын хэв маягийн сонголт. */
export function styleMenu() {
  const kb = new InlineKeyboard()
  for (const [key, style] of Object.entries(STYLES)) {
    kb.text(style.label, `sty:${key}`).row()
  }
  return kb.text(BACK, 'menu:textback').text(HOME, 'menu:home')
}

/** Нийтлэл хуулсны дараах цэс. */
export function articleResultMenu() {
  const kb = new InlineKeyboard()
  if (isTextEnabled()) {
    kb.text('🔤 Үг үсэг шалгах', 'act:proofread').row()
    kb.text('📝 Найруулга сайжруулах', 'act:rewrite').row()
  }
  return kb.text('🔗 Өөр линк', 'menu:article').text(HOME, 'menu:home')
}

/** Зөвхөн үндсэн цэс рүү буцах товч. */
export function homeMenu() {
  return new InlineKeyboard().text(HOME, 'menu:home')
}

/** Тохиргооны дэлгэц. */
export function settingsText(cfg) {
  const frame = cfg.frame?.enabled ? `асаалттай (${cfg.frame.width}px, бүдгэрэлт ${cfg.frame.blur})` : 'унтраалттай'
  return [
    '*⚙️ Тохиргоо*',
    '',
    `Брэнд: *${cfg.brand.name}*`,
    `Уриа: ${cfg.brand.tagline.replace(/\n/g, ' / ')}`,
    `Гол өнгө: \`${cfg.colors.accent}\``,
    `Зургийн хэмжээ: ${cfg.size.width}×${cfg.size.height}`,
    `Хүрээ: ${frame}`,
    '',
    `Текстийн загвар: *${providerLabel()}*`,
    '',
    '_Эдгээрийг `config.json` файлаас өөрчилнө._',
  ].join('\n')
}
