import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseHighlights } from '../src/lib/text.js'

test('гол текстийг нэг энгийн хэсэг болгож буцаана', () => {
  assert.deepEqual(parseHighlights('САЙН БАЙНА УУ'), [
    { text: 'САЙН БАЙНА УУ', highlight: false },
  ])
})

test('*одоор* ороосон хэсгийг онцлолт болгоно', () => {
  assert.deepEqual(parseHighlights('НАРЫГ *30 ХОНОГ* ХОРИВ'), [
    { text: 'НАРЫГ ', highlight: false },
    { text: '30 ХОНОГ', highlight: true },
    { text: ' ХОРИВ', highlight: false },
  ])
})

test('олон онцлолтыг тус тусад нь салгана', () => {
  assert.deepEqual(parseHighlights('*А* ба *Б*'), [
    { text: 'А', highlight: true },
    { text: ' ба ', highlight: false },
    { text: 'Б', highlight: true },
  ])
})

test('хосгүй үлдсэн одыг энгийн тэмдэгт болгож үлдээнэ', () => {
  assert.deepEqual(parseHighlights('5 * 3 = 15'), [
    { text: '5 * 3 = 15', highlight: false },
  ])
})

test('хоосон онцлолт (**) хаягдана', () => {
  assert.deepEqual(parseHighlights('А**Б'), [{ text: 'АБ', highlight: false }])
})
