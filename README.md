# goymedee-bot

Facebook page-д зориулсан контент бэлтгэх Telegram bot.

| Үйлдэл | Тайлбар | Төлөв |
|---|---|---|
| ✨ Чанар сайжруулах | Томсгох, хурцлах, тодрол тохируулах | ✅ |
| 📐 Хэмжээ тохируулах | 4:5 · 1:1 · 16:9 · 9:16 — тайрах эсвэл бүдэг дэвсгэртэй | ✅ |
| 🎨 Branding нэмэх | 4 загвартай мэдээний карт | ✅ |
| 🔤 Үг үсгийн алдаа | Монгол хэлний хянан тохиолдуулга | 🔑 түлхүүр шаардана |
| 📝 Найруулга сайжруулах | Мэдээний хэв · Товчлох · Дэлгэрүүлэх | 🔑 түлхүүр шаардана |
| 🔗 Нийтлэл хуулах | Линкээс гарчиг, огноо, текстийг гаргана | ✅ |
| 🌐 Сайт руу нийтлэх | — | 🚧 хөгжүүлэлтэд |

## Суулгах

```bash
npm install
cp .env.example .env     # BOT_TOKEN-оо бөглөнө
```

`.env` дотор:

```
BOT_TOKEN=<@BotFather-аас авсан токен>

# Текст засах функцэд аль нэг нь шаардлагатай (заавал биш)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

Түлхүүр байхгүй үед текстийн функцууд идэвхгүй харагдана — bot бусад бүх
үйлдлээ хэвийн гүйцэтгэнэ.

## Ажиллуулах

```bash
npm run bot      # Telegram bot
npm test         # тестүүд
```

## Telegram-гүйгээр туршихлокал хэрэгсэл

```bash
node scripts/try.js providers                                    # тохиргоо шалгах
node scripts/try.js enhance assets/new-photo.jpg                 # чанар сайжруулах
node scripts/try.js resize  assets/new-photo.jpg 4:5 crop        # хэмжээ
node scripts/try.js brand   assets/new-photo.jpg "ГАРЧИГ *УЛААН*" classic
node scripts/try.js article https://ikon.mn/n/3pt5               # нийтлэл хуулах
node scripts/try.js proofread "шалгах текст"
node scripts/try.js rewrite  "засах текст" news
```

Загваруудыг зэрэг харах:

```bash
npm run preview                                    # 3 гарчиг × 4 загвар
node scripts/preview.js "ГАРЧИГ *УЛААН*" зам.jpg   # тодорхой зураг, гарчиг
```

Үр дүн `out/` дотор гарна.

## Гарчгийн онцлол

Гарчигт `*од*`-оор ороосон хэсэг **улаанаар** гарна:

```
Г.СОЛОНГО НАРЫГ *30 ХОНОГ* ЦАГДАН ХОРИВ
```

Гарчиг урт байвал фонтын хэмжээ автоматаар багасаж багтана.

## Тохиргоо — `config.json`

```json
{
  "brand":  { "name": "ГОЁ МЭДЭЭ", "tagline": "ТАНЫ ӨДРИЙН\nМЭДЭЭ", "badge": "ГОЁ МЭДЭЭ" },
  "colors": { "background": "#0c0d11", "accent": "#e01f26", "text": "#ffffff" },
  "size":   { "width": 1080, "height": 1350 },
  "frame":  { "enabled": true, "width": 3, "blur": 3, "opacity": 0.85, "inset": 24 }
}
```

| Талбар | Утга |
|---|---|
| `frame.blur` | бага → хурц шугам, их → зөөлөн |
| `frame.opacity` | их → тод |
| `frame.inset` | зургийн ирмэгээс хэдэн px дотогш |
| `frame.enabled` | `false` бол хүрээгүй |

## Бүтэц

```
src/
  render.js        branding зураг үүсгэх
  lib/             текст таслах, зурах, фонт
  templates/       classic · overlay · split · sidebar
  image/           enhance · resize · plan
  text/            llm · proofread · rewrite
  article/         extract · heuristic
  bot/             Telegram bot, цэс, урсгалууд
fonts/             Oswald · Roboto Condensed (кирилл дэмждэг)
scripts/           try.js · preview.js
```

## Тэмдэглэл

- **Фонт төсөлд хамт ирнэ.** Windows-ийн Arial Narrow, Segoe UI Black зэрэг нь
  Skia дээр кирилл үсгийг зөв гаргадаггүй, Impact-д Ө/Ү үсэг байхгүй.
- **Нийтлэл хуулах нь 2 шатлалттай.** Ерөнхий алгоритм ажиллаагүй үед
  эвристик рүү шилжинэ — ихэнх монгол сайт `<article>` таг хэрэглэдэггүй.
- **Эх зураг дор хаяж 1080px өргөн** байвал хамгийн сайн үр дүн өгнө.
