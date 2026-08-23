import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractHeuristic } from '../src/article/heuristic.js'

const PAGE = `<!doctype html>
<html><head>
  <title>Сайтын нэр — Гарчиг хуудасны толгойд</title>
  <meta property="og:title" content="Онцлох мэдээний жинхэнэ гарчиг">
  <meta property="og:image" content="https://жишээ.mn/зураг.jpg">
  <meta property="article:published_time" content="2026-08-20T09:15:00Z">
</head><body>
  <nav><p>Нүүр</p><p>Мэдээ</p><p>Холбоо барих</p></nav>
  <script>var x = "Энэ бол скрипт доторх урт текст бөгөөд гарч ирэх ёсгүй юм байна шүү дээ.";</script>
  <style>.a { content: "Загварын доторх урт текст бас гарч ирэх ёсгүй юм байна шүү дээ."; }</style>
  <div class="content">
    <p>Монгол Улсын Их Хурлын чуулганы нэгдсэн хуралдаанаар өнөөдөр хэлэлцэх асуудлыг баталлаа.</p>
    <p>Уг хуралдаанд нийт 76 гишүүнээс 64 нь оролцож, саналаа өгсөн байна&nbsp;гэж мэдэгдэв.</p>
    <p>Хэсэг</p>
    <p>Тус шийдвэр нь ирэх сарын нэгнээс эхлэн хүчин төгөлдөр болно &amp; хэрэгжиж эхэлнэ.</p>
  </div>
  <footer><p>Зохиогчийн эрх хамгаалагдсан</p></footer>
</body></html>`

test('og:title-г хуудасны <title>-ээс илүүд үзнэ', () => {
  assert.equal(extractHeuristic(PAGE).title, 'Онцлох мэдээний жинхэнэ гарчиг')
})

test('og:title байхгүй бол <title>-ээс сайтын нэрийг таслаж авна', () => {
  const html = PAGE.replace(/<meta property="og:title"[^>]*>/, '')
  assert.equal(extractHeuristic(html).title, 'Гарчиг хуудасны толгойд')
})

test('og:image болон нийтлэсэн огноог уншина', () => {
  const r = extractHeuristic(PAGE)
  assert.equal(r.image, 'https://жишээ.mn/зураг.jpg')
  assert.equal(r.published, '2026-08-20T09:15:00Z')
})

test('утга бүхий догол мөрүүдийг цуглуулна', () => {
  const text = extractHeuristic(PAGE).text
  assert.match(text, /Их Хурлын чуулганы/)
  assert.match(text, /76 гишүүнээс/)
  assert.match(text, /хүчин төгөлдөр болно/)
})

test('цэс, footer зэрэг богино догол мөрийг хаяна', () => {
  const text = extractHeuristic(PAGE).text
  for (const junk of ['Нүүр', 'Холбоо барих', 'Зохиогчийн эрх', 'Хэсэг']) {
    assert.doesNotMatch(text, new RegExp(junk), `"${junk}" орсон байна`)
  }
})

test('script болон style доторх текстийг оруулахгүй', () => {
  const text = extractHeuristic(PAGE).text
  assert.doesNotMatch(text, /скрипт доторх/)
  assert.doesNotMatch(text, /Загварын доторх/)
})

test('HTML тэмдэгтийн код (entity) задална', () => {
  const text = extractHeuristic(PAGE).text
  assert.match(text, /байна гэж мэдэгдэв/, '&nbsp; задраагүй')
  assert.match(text, /болно & хэрэгжиж/, '&amp; задраагүй')
})

test('догол мөрүүдийг хоосон мөрөөр тусгаарлана', () => {
  assert.equal(extractHeuristic(PAGE).text.split('\n\n').length, 3)
})

test('утга бүхий текстгүй хуудсанд text нь хоосон байна', () => {
  assert.equal(extractHeuristic('<html><body><p>богино</p></body></html>').text, '')
})
