import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderPost, templateNames, templateLabels, loadConfig } from '../src/render.js'

const IMAGE = 'assets/photo-wide.jpg'
const TITLE = 'ТУРШИЛТЫН *ГАРЧИГ* ЭНД БАЙНА'

/** PNG-ийн толгойгоос өргөн, өндрийг уншина. */
function pngSize(buf) {
  assert.equal(buf.subarray(1, 4).toString('ascii'), 'PNG', 'PNG биш байна')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

test('дөрвөн загвар бүртгэлтэй бөгөөд тус бүр тайлбартай', () => {
  assert.deepEqual(templateNames, ['classic', 'overlay', 'split', 'sidebar'])
  for (const name of templateNames) {
    assert.ok(templateLabels[name]?.length > 0, `${name} загварт тайлбар алга`)
  }
})

for (const template of templateNames) {
  test(`${template}: config-т заасан хэмжээтэй PNG буцаана`, async () => {
    const buf = await renderPost({ image: IMAGE, title: TITLE, template })
    assert.deepEqual(pngSize(buf), loadConfig().size)
  })
}

test('хэмжээг гаднаас дарж өгч болно', async () => {
  const buf = await renderPost({
    image: IMAGE,
    title: TITLE,
    size: { width: 1200, height: 1200 },
  })
  assert.deepEqual(pngSize(buf), { width: 1200, height: 1200 })
})

test('зургийг буфераар өгч болно', async () => {
  const { readFile } = await import('node:fs/promises')
  const buf = await renderPost({ image: await readFile(IMAGE), title: TITLE })
  assert.equal(pngSize(buf).width, loadConfig().size.width)
})

test('танихгүй загвар дээр ойлгомжтой алдаа шиднэ', async () => {
  await assert.rejects(
    () => renderPost({ image: IMAGE, title: TITLE, template: 'байхгүй' }),
    /Танихгүй загвар: "байхгүй"/,
  )
})

test('гарчиггүй ч зураг үүснэ', async () => {
  const buf = await renderPost({ image: IMAGE, title: '' })
  assert.equal(pngSize(buf).height, loadConfig().size.height)
})

test('маш урт гарчиг ч зураг үүсгэхэд саад болохгүй', async () => {
  const buf = await renderPost({ image: IMAGE, title: 'МОНГОЛ '.repeat(60) })
  assert.equal(pngSize(buf).height, loadConfig().size.height)
})
