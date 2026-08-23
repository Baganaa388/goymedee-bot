import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseUrl } from '../src/article/extract.js'

test('зөв хаягийг хүлээж авна', () => {
  assert.equal(parseUrl('https://ikon.mn/n/3pt5').hostname, 'ikon.mn')
  assert.equal(parseUrl('  http://news.mn/r/1  ').protocol, 'http:')
})

test('хаяг биш текст дээр ойлгомжтой алдаа өгнө', () => {
  assert.throws(() => parseUrl('энэ хаяг биш'), /Хаяг буруу байна/)
})

test('http, https биш протоколыг татгалзана', () => {
  assert.throws(() => parseUrl('ftp://жишээ.mn/файл'), /Зөвхөн http/)
  assert.throws(() => parseUrl('file:///C:/нууц.txt'), /Зөвхөн http/)
})

test('дотоод сүлжээний хаягийг татгалзана', () => {
  for (const u of [
    'http://localhost:8080/admin',
    'http://127.0.0.1/',
    'http://192.168.1.1/',
    'http://10.0.0.5/',
    'http://172.16.0.1/',
  ]) {
    assert.throws(() => parseUrl(u), /Дотоод сүлжээ/, u)
  }
})
