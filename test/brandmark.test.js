import { test } from 'node:test'
import assert from 'node:assert/strict'
import { drawBrandMark } from '../src/lib/draw.js'

function fakeCtx() {
  const texts = []
  const rects = []
  return {
    texts,
    rects,
    font: '400 10px Fallback',
    textBaseline: '',
    fillStyle: '',
    measureText(t) {
      const size = parseFloat(/(\d+(?:\.\d+)?)px/.exec(this.font)?.[1] ?? 10)
      return { width: t.length * size * 0.5, actualBoundingBoxAscent: size * 0.7 }
    },
    fillText(text, x, y) {
      texts.push({ text, x, y, font: this.font, fillStyle: this.fillStyle })
    },
    fillRect(x, y, w, h) {
      rects.push({ x, y, w, h, fillStyle: this.fillStyle })
    },
  }
}

const base = {
  name: 'ГОЁ МЭДЭЭ',
  x: 0,
  y: 0,
  fontSize: 60,
  color: '#ffffff',
  accent: '#e01f26',
  fontFamily: 'Oswald',
}

test('брэндийн нэрийг нэг мөрөнд бүтнээр нь бичнэ', () => {
  const ctx = fakeCtx()
  drawBrandMark(ctx, { ...base, maxWidth: 1000 })
  assert.equal(ctx.texts.length, 1, 'нэг л удаа бичих ёстой')
  assert.equal(ctx.texts[0].text, 'ГОЁ МЭДЭЭ')
})

test('өргөнд багтахгүй бол фонтын хэмжээг багасгаж багтаана', () => {
  const ctx = fakeCtx()
  // 'ГОЁ МЭДЭЭ' = 9 тэмдэгт → 60px дээр 270px өргөн. 135px-д багтаахад 30px хэрэгтэй.
  drawBrandMark(ctx, { ...base, maxWidth: 135 })
  assert.match(ctx.texts[0].font, /700 30px/)
})

test('багтаж байвал фонтыг томруулахгүй', () => {
  const ctx = fakeCtx()
  drawBrandMark(ctx, { ...base, maxWidth: 5000 })
  assert.match(ctx.texts[0].font, /700 60px/)
})

test('нэрийн доор өнгөт зураас татна', () => {
  const ctx = fakeCtx()
  drawBrandMark(ctx, { ...base, maxWidth: 1000 })
  const bar = ctx.rects.at(-1)
  assert.equal(bar.fillStyle, '#e01f26')
  assert.equal(bar.w, 270, 'зураас нэрийн өргөнтэй тэнцүү байх ёстой')
  assert.ok(bar.y > 0, 'зураас текстийн доор байх ёстой')
})

test('логоны эзлэх нийт өндрийг буцаана', () => {
  const ctx = fakeCtx()
  const h = drawBrandMark(ctx, { ...base, maxWidth: 1000 })
  const bar = ctx.rects.at(-1)
  assert.ok(h >= bar.y + bar.h, `өндөр ${h} нь зураасны төгсгөл ${bar.y + bar.h}-г багтаах ёстой`)
})
