import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findPhoto } from '../src/bot/telegram.js'

test('photo массиваас хамгийн том хувилбарыг сонгоно', () => {
  const r = findPhoto({
    photo: [
      { file_id: 'жижиг', width: 90, height: 90 },
      { file_id: 'дунд', width: 320, height: 320 },
      { file_id: 'том', width: 1280, height: 1280, file_size: 200000 },
    ],
  })
  assert.equal(r.fileId, 'том')
  assert.equal(r.width, 1280)
  assert.equal(r.compressed, true)
})

test('зураг төрлийн document-ыг шахагдаагүй гэж таньна', () => {
  const r = findPhoto({ document: { file_id: 'док', mime_type: 'image/png', file_size: 500000 } })
  assert.equal(r.fileId, 'док')
  assert.equal(r.compressed, false)
  assert.equal(r.bytes, 500000)
})

test('зураг биш document-ыг үл тоомсорлоно', () => {
  assert.equal(findPhoto({ document: { file_id: 'x', mime_type: 'application/pdf' } }), null)
  assert.equal(findPhoto({ document: { file_id: 'x', mime_type: 'video/mp4' } }), null)
})

test('зураггүй мессежид null буцаана', () => {
  assert.equal(findPhoto({ text: 'сайн уу' }), null)
  assert.equal(findPhoto({}), null)
  assert.equal(findPhoto(null), null)
})

test('хоосон photo массивыг зураггүйд тооцно', () => {
  assert.equal(findPhoto({ photo: [] }), null)
})
