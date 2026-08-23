import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PRESETS, presetSize, planEnhancement } from '../src/image/plan.js'

// ---------- хэмжээний урьдчилсан тохиргоо ----------

test('Facebook-ийн үндсэн хэмжээнүүд бүртгэлтэй', () => {
  assert.deepEqual(Object.keys(PRESETS), ['4:5', '1:1', '16:9', '9:16'])
  assert.deepEqual(presetSize('4:5'), { width: 1080, height: 1350 })
  assert.deepEqual(presetSize('1:1'), { width: 1080, height: 1080 })
})

test('танихгүй хэмжээ дээр ойлгомжтой алдаа шиднэ', () => {
  assert.throws(() => presetSize('3:7'), /Танихгүй хэмжээ: "3:7"/)
})

test('хэмжээ бүр танилцуулах нэртэй', () => {
  for (const [key, p] of Object.entries(PRESETS)) {
    assert.ok(p.label?.length > 0, `${key} нэргүй байна`)
  }
})

// ---------- чанар сайжруулах төлөвлөгөө ----------

const plan = (width, height, opts) => planEnhancement({ width, height }, opts)

test('хангалттай том зургийг томсгохгүй', () => {
  const r = plan(1920, 1080)
  assert.equal(r.upscaled, false)
  assert.equal(r.targetWidth, 1920)
  assert.equal(r.targetHeight, 1080)
})

test('хэт том зургийг дээд хязгаар хүртэл жижигрүүлнэ', () => {
  const r = plan(4000, 3000)
  assert.equal(r.targetWidth, 2160)
  assert.equal(r.targetHeight, 1620)
  assert.equal(r.upscaled, false)
})

test('жижиг зургийг зорилтот өргөн хүртэл томсгоно', () => {
  const r = plan(800, 600)
  assert.equal(r.upscaled, true)
  assert.equal(r.targetWidth, 1080)
  assert.equal(r.targetHeight, 810)
})

test('маш жижиг зургийг 4 дахин хэтрүүлэн томсгохгүй', () => {
  // 236 * 4 = 944 — 1080 хүрэхгүй ч энэ хязгаараас цааш зөөлрөх тул зогсооно
  const r = plan(236, 236)
  assert.equal(r.targetWidth, 944)
  assert.equal(r.targetHeight, 944)
  assert.equal(r.upscaled, true)
})

test('томсгосон зурагт илүү хүчтэй хурцлалт хэрэглэнэ', () => {
  assert.ok(plan(400, 400).sharpen.sigma > plan(1920, 1080).sharpen.sigma)
})

test('харьцааг хадгална', () => {
  const r = plan(1600, 900)
  assert.ok(Math.abs(r.targetWidth / r.targetHeight - 1600 / 900) < 0.01)
})
