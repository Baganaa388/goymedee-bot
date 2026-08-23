import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fitText } from '../src/lib/text.js'

// Тестийн хэмжигч: тэмдэгтийн өргөн = фонтын хэмжээний тал
const measureAt = (s, size) => s.length * size * 0.5

const base = {
  measureAt,
  maxFontSize: 100,
  minFontSize: 10,
  lineHeight: 1.0,
}

test('багтаж байвал хамгийн том фонтыг сонгоно', () => {
  const r = fitText({ ...base, text: 'АА', maxWidth: 1000, maxHeight: 1000 })
  assert.equal(r.fontSize, 100)
  assert.deepEqual(r.lines, [[{ text: 'АА', highlight: false }]])
})

test('багтахгүй бол багтах хүртэл фонтыг багасгана', () => {
  const text = 'НЭГ ХОЁР ГУРАВ ДӨРӨВ ТАВ ЗУРГАА ДОЛОО НАЙМ'
  const r = fitText({ ...base, text, maxWidth: 200, maxHeight: 200 })
  assert.ok(r.fontSize < 100, `фонт багасах ёстой, гарсан нь ${r.fontSize}`)
  assert.ok(r.lines.length * r.fontSize <= 200, 'өндөрт багтах ёстой')
  for (const line of r.lines) {
    const w = measureAt(line.map((s) => s.text).join(''), r.fontSize)
    assert.ok(w <= 200 || line.length === 1, 'мөр өргөнд багтах ёстой')
  }
})

test('ямар ч байдлаар багтахгүй бол minFontSize дээр зогсоно', () => {
  const r = fitText({ ...base, text: 'А '.repeat(400), maxWidth: 50, maxHeight: 50 })
  assert.equal(r.fontSize, 10)
})

test('maxLines заасан бол мөрийн тоо түүнээс хэтрэхгүй', () => {
  const text = 'НЭГ ХОЁР ГУРАВ ДӨРӨВ ТАВ ЗУРГАА'
  const r = fitText({ ...base, text, maxWidth: 300, maxHeight: 10000, maxLines: 2 })
  assert.ok(r.lines.length <= 2, `2 мөрөөс хэтэрсэн: ${r.lines.length}`)
})

test('онцлолтын төлөв autofit-ийн дараа ч хадгалагдана', () => {
  const r = fitText({ ...base, text: 'НАРЫГ *30 ХОНОГ* ХОРИВ', maxWidth: 1000, maxHeight: 1000 })
  const flat = r.lines.flat()
  assert.ok(flat.some((s) => s.highlight && s.text.includes('30 ХОНОГ')))
})

test('хоосон текст дээр унахгүй', () => {
  const r = fitText({ ...base, text: '   ', maxWidth: 500, maxHeight: 500 })
  assert.deepEqual(r.lines, [])
  assert.equal(r.fontSize, 100)
})
