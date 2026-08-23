import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseHighlights, wrapSegments } from '../src/lib/text.js'

// Тестийн хялбар хэмжигч: тэмдэгт бүр 10px
const measure = (s) => s.length * 10

test('багтах текстийг нэг мөрөнд үлдээнэ', () => {
  assert.deepEqual(wrapSegments(parseHighlights('АА ББ'), measure, 1000), [
    [{ text: 'АА ББ', highlight: false }],
  ])
})

test('өргөнд багтахгүй үед үгийн зааг дээр таслана', () => {
  assert.deepEqual(wrapSegments(parseHighlights('ААА БББ ВВВ'), measure, 50), [
    [{ text: 'ААА', highlight: false }],
    [{ text: 'БББ', highlight: false }],
    [{ text: 'ВВВ', highlight: false }],
  ])
})

test('нэг мөрөнд онцлолт болон энгийн хэсгийг тусад нь хадгална', () => {
  assert.deepEqual(wrapSegments(parseHighlights('НАРЫГ *30 ХОНОГ* ХОРИВ'), measure, 1000), [
    [
      { text: 'НАРЫГ ', highlight: false },
      { text: '30 ХОНОГ ', highlight: true },
      { text: 'ХОРИВ', highlight: false },
    ],
  ])
})

test('мөр дамжсан ч онцлолтын төлөв хадгалагдана', () => {
  assert.deepEqual(wrapSegments(parseHighlights('ААА *БББ ВВВ*'), measure, 70), [
    [
      { text: 'ААА ', highlight: false },
      { text: 'БББ', highlight: true },
    ],
    [{ text: 'ВВВ', highlight: true }],
  ])
})

test('мөрөнд багтахгүй урт үгийг таслалгүй ганцаар нь мөрөнд байрлуулна', () => {
  assert.deepEqual(wrapSegments(parseHighlights('ААААААА ББ'), measure, 30), [
    [{ text: 'ААААААА', highlight: false }],
    [{ text: 'ББ', highlight: false }],
  ])
})

test('олон зайг нэг болгож цэвэрлэнэ', () => {
  assert.deepEqual(wrapSegments(parseHighlights('  АА   ББ  '), measure, 1000), [
    [{ text: 'АА ББ', highlight: false }],
  ])
})
