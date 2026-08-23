/**
 * Хэрэглэгчийн төлөв ба давхар үйлдлээс хамгаалах түгжээ.
 *
 * Санах ойд хадгална — bot дахин эхлэхэд төлөв арилна. Энэ нь зориудын
 * шийдэл: төлөв нь зөвхөн "одоо ямар алхам дээр байна" гэдгийг илэрхийлдэг
 * богино настай мэдээлэл тул өгөгдлийн сан оруулах шаардлагагүй.
 */

const DEFAULT_TTL = 30 * 60 * 1000 // 30 минут

/**
 * @param {object} [opts]
 * @param {number} [opts.ttlMs] хэрэглэгчийн төлөв хэдэн мс амьдрах
 * @param {() => number} [opts.now] цагийн эх сурвалж (тестэд солиход зориулав)
 */
export function createStore({ ttlMs = DEFAULT_TTL, now = Date.now } = {}) {
  const states = new Map()
  const locks = new Set()

  const empty = () => ({ step: null, data: {} })

  /** Хугацаа нь дууссан бичлэгүүдийг устгана. */
  const sweep = () => {
    const cutoff = now() - ttlMs
    for (const [id, entry] of states) {
      if (entry.touched < cutoff) states.delete(id)
    }
  }

  return {
    /** Хэрэглэгчийн одоогийн төлөв. Хугацаа дууссан бол хоосон төлөв. */
    get(id) {
      sweep()
      return states.get(id)?.state ?? empty()
    },

    /** Төлвийг нэгтгэж шинэчилнэ (`data` доторх талбарууд ч нэгдэнэ). */
    set(id, patch) {
      sweep()
      const current = states.get(id)?.state ?? empty()
      const next = {
        ...current,
        ...patch,
        data: { ...current.data, ...(patch.data ?? {}) },
      }
      states.set(id, { state: next, touched: now() })
      return next
    },

    /** Төлвийг эхнээс нь эхлүүлнэ. */
    reset(id) {
      states.delete(id)
    },

    /**
     * Үйлдэл эхлүүлэхийг оролдоно.
     * @returns {boolean} `false` бол тухайн хэрэглэгчийн өмнөх үйлдэл дуусаагүй
     */
    lock(id) {
      if (locks.has(id)) return false
      locks.add(id)
      return true
    },

    unlock(id) {
      locks.delete(id)
    },

    isLocked(id) {
      return locks.has(id)
    },

    /** Идэвхтэй хэрэглэгчийн тоо — хяналтад. */
    size() {
      sweep()
      return states.size
    },
  }
}

/**
 * Товчлуурын өгөгдлийг задлана. Утга дотор цэг байж болох тул
 * зөвхөн ЭХНИЙ цэгээр таслана (жишээ нь `size:4:5`).
 */
export function parseCallback(data) {
  const s = String(data ?? '')
  const i = s.indexOf(':')
  return i < 0 ? { ns: s, value: '' } : { ns: s.slice(0, i), value: s.slice(i + 1) }
}

/**
 * Товчлуурын өгөгдөл угсарна.
 * Telegram-ын хязгаар 64 байт — хэтэрвэл товчлуур ажиллахаа болих тул
 * чимээгүй тайрахын оронд алдаа шиднэ.
 */
export function buildCallback(ns, value = '') {
  const data = value === '' ? ns : `${ns}:${value}`
  const bytes = Buffer.byteLength(data, 'utf8')
  if (bytes > 64) {
    throw new Error(`Товчлуурын өгөгдөл 64 байтаас хэтэрлээ (${bytes}): "${data}"`)
  }
  return data
}
