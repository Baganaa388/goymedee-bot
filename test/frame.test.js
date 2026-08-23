import { test } from 'node:test'
import assert from 'node:assert/strict'
import { drawFrame } from '../src/lib/draw.js'

/** save/restore-г дуурайдаг хуурамч контекст. */
function fakeCtx() {
  const strokes = []
  const stack = []
  const ctx = {
    strokes,
    filter: 'none',
    globalAlpha: 1,
    strokeStyle: '',
    lineWidth: 1,
    save() {
      stack.push({ filter: this.filter, globalAlpha: this.globalAlpha, lineWidth: this.lineWidth })
    },
    restore() {
      Object.assign(this, stack.pop())
    },
    beginPath() {},
    closePath() {},
    moveTo() {},
    arcTo() {},
    stroke() {
      strokes.push({
        filter: this.filter,
        globalAlpha: this.globalAlpha,
        lineWidth: this.lineWidth,
        strokeStyle: this.strokeStyle,
      })
    },
  }
  return ctx
}

const box = [40, 40, 1000, 1270, 30]

test('blur өгвөл зурахдаа blur шүүлтүүр хэрэглэнэ', () => {
  const ctx = fakeCtx()
  drawFrame(ctx, ...box, { color: '#fff', width: 4, blur: 7 })
  assert.equal(ctx.strokes[0].filter, 'blur(7px)')
})

test('blur 0 үед шүүлтүүр хэрэглэхгүй', () => {
  const ctx = fakeCtx()
  drawFrame(ctx, ...box, { color: '#fff', width: 4, blur: 0 })
  assert.equal(ctx.strokes[0].filter, 'none')
})

test('opacity-г globalAlpha болгож дамжуулна', () => {
  const ctx = fakeCtx()
  drawFrame(ctx, ...box, { color: '#fff', width: 4, blur: 6, opacity: 0.55 })
  assert.equal(ctx.strokes[0].globalAlpha, 0.55)
})

test('зурж дуусаад контекстийн төлвийг сэргээнэ', () => {
  const ctx = fakeCtx()
  drawFrame(ctx, ...box, { color: '#fff', width: 4, blur: 6, opacity: 0.5 })
  assert.equal(ctx.filter, 'none', 'шүүлтүүр цэвэрлэгдэх ёстой')
  assert.equal(ctx.globalAlpha, 1, 'globalAlpha сэргэх ёстой')
})

test('зузааныг дамжуулна', () => {
  const ctx = fakeCtx()
  drawFrame(ctx, ...box, { color: '#fff', width: 9, blur: 6 })
  assert.equal(ctx.strokes[0].lineWidth, 9)
})

test('halo асаалттай үед хар туяа + үндсэн шугам гэсэн 2 давхарга зурна', () => {
  const ctx = fakeCtx()
  drawFrame(ctx, ...box, { color: '#ffffff', width: 4, blur: 6, halo: true, haloColor: '#000000' })
  assert.equal(ctx.strokes.length, 2)
  assert.equal(ctx.strokes[0].strokeStyle, '#000000', 'эхлээд хар туяа')
  assert.equal(ctx.strokes[1].strokeStyle, '#ffffff', 'дараа нь цагаан шугам')
})

test('halo давхарга нь үндсэн шугамаас зузаан бөгөөд илүү бүдэг', () => {
  const ctx = fakeCtx()
  drawFrame(ctx, ...box, { color: '#ffffff', width: 4, blur: 6, halo: true })
  const [halo, main] = ctx.strokes
  assert.ok(halo.lineWidth > main.lineWidth, 'туяа зузаан байх ёстой')
  assert.ok(parseFloat(/blur\((\d+(?:\.\d+)?)px\)/.exec(halo.filter)[1]) > 6, 'туяа илүү бүдэг байх ёстой')
})

test('halo унтраалттай үед ганц давхарга зурна', () => {
  const ctx = fakeCtx()
  drawFrame(ctx, ...box, { color: '#fff', width: 4, blur: 6, halo: false })
  assert.equal(ctx.strokes.length, 1)
})
