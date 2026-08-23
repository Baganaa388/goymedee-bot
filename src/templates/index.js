import * as classic from './classic.js'
import * as overlay from './overlay.js'
import * as split from './split.js'
import * as sidebar from './sidebar.js'

/** Боломжит бүх загварууд. Түлхүүр нь bot дээр ашиглагдах нэр. */
export const templates = { classic, overlay, split, sidebar }
export const templateNames = Object.keys(templates)
