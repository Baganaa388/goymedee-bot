#!/usr/bin/env node
import fs from 'node:fs'
import { startBot } from './src/bot/index.js'
import { providerLabel } from './src/text/llm.js'
import { registerFonts } from './src/lib/fonts.js'

if (fs.existsSync('.env')) process.loadEnvFile('.env')

const token = process.env.BOT_TOKEN?.trim()
if (!token) {
  console.error('❌ BOT_TOKEN тохируулаагүй байна.')
  console.error('   .env файл үүсгээд `BOT_TOKEN=...` гэж бичнэ үү (.env.example-г хараарай).')
  process.exit(1)
}

// Фонтыг эхэнд нь бүртгэнэ — дутуу байвал эхний хэрэглэгч дээр биш,
// одоо шууд мэдэгдэнэ.
registerFonts()

const { me } = await startBot(token)

console.log(`✅ @${me.username} ажиллаж эхэллээ`)
console.log(`   Текстийн загвар: ${providerLabel()}`)
console.log('   Зогсоох: Ctrl+C')
