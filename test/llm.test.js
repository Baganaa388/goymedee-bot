import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectProvider, parseJsonReply } from '../src/text/llm.js'

// ---------- провайдер сонголт ----------

test('ANTHROPIC_API_KEY байвал Claude-г сонгоно', () => {
  const p = detectProvider({ ANTHROPIC_API_KEY: 'sk-ant-x' })
  assert.equal(p.name, 'anthropic')
  assert.equal(p.model, 'claude-opus-5')
})

test('хоёулаа байвал Claude-г эрхэмлэнэ', () => {
  const p = detectProvider({ ANTHROPIC_API_KEY: 'sk-ant-x', OPENAI_API_KEY: 'sk-o' })
  assert.equal(p.name, 'anthropic')
})

test('зөвхөн OPENAI_API_KEY байвал OpenAI-г сонгоно', () => {
  assert.equal(detectProvider({ OPENAI_API_KEY: 'sk-o' }).name, 'openai')
})

test('загварыг орчны хувьсагчаар дарж болно', () => {
  const p = detectProvider({ ANTHROPIC_API_KEY: 'x', ANTHROPIC_MODEL: 'claude-sonnet-5' })
  assert.equal(p.model, 'claude-sonnet-5')
})

test('түлхүүр байхгүй бол null буцаана', () => {
  assert.equal(detectProvider({}), null)
})

test('хоосон утгатай түлхүүрийг тохируулсанд тооцохгүй', () => {
  assert.equal(detectProvider({ ANTHROPIC_API_KEY: '   ' }), null)
})

// ---------- хариултаас JSON салгах ----------

test('цэвэр JSON-г уншина', () => {
  assert.deepEqual(parseJsonReply('{"a":1}'), { a: 1 })
})

test('```json хашилтан доторх JSON-г уншина', () => {
  assert.deepEqual(parseJsonReply('```json\n{"a":2}\n```'), { a: 2 })
})

test('нэргүй ``` хашилтыг ч уншина', () => {
  assert.deepEqual(parseJsonReply('```\n{"a":3}\n```'), { a: 3 })
})

test('тайлбар текстийн дундах JSON-г олно', () => {
  assert.deepEqual(parseJsonReply('Энд байна:\n{"a":4}\nБаярлалаа.'), { a: 4 })
})

test('JSON огт байхгүй бол null буцаана', () => {
  assert.equal(parseJsonReply('огт JSON биш хариу'), null)
})

test('эвдэрсэн JSON дээр унахгүй, null буцаана', () => {
  assert.equal(parseJsonReply('{"a": '), null)
})

test('кирилл агуулгатай JSON-г зөв уншина', () => {
  assert.deepEqual(parseJsonReply('```json\n{"засвар":"Сайн байна уу"}\n```'), {
    засвар: 'Сайн байна уу',
  })
})
