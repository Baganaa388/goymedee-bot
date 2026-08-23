import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STYLES, rewrite } from '../src/text/rewrite.js'
import { proofread } from '../src/text/proofread.js'

test('гурван найруулгын хэв маяг бүртгэлтэй', () => {
  assert.deepEqual(Object.keys(STYLES), ['news', 'short', 'detailed'])
})

test('хэв маяг бүр товчлуурын нэр болон зааварчилгаатай', () => {
  for (const [key, s] of Object.entries(STYLES)) {
    assert.ok(s.label?.length > 0, `${key}: нэргүй`)
    assert.ok(s.instruction?.length > 20, `${key}: зааварчилгаа дутуу`)
  }
})

test('танихгүй хэв маяг дээр ойлгомжтой алдаа өгнө', async () => {
  await assert.rejects(() => rewrite('текст', 'байхгүй'), /Танихгүй хэв маяг/)
})

test('хоосон текстийг API руу илгээхгүйгээр татгалзана', async () => {
  await assert.rejects(() => rewrite('   '), /хоосон/)
  await assert.rejects(() => proofread(''), /хоосон/)
})
