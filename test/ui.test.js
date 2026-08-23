import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chunk, escapeMd, humanBytes, friendlyError, formatDate, MAX_MESSAGE } from '../src/bot/ui.js'

test('богино текстийг хуваахгүй', () => {
  assert.deepEqual(chunk('богино'), ['богино'])
})

test('хоосон текст хоосон жагсаалт өгнө', () => {
  assert.deepEqual(chunk(''), [])
})

test('урт текстийг Telegram-д багтах хэсгүүд болгоно', () => {
  const parts = chunk('А'.repeat(10000))
  assert.ok(parts.length > 1)
  for (const p of parts) assert.ok(p.length <= MAX_MESSAGE, `хэсэг хэтэрсэн: ${p.length}`)
})

test('хуваахдаа догол мөрийн заагийг эрхэмлэнэ', () => {
  const text = 'А'.repeat(500) + '\n\n' + 'Б'.repeat(500)
  const [first] = chunk(text, 700)
  assert.ok(first.endsWith('А'), 'догол мөрийн зааг дээр тасалсан байх ёстой')
})

test('хуваасны дараа бүх агуулга хадгалагдана', () => {
  const words = Array.from({ length: 900 }, (_, i) => `үг${i}`).join(' ')
  const joined = chunk(words, 400).join(' ')
  assert.equal(joined.replace(/\s+/g, ' '), words)
})

test('MarkdownV2-ийн тусгай тэмдэгтийг хамгаална', () => {
  assert.equal(escapeMd('a_b*c[d]'), String.raw`a\_b\*c\[d\]`)
  assert.equal(escapeMd('3.14'), String.raw`3\.14`)
})

test('байтыг ойлгомжтой бичнэ', () => {
  assert.equal(humanBytes(512), '512 B')
  assert.equal(humanBytes(2048), '2 KB')
  assert.equal(humanBytes(3 * 1024 * 1024), '3.0 MB')
})

test('огноог форматлана', () => {
  assert.equal(formatDate('2026-08-20T09:15:00Z'), '2026.08.20')
  assert.equal(formatDate(null), null)
})

test('timeout алдааг ойлгомжтой болгоно', () => {
  const e = new Error('The operation was aborted due to timeout')
  e.name = 'TimeoutError'
  assert.match(friendlyError(e), /Хугацаа хэтэрлээ/)
})

test('сүлжээний алдааг ойлгомжтой болгоно', () => {
  assert.match(friendlyError(new Error('fetch failed')), /Сүлжээнд холбогдож/)
})

test('монголоор бичсэн өөрийн мессежийг шууд дамжуулна', () => {
  assert.match(friendlyError(new Error('Шалгах текст хоосон байна.')), /Шалгах текст хоосон/)
})

test('танихгүй техникийн алдааг задлахгүй, ерөнхий мессеж өгнө', () => {
  const msg = friendlyError(new Error('ECONNRESET at /home/user/secret/path.js:42'))
  assert.equal(msg, '⚠️ Алдаа гарлаа. Дахин оролдоно уу.')
  assert.doesNotMatch(msg, /secret/)
})
