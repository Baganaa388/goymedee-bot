import { test } from 'node:test'
import assert from 'node:assert/strict'
import { drawLines } from '../src/lib/draw.js'

/** Дуудлагыг бүртгэдэг хуурамч canvas контекст. */
function fakeCtx() {
  const calls = []
  return {
    calls,
    font: '400 10px Fallback',
    textBaseline: '',
    fillStyle: '',
    measureText(t) {
      const size = parseFloat(/(\d+(?:\.\d+)?)px/.exec(this.font)?.[1] ?? 10)
      return { width: t.length * size * 0.5, actualBoundingBoxAscent: size * 0.7 }
    },
    fillText(text, x, y) {
      calls.push({ text, x, y, font: this.font, fillStyle: this.fillStyle })
    },
  }
}

const line = [{ text: 'АБ', highlight: false }]
const opts = {
  x: 0,
  y: 0,
  width: 400,
  font: '700 60px "Oswald"',
  fontSize: 60,
  lineHeight: 1.1,
  color: '#ffffff',
  highlightColor: '#e01f26',
}

test('гаднаас ирсэн ctx.font-оос үл хамааран өөрийн фонтоо тохируулна', () => {
  const ctx = fakeCtx()
  ctx.font = '700 12px "Wrong"'
  drawLines(ctx, [line], opts)
  assert.equal(ctx.calls[0].font, '700 60px "Oswald"')
})

test('онцлолттой хэсгийг өнгөт, энгийнийг цагаанаар бичнэ', () => {
  const ctx = fakeCtx()
  drawLines(ctx, [[
    { text: 'А ', highlight: false },
    { text: 'Б', highlight: true },
  ]], opts)
  assert.equal(ctx.calls[0].fillStyle, '#ffffff')
  assert.equal(ctx.calls[1].fillStyle, '#e01f26')
})

test('блокийн нийт өндрийг буцаана', () => {
  const ctx = fakeCtx()
  const h = drawLines(ctx, [line, line, line], opts)
  assert.ok(Math.abs(h - 3 * 60 * 1.1) < 1e-9, `гарсан нь ${h}`)
})

test('center байрлуулалтад мөрийг хайрцгийн голд төвлөрүүлнэ', () => {
  const ctx = fakeCtx()
  drawLines(ctx, [line], { ...opts, align: 'center' })
  // 'АБ' өргөн = 2 * 60 * 0.5 = 60 → (400 - 60) / 2 = 170
  assert.equal(ctx.calls[0].x, 170)
})

test('right байрлуулалтад мөрийг баруун ирмэг рүү түлхэнэ', () => {
  const ctx = fakeCtx()
  drawLines(ctx, [line], { ...opts, align: 'right' })
  assert.equal(ctx.calls[0].x, 340)
})
