/**
 * Хэлний загварын нийтлэг давхарга.
 * Claude болон OpenAI хоёуланг дэмжинэ — `.env` дотор ямар түлхүүр байгаагаас
 * хамаарч автоматаар сонгоно. Аль нь ч байхгүй бол текстийн функцууд
 * унтраалттай болох ба bot энэ талаар тодорхой мэдэгдэнэ.
 */

const DEFAULT_MODELS = {
  anthropic: 'claude-opus-5',
  openai: 'gpt-4o',
}

const filled = (v) => typeof v === 'string' && v.trim().length > 0

/**
 * Орчны хувьсагчаас ашиглах провайдерыг тодорхойлно.
 * @param {Record<string, string|undefined>} [env=process.env]
 * @returns {{name: 'anthropic'|'openai', key: string, model: string}|null}
 */
export function detectProvider(env = process.env) {
  if (filled(env.ANTHROPIC_API_KEY)) {
    return {
      name: 'anthropic',
      key: env.ANTHROPIC_API_KEY.trim(),
      model: filled(env.ANTHROPIC_MODEL) ? env.ANTHROPIC_MODEL.trim() : DEFAULT_MODELS.anthropic,
    }
  }
  if (filled(env.OPENAI_API_KEY)) {
    return {
      name: 'openai',
      key: env.OPENAI_API_KEY.trim(),
      model: filled(env.OPENAI_MODEL) ? env.OPENAI_MODEL.trim() : DEFAULT_MODELS.openai,
    }
  }
  return null
}

/**
 * Загварын хариултаас JSON-г салгана.
 * Загварууд JSON-г ``` хашилтанд эсвэл тайлбар текстийн дунд буцаах нь элбэг тул
 * шууд `JSON.parse` хийхэд найдвартай биш.
 * @returns {object|null}
 */
export function parseJsonReply(text) {
  if (typeof text !== 'string') return null
  const candidates = []

  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  if (fenced) candidates.push(fenced[1])
  candidates.push(text)

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1))
  }

  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c.trim())
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      // дараагийн хувилбарыг үзнэ
    }
  }
  return null
}

/** Текстийн функцууд ашиглах боломжтой эсэх. */
export function isTextEnabled(env = process.env) {
  return detectProvider(env) !== null
}

/** Ямар провайдер ашиглаж байгааг хүнд ойлгомжтой бичих. */
export function providerLabel(env = process.env) {
  const p = detectProvider(env)
  if (!p) return 'тохируулаагүй'
  return p.name === 'anthropic' ? `Claude (${p.model})` : `OpenAI (${p.model})`
}

let clientCache = null

async function getClient(provider) {
  if (clientCache?.name === provider.name && clientCache.key === provider.key) {
    return clientCache.client
  }
  const client =
    provider.name === 'anthropic'
      ? new (await import('@anthropic-ai/sdk')).default({ apiKey: provider.key })
      : new (await import('openai')).default({ apiKey: provider.key })

  clientCache = { name: provider.name, key: provider.key, client }
  return client
}

/**
 * Загвар руу нэг хүсэлт илгээж, текст хариу авна.
 *
 * Урт оролт/гаралт дээр HTTP timeout-д унахаас сэргийлж урсгалаар (stream)
 * ажиллана.
 *
 * @param {object} opts
 * @param {string} opts.system систем зааварчилгаа
 * @param {string} opts.user хэрэглэгчийн текст
 * @param {number} [opts.maxTokens=16000]
 * @param {number} [opts.timeout=90000] миллисекунд
 * @returns {Promise<string>}
 */
export async function complete({ system, user, maxTokens = 16000, timeout = 90000 }) {
  const provider = detectProvider()
  if (!provider) {
    throw new Error(
      'Текст засах функц идэвхгүй байна. `.env` файлд ANTHROPIC_API_KEY эсвэл ' +
        'OPENAI_API_KEY тохируулна уу.',
    )
  }

  const client = await getClient(provider)
  const signal = AbortSignal.timeout(timeout)

  if (provider.name === 'anthropic') {
    const stream = client.messages.stream(
      {
        model: provider.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      },
      { signal },
    )
    const message = await stream.finalMessage()
    return message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
  }

  const res = await client.chat.completions.create(
    {
      model: provider.model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    },
    { signal },
  )
  return (res.choices[0]?.message?.content ?? '').trim()
}
