import { test } from 'node:test'
import assert from 'node:assert/strict'
import { coverRect } from '../src/lib/draw.js'

test('харьцаа ижил бол эх зургийг бүтнээр нь авна', () => {
  assert.deepEqual(coverRect(1000, 1000, 500, 500), { sx: 0, sy: 0, sw: 1000, sh: 1000 })
})

test('өргөн зургийн хажуу талыг тайрч, өндрийг бүтнээр үлдээнэ', () => {
  assert.deepEqual(coverRect(2000, 1000, 1000, 1000), { sx: 500, sy: 0, sw: 1000, sh: 1000 })
})

test('өндөр зургийн дээд доод талыг тайрна', () => {
  assert.deepEqual(coverRect(1000, 2000, 1000, 1000), { sx: 0, sy: 500, sw: 1000, sh: 1000 })
})

test('focus 0 үед тайралт эхнээс нь эхэлнэ', () => {
  assert.deepEqual(coverRect(1000, 2000, 1000, 1000, 0), { sx: 0, sy: 0, sw: 1000, sh: 1000 })
})

test('focus 1 үед тайралт төгсгөл рүү шилжинэ', () => {
  assert.deepEqual(coverRect(2000, 1000, 1000, 1000, 1), { sx: 1000, sy: 0, sw: 1000, sh: 1000 })
})

test('4:5 хайрцагт багтаахад эх зургийн өндөр бүтнээр үлдэнэ', () => {
  const r = coverRect(1254, 1064, 1080, 1350)
  assert.equal(r.sh, 1064)
  assert.ok(Math.abs(r.sw - 1064 * (1080 / 1350)) < 0.001)
  assert.ok(Math.abs(r.sx - (1254 - r.sw) / 2) < 0.001)
})
