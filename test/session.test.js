import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStore, parseCallback, buildCallback } from '../src/bot/session.js'

// ---------- төлөвийн хадгалалт ----------

test('шинэ хэрэглэгчид хоосон төлөв өгнө', () => {
  const s = createStore()
  assert.deepEqual(s.get(1), { step: null, data: {} })
})

test('set нь өмнөх төлөвтэй нэгтгэнэ, дарж бичихгүй', () => {
  const s = createStore()
  s.set(1, { step: 'зураг_хүлээж_буй' })
  s.set(1, { data: { title: 'Гарчиг' } })
  assert.equal(s.get(1).step, 'зураг_хүлээж_буй')
  assert.deepEqual(s.get(1).data, { title: 'Гарчиг' })
})

test('data доторх талбарууд ч нэгдэнэ', () => {
  const s = createStore()
  s.set(1, { data: { a: 1 } })
  s.set(1, { data: { b: 2 } })
  assert.deepEqual(s.get(1).data, { a: 1, b: 2 })
})

test('хэрэглэгчид бие биенийхээ төлвийг харахгүй', () => {
  const s = createStore()
  s.set(1, { step: 'нэг' })
  s.set(2, { step: 'хоёр' })
  assert.equal(s.get(1).step, 'нэг')
  assert.equal(s.get(2).step, 'хоёр')
})

test('reset нь төлвийг цэвэрлэнэ', () => {
  const s = createStore()
  s.set(1, { step: 'нэг', data: { a: 1 } })
  s.reset(1)
  assert.deepEqual(s.get(1), { step: null, data: {} })
})

test('хугацаа дууссан төлөв өөрөө цэвэрлэгдэнэ', () => {
  let now = 1000
  const s = createStore({ ttlMs: 500, now: () => now })
  s.set(1, { step: 'нэг' })
  now = 1400
  assert.equal(s.get(1).step, 'нэг', 'хугацаа дуусаагүй үед хадгалагдана')
  now = 1600
  assert.equal(s.get(1).step, null, 'хугацаа дууссан үед цэвэрлэгдэнэ')
})

// ---------- давхар дарахаас хамгаалах түгжээ ----------

test('түгжээ нэг хэрэглэгчид нэг л удаа өгөгдөнө', () => {
  const s = createStore()
  assert.equal(s.lock(1), true, 'эхний түгжээ амжилттай')
  assert.equal(s.lock(1), false, 'давхар түгжээ өгөхгүй')
  s.unlock(1)
  assert.equal(s.lock(1), true, 'тайлсны дараа дахин өгнө')
})

test('нэг хэрэглэгчийн түгжээ нөгөөд саад болохгүй', () => {
  const s = createStore()
  s.lock(1)
  assert.equal(s.lock(2), true)
})

// ---------- товчлуурын өгөгдөл ----------

test('товчлуурын өгөгдлийг эхний цэгээр л таслана', () => {
  assert.deepEqual(parseCallback('size:4:5'), { ns: 'size', value: '4:5' })
  assert.deepEqual(parseCallback('act:enhance'), { ns: 'act', value: 'enhance' })
})

test('цэггүй өгөгдөлд утга хоосон байна', () => {
  assert.deepEqual(parseCallback('home'), { ns: 'home', value: '' })
})

test('Telegram-ын 64 байтын хязгаараас хэтэрвэл алдаа шиднэ', () => {
  assert.equal(buildCallback('act', 'brand'), 'act:brand')
  assert.throws(() => buildCallback('act', 'у'.repeat(40)), /64 байт/)
})
