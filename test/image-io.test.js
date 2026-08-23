import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { enhanceImage } from '../src/image/enhance.js'
import { resizeForPost } from '../src/image/resize.js'

const small = await readFile('assets/new-photo.jpg') // 236x236
const wide = await readFile('assets/photo-wide.jpg') // 1193x560

test('жижиг зургийг томсгож, JPEG болгож буцаана', async () => {
  const r = await enhanceImage(small)
  assert.equal(r.before.width, 236)
  assert.equal(r.after.width, 944, '4 дахин томсгосон байх ёстой')
  assert.equal(r.after.format, 'jpeg')
  assert.ok(r.plan.upscaled)
})

test('том зургийг дэмий томсгохгүй', async () => {
  const r = await enhanceImage(wide)
  assert.equal(r.after.width, 1193)
  assert.equal(r.plan.upscaled, false)
})

for (const preset of ['4:5', '1:1', '16:9', '9:16']) {
  test(`${preset}: тайрах горимд яг заасан хэмжээтэй гарна`, async () => {
    const r = await resizeForPost(wide, preset, 'crop')
    const m = await sharp(r.buffer).metadata()
    assert.deepEqual({ width: m.width, height: m.height }, { width: r.width, height: r.height })
  })
}

test('бүдэг дэвсгэр горимд ч заасан хэмжээтэй гарна', async () => {
  const r = await resizeForPost(wide, '9:16', 'blur')
  const m = await sharp(r.buffer).metadata()
  assert.equal(m.width, 1080)
  assert.equal(m.height, 1920)
})

test('танихгүй горим дээр алдаа шиднэ', async () => {
  await assert.rejects(() => resizeForPost(wide, '1:1', 'хачин'), /Танихгүй горим/)
})

test('гэмтсэн өгөгдөл дээр ойлгомжтой алдаа гаргана', async () => {
  await assert.rejects(() => enhanceImage(Buffer.from('энэ зураг биш')))
})
