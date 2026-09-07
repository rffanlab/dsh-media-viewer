// dsh-media-viewer: DeepSeek Harness plugin (Host side) v0.2
// Unified media/document preview, structured Office preview, full-text copy, and downloads.

import { createReadStream } from 'node:fs'
import { readFile, stat as diskStat } from 'node:fs/promises'
import { basename, extname } from 'node:path'

export const name = 'media-viewer'
export const inject = ['fs']

const MAX_RECENT = 40
const MAX_OPS = 5
const MAX_TEXT_BYTES = 8 * 1024 * 1024
const MAX_EXTRACT_BYTES = 64 * 1024 * 1024
const MAX_EXTRACTED_CHARS = 8 * 1024 * 1024
const MAX_SHEET_ROWS = 250
const MAX_SHEET_COLS = 80
const MAX_SHEETS = 30
const MAX_SLIDES = 200

const VIDEO_EXT = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv', 'mkv'])
const AUDIO_EXT = new Set(['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus'])
const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico', 'svg'])
const MARKDOWN_EXT = new Set(['md', 'markdown'])
const SUBTITLE_EXT = new Set(['srt', 'vtt', 'ass', 'ssa', 'lrc'])
const TEXT_EXT = new Set([
  'txt', 'log', 'json', 'jsonl', 'yaml', 'yml', 'toml', 'ini', 'conf', 'cfg',
  'csv', 'tsv', 'xml', 'html', 'htm', 'css', 'scss', 'less',
  'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'py', 'java', 'kt', 'kts',
  'c', 'h', 'cc', 'cpp', 'cxx', 'hpp', 'rs', 'go', 'rb', 'php', 'swift',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd', 'sql', 'graphql', 'gql',
  'env', 'properties', 'gradle', 'dockerfile', 'makefile'
])
const PDF_EXT = new Set(['pdf'])
const DOCX_EXT = new Set(['docx'])
const XLSX_EXT = new Set(['xlsx'])
const PPTX_EXT = new Set(['pptx'])
const DOWNLOAD_ONLY_EXT = new Set(['doc', 'rtf', 'odt', 'xls', 'ods', 'ppt', 'odp'])

const MIME = {
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/x-m4v', ogv: 'video/ogg', mkv: 'video/x-matroska',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac', opus: 'audio/opus',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp', ico: 'image/x-icon', svg: 'image/svg+xml',
  md: 'text/markdown; charset=utf-8', markdown: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8', log: 'text/plain; charset=utf-8',
  json: 'application/json; charset=utf-8', jsonl: 'application/x-ndjson; charset=utf-8', yaml: 'application/yaml; charset=utf-8', yml: 'application/yaml; charset=utf-8',
  csv: 'text/csv; charset=utf-8', tsv: 'text/tab-separated-values; charset=utf-8', xml: 'application/xml; charset=utf-8', html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8',
  srt: 'application/x-subrip; charset=utf-8', vtt: 'text/vtt; charset=utf-8', ass: 'text/plain; charset=utf-8', ssa: 'text/plain; charset=utf-8', lrc: 'text/plain; charset=utf-8',
  pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', doc: 'application/msword', rtf: 'application/rtf', odt: 'application/vnd.oasis.opendocument.text',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ods: 'application/vnd.oasis.opendocument.spreadsheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', odp: 'application/vnd.oasis.opendocument.presentation'
}

function normalizedExt(path) {
  const base = basename(String(path || '')).toLowerCase()
  if (base === 'dockerfile') return 'dockerfile'
  if (base === 'makefile') return 'makefile'
  if (base === '.env') return 'env'
  return extname(base).replace(/^\./, '')
}

export function classifyPath(path) {
  const ext = normalizedExt(path)
  if (VIDEO_EXT.has(ext)) return { kind: 'video', ext, previewable: true, copyable: false, structured: false }
  if (AUDIO_EXT.has(ext)) return { kind: 'audio', ext, previewable: true, copyable: false, structured: false }
  if (IMAGE_EXT.has(ext)) return { kind: 'image', ext, previewable: true, copyable: false, structured: false }
  if (MARKDOWN_EXT.has(ext)) return { kind: 'markdown', ext, previewable: true, copyable: true, structured: false }
  if (SUBTITLE_EXT.has(ext)) return { kind: 'subtitle', ext, previewable: true, copyable: true, structured: false }
  if (TEXT_EXT.has(ext)) return { kind: 'text', ext, previewable: true, copyable: true, structured: false }
  if (PDF_EXT.has(ext)) return { kind: 'pdf', ext, previewable: true, copyable: true, structured: false }
  if (DOCX_EXT.has(ext)) return { kind: 'docx', ext, previewable: true, copyable: true, structured: false }
  if (XLSX_EXT.has(ext)) return { kind: 'xlsx', ext, previewable: true, copyable: true, structured: true }
  if (PPTX_EXT.has(ext)) return { kind: 'pptx', ext, previewable: true, copyable: true, structured: true }
  if (DOWNLOAD_ONLY_EXT.has(ext)) return { kind: 'document', ext, previewable: false, copyable: false, structured: false }
  return { kind: 'unknown', ext, previewable: false, copyable: false, structured: false }
}

export function mimeOf(path) {
  const ext = normalizedExt(path)
  return MIME[ext] || 'application/octet-stream'
}

export function parseRange(rangeHeader, size) {
  if (!rangeHeader || !/^bytes=/i.test(rangeHeader) || !Number.isFinite(size) || size <= 0) return null
  const value = String(rangeHeader).replace(/^bytes=/i, '').split(',')[0].trim()
  const m = /^(\d*)-(\d*)$/.exec(value)
  if (!m) return { invalid: true }
  let start
  let end
  if (m[1] === '' && m[2] !== '') {
    const suffix = Number(m[2])
    if (!Number.isFinite(suffix) || suffix <= 0) return { invalid: true }
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(m[1])
    end = m[2] === '' ? size - 1 : Number(m[2])
    if (!Number.isFinite(start) || !Number.isFinite(end)) return { invalid: true }
  }
  if (start < 0 || end < start || start >= size) return { invalid: true }
  end = Math.min(end, size - 1)
  return { start, end }
}

function mtimeOf(info) {
  try {
    if (typeof info?.mtimeMs === 'number') return info.mtimeMs
    if (typeof info?.mtime === 'number') return info.mtime
    if (info?.mtime instanceof Date) return info.mtime.getTime()
    if (info?.updatedAt instanceof Date) return info.updatedAt.getTime()
  } catch {}
  return 0
}

function opFromActor(actor) {
  try {
    const n = String(actor?.name || actor?.toolName || '').toLowerCase()
    if (!n) return null
    if (n.includes('write')) return 'write'
    if (n.includes('edit')) return 'edit'
    if (n.includes('delete') || n.includes('remove')) return 'delete'
    if (n.includes('read')) return 'read'
  } catch {}
  return null
}

function sessionIdOf(exec) {
  try {
    const session = exec?.agent?.session
    if (!session) return undefined
    const id = typeof session.id === 'string' ? session.id : session.header?.id || session.sessionId
    return typeof id === 'string' && id ? id : undefined
  } catch { return undefined }
}

function safeFilename(value) {
  return basename(String(value || 'download')).replace(/[\r\n\0"]/g, '_') || 'download'
}

function contentDisposition(filename, attachment) {
  const ascii = safeFilename(filename).replace(/[^\x20-\x7E]/g, '_')
  const encoded = encodeURIComponent(safeFilename(filename)).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
  return `${attachment ? 'attachment' : 'inline'}; filename="${ascii}"; filename*=UTF-8''${encoded}`
}

function json(res, status, value, extraHeaders = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders })
  res.end(JSON.stringify(value))
}

function limitText(text) {
  const s = String(text ?? '')
  if (s.length <= MAX_EXTRACTED_CHARS) return s
  return s.slice(0, MAX_EXTRACTED_CHARS) + '\n\n[内容过长，已截断]'
}

export function decodeXmlText(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

export function extractPptxTextRuns(xml) {
  const out = []
  const re = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g
  let m
  while ((m = re.exec(String(xml || '')))) {
    const text = decodeXmlText(m[1]).trim()
    if (text) out.push(text)
  }
  return out
}

function cellText(value) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map((x) => x?.text || '').join('')
    if (typeof value.text === 'string') return value.text
    if (Object.prototype.hasOwnProperty.call(value, 'result')) return cellText(value.result)
    if (typeof value.formula === 'string') return '=' + value.formula
    if (typeof value.error === 'string') return value.error
    if (typeof value.hyperlink === 'string') return value.text ? String(value.text) : value.hyperlink
    try { return JSON.stringify(value) } catch { return String(value) }
  }
  return String(value)
}

async function extractPdfText(diskPath) {
  const buf = await readFile(diskPath)
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) })
  const doc = await loadingTask.promise
  try {
    const pages = []
    let chars = 0
    for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
      const page = await doc.getPage(pageNo)
      const tc = await page.getTextContent()
      let line = ''
      const lines = []
      for (const item of tc.items || []) {
        if (!item || typeof item.str !== 'string') continue
        line += item.str
        if (item.hasEOL) {
          lines.push(line)
          line = ''
        } else {
          line += ' '
        }
      }
      if (line.trim()) lines.push(line.trimEnd())
      const pageText = lines.join('\n')
      pages.push(pageText)
      chars += pageText.length
      if (chars > MAX_EXTRACTED_CHARS) break
    }
    return limitText(pages.join('\n\n'))
  } finally {
    try { await doc.destroy() } catch {}
  }
}

async function extractDocxText(diskPath) {
  const mammothMod = await import('mammoth')
  const mammoth = mammothMod.default || mammothMod
  const result = await mammoth.extractRawText({ path: diskPath })
  return limitText(result?.value || '')
}

async function loadWorkbook(diskPath) {
  const excelMod = await import('exceljs')
  const ExcelJS = excelMod.default || excelMod
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(diskPath)
  return workbook
}

async function extractXlsxText(diskPath) {
  const workbook = await loadWorkbook(diskPath)
  const parts = []
  let chars = 0
  for (const ws of workbook.worksheets.slice(0, MAX_SHEETS)) {
    const header = `## ${ws.name}`
    parts.push(header)
    chars += header.length
    const rowCount = Math.max(0, ws.actualRowCount || ws.rowCount || 0)
    const colCount = Math.max(0, ws.actualColumnCount || ws.columnCount || 0)
    for (let r = 1; r <= rowCount; r += 1) {
      const row = ws.getRow(r)
      const cells = []
      for (let c = 1; c <= colCount; c += 1) cells.push(cellText(row.getCell(c).value))
      while (cells.length && cells[cells.length - 1] === '') cells.pop()
      const line = cells.join('\t')
      parts.push(line)
      chars += line.length + 1
      if (chars > MAX_EXTRACTED_CHARS) return limitText(parts.join('\n'))
    }
    parts.push('')
  }
  return limitText(parts.join('\n'))
}

async function extractXlsxPreview(diskPath) {
  const workbook = await loadWorkbook(diskPath)
  const sheets = []
  let workbookTruncated = workbook.worksheets.length > MAX_SHEETS
  for (const ws of workbook.worksheets.slice(0, MAX_SHEETS)) {
    const totalRows = Math.max(0, ws.actualRowCount || ws.rowCount || 0)
    const totalCols = Math.max(0, ws.actualColumnCount || ws.columnCount || 0)
    const rowLimit = Math.min(totalRows, MAX_SHEET_ROWS)
    const colLimit = Math.min(totalCols, MAX_SHEET_COLS)
    const rows = []
    for (let r = 1; r <= rowLimit; r += 1) {
      const row = ws.getRow(r)
      const values = []
      for (let c = 1; c <= colLimit; c += 1) values.push(cellText(row.getCell(c).value))
      rows.push(values)
    }
    const truncated = totalRows > rowLimit || totalCols > colLimit
    workbookTruncated = workbookTruncated || truncated
    sheets.push({ name: ws.name, rowCount: totalRows, columnCount: totalCols, rows, truncated })
  }
  return { kind: 'xlsx', sheetCount: workbook.worksheets.length, sheets, truncated: workbookTruncated }
}

async function loadPptxSlides(diskPath, includePreview = false) {
  const jszipMod = await import('jszip')
  const JSZip = jszipMod.default || jszipMod
  const zip = await JSZip.loadAsync(await readFile(diskPath))
  const names = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0) - Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0))
  const slides = []
  const parts = []
  let chars = 0
  for (const name of names.slice(0, MAX_SLIDES)) {
    const xml = await zip.file(name).async('string')
    const texts = extractPptxTextRuns(xml)
    const number = Number(name.match(/slide(\d+)\.xml/i)?.[1] || slides.length + 1)
    const slideText = texts.join('\n')
    if (includePreview) slides.push({ number, title: texts[0] || `Slide ${number}`, texts, text: slideText })
    parts.push(`## Slide ${number}\n${slideText}`)
    chars += slideText.length
    if (!includePreview && chars > MAX_EXTRACTED_CHARS) break
  }
  return {
    text: limitText(parts.join('\n\n')),
    preview: { kind: 'pptx', slideCount: names.length, slides, truncated: names.length > MAX_SLIDES }
  }
}

async function extractPptxText(diskPath) {
  return (await loadPptxSlides(diskPath, false)).text
}

async function extractPptxPreview(diskPath) {
  return (await loadPptxSlides(diskPath, true)).preview
}

async function extractText(ctx, target, display, info) {
  const type = classifyPath(display)
  if (!type.copyable) throw Object.assign(new Error('该文件类型不支持提取文本'), { statusCode: 415 })
  const size = typeof info?.size === 'number' ? info.size : 0
  if (type.kind === 'markdown' || type.kind === 'text' || type.kind === 'subtitle') {
    if (size > MAX_TEXT_BYTES) throw Object.assign(new Error('文本文件过大，预览/复制上限为 8MB'), { statusCode: 413 })
    return String(await ctx.fs.readText(target))
  }
  if (size > MAX_EXTRACT_BYTES) throw Object.assign(new Error('文档过大，文本提取上限为 64MB'), { statusCode: 413 })
  const disk = String(target?.displayPath || display)
  if (type.kind === 'pdf') return extractPdfText(disk)
  if (type.kind === 'docx') return extractDocxText(disk)
  if (type.kind === 'xlsx') return extractXlsxText(disk)
  if (type.kind === 'pptx') return extractPptxText(disk)
  throw Object.assign(new Error('该文件类型暂不支持提取文本'), { statusCode: 415 })
}

async function structuredPreview(target, display, info) {
  const type = classifyPath(display)
  if (!type.structured) throw Object.assign(new Error('该文件类型没有结构化预览'), { statusCode: 415 })
  const size = typeof info?.size === 'number' ? info.size : 0
  if (size > MAX_EXTRACT_BYTES) throw Object.assign(new Error('文档过大，结构化预览上限为 64MB'), { statusCode: 413 })
  const disk = String(target?.displayPath || display)
  if (type.kind === 'xlsx') return extractXlsxPreview(disk)
  if (type.kind === 'pptx') return extractPptxPreview(disk)
  throw Object.assign(new Error('该文件类型没有结构化预览'), { statusCode: 415 })
}

export function apply(ctx) {
  const recent = []

  function cwdOf(sessionId) {
    try {
      const sessions = ctx.get('sessions')
      if (!sessions || !sessionId) return undefined
      const session = sessions.get(String(sessionId))
      const h = session?.header
      const cwd = h?.meta?.cwd || h?.cwd || session?.meta?.cwd || session?.cwd
      return typeof cwd === 'string' ? cwd : undefined
    } catch { return undefined }
  }

  async function resolveTarget(path, sessionId) {
    const cwd = cwdOf(sessionId)
    const target = await ctx.fs.resolve(path, cwd ? { cwd } : {})
    let display = String(path)
    try { display = ctx.fs.processPath(target) } catch {}
    return { target, display, cwd }
  }

  function record(path, op, mtime, sessionId) {
    const cls = classifyPath(path)
    if (cls.kind === 'unknown') return null
    let entry = recent.find((f) => f.path === path)
    if (!entry) entry = { path, time: 0, mtime: 0, ops: [], sessions: new Set() }
    entry.time = Date.now()
    if (mtime) entry.mtime = mtime
    if (sessionId) entry.sessions.add(String(sessionId))
    if (op) {
      const now = Date.now()
      const last = entry.ops[0]
      if (last && last.op === op && now - last.time < 10000) last.time = now
      else {
        entry.ops.unshift({ op, time: now })
        if (entry.ops.length > MAX_OPS) entry.ops.length = MAX_OPS
      }
    }
    const i = recent.indexOf(entry)
    if (i >= 0) recent.splice(i, 1)
    recent.unshift(entry)
    if (recent.length > MAX_RECENT) recent.length = MAX_RECENT
    return entry
  }

  ctx.on('fs/observed', (target, observation, actor) => {
    try {
      const path = target && (target.displayPath || target.path)
      if (typeof path !== 'string' || classifyPath(path).kind === 'unknown') return
      let op = opFromActor(actor)
      if (observation?.kind === 'absent') op = 'delete'
      const entry = record(path, op, 0, sessionIdOf(actor))
      if (!entry) return
      Promise.resolve().then(async () => {
        try {
          const resolved = await ctx.fs.resolve(path)
          const info = await ctx.fs.stat(resolved)
          const mt = mtimeOf(info)
          if (mt) entry.mtime = mt
        } catch {}
      }).catch(() => {})
    } catch {}
  })

  ctx.inject(['webServer'], (wctx) => {
    wctx.effect(() => {
      const disposers = []

      disposers.push(wctx.webServer.register({
        kind: 'exact', path: '/media-viewer/api/recent',
        handler: async (req, res) => {
          if (req.method !== 'GET') { res.writeHead(405); res.end(); return }
          const url = new URL(req.url ?? '/media-viewer/api/recent', 'http://127.0.0.1')
          const sessionId = (url.searchParams.get('sessionId') || '').trim().slice(0, 256)
          const cwd = cwdOf(sessionId)
          const prefix = cwd ? (cwd.endsWith('/') ? cwd : cwd + '/') : null
          const files = recent.filter((f) => {
            if (sessionId) return f.sessions.has(sessionId)
            if (!prefix) return true
            return f.path === cwd || f.path.startsWith(prefix)
          }).map((f) => {
            const cls = classifyPath(f.path)
            return {
              path: f.path,
              rel: prefix && f.path.startsWith(prefix) ? f.path.slice(prefix.length) : null,
              time: f.time,
              mtime: f.mtime || 0,
              ops: f.ops.map((o) => ({ op: o.op, time: o.time })),
              kind: cls.kind,
              ext: cls.ext,
              previewable: cls.previewable,
              copyable: cls.copyable,
              structured: cls.structured
            }
          })
          json(res, 200, { files, scoped: Boolean(sessionId) })
        }
      }))

      disposers.push(wctx.webServer.register({
        kind: 'exact', path: '/media-viewer/api/meta',
        handler: async (req, res) => {
          if (req.method !== 'GET') { res.writeHead(405); res.end(); return }
          const url = new URL(req.url ?? '/media-viewer/api/meta', 'http://127.0.0.1')
          const path = (url.searchParams.get('path') || '').slice(0, 4096)
          const sessionId = (url.searchParams.get('sessionId') || '').trim().slice(0, 256)
          if (!path) { json(res, 400, { ok: false, error: 'missing path' }); return }
          try {
            const { target, display } = await resolveTarget(path, sessionId)
            const info = await ctx.fs.stat(target)
            if (!info) { json(res, 404, { ok: false, error: 'file not found' }); return }
            const cls = classifyPath(display)
            record(display, 'read', mtimeOf(info), sessionId)
            json(res, 200, {
              ok: true, path: display, name: basename(display), size: Number(info.size || 0),
              mtime: mtimeOf(info), mime: mimeOf(display), ...cls
            })
          } catch (e) {
            json(res, e?.statusCode || 500, { ok: false, error: String(e?.message || e) })
          }
        }
      }))

      disposers.push(wctx.webServer.register({
        kind: 'exact', path: '/media-viewer/api/text',
        handler: async (req, res) => {
          if (req.method !== 'GET') { res.writeHead(405); res.end(); return }
          const url = new URL(req.url ?? '/media-viewer/api/text', 'http://127.0.0.1')
          const path = (url.searchParams.get('path') || '').slice(0, 4096)
          const sessionId = (url.searchParams.get('sessionId') || '').trim().slice(0, 256)
          if (!path) { json(res, 400, { ok: false, error: 'missing path' }); return }
          try {
            const { target, display } = await resolveTarget(path, sessionId)
            const info = await ctx.fs.stat(target)
            if (!info) { json(res, 404, { ok: false, error: 'file not found' }); return }
            const text = await extractText(ctx, target, display, info)
            record(display, 'read', mtimeOf(info), sessionId)
            json(res, 200, { ok: true, path: display, text })
          } catch (e) {
            json(res, e?.statusCode || 500, { ok: false, error: String(e?.message || e) })
          }
        }
      }))

      disposers.push(wctx.webServer.register({
        kind: 'exact', path: '/media-viewer/api/structured',
        handler: async (req, res) => {
          if (req.method !== 'GET') { res.writeHead(405); res.end(); return }
          const url = new URL(req.url ?? '/media-viewer/api/structured', 'http://127.0.0.1')
          const path = (url.searchParams.get('path') || '').slice(0, 4096)
          const sessionId = (url.searchParams.get('sessionId') || '').trim().slice(0, 256)
          if (!path) { json(res, 400, { ok: false, error: 'missing path' }); return }
          try {
            const { target, display } = await resolveTarget(path, sessionId)
            const info = await ctx.fs.stat(target)
            if (!info) { json(res, 404, { ok: false, error: 'file not found' }); return }
            const data = await structuredPreview(target, display, info)
            record(display, 'read', mtimeOf(info), sessionId)
            json(res, 200, { ok: true, path: display, data })
          } catch (e) {
            json(res, e?.statusCode || 500, { ok: false, error: String(e?.message || e) })
          }
        }
      }))

      disposers.push(wctx.webServer.register({
        kind: 'exact', path: '/media-viewer/api/peek',
        handler: async (req, res) => {
          if (req.method !== 'GET') { res.writeHead(405); res.end(); return }
          const url = new URL(req.url ?? '/media-viewer/api/peek', 'http://127.0.0.1')
          const path = (url.searchParams.get('path') || '').slice(0, 4096)
          const sessionId = (url.searchParams.get('sessionId') || '').trim().slice(0, 256)
          if (!path) { json(res, 400, { ok: false, error: 'missing path' }); return }
          try {
            const { target, display } = await resolveTarget(path, sessionId)
            const info = await ctx.fs.stat(target)
            if (!info) { json(res, 404, { ok: false, error: 'file not found' }); return }
            const cls = classifyPath(display)
            let snippet = ''
            let title = ''
            if (cls.kind === 'markdown' || cls.kind === 'text' || cls.kind === 'subtitle') {
              let buf = ''
              const stream = await ctx.fs.streamText(target)
              for await (const chunk of stream) {
                buf += chunk
                if (buf.length > 1800) break
              }
              const lines = String(buf).split('\n').map((l) => l.trim())
              if (cls.kind === 'markdown') {
                const h = lines.find((l) => /^#\s+/.test(l))
                if (h) title = h.replace(/^#\s+/, '').slice(0, 120)
              }
              snippet = (lines.find((l) => l && !/^#|^```|^>|^[-*]\s|^\|/.test(l)) || '').slice(0, 180)
            }
            json(res, 200, { ok: true, title, snippet, kind: cls.kind })
          } catch (e) {
            json(res, 500, { ok: false, error: String(e?.message || e) })
          }
        }
      }))

      disposers.push(wctx.webServer.register({
        kind: 'exact', path: '/media-viewer/api/content',
        handler: async (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return }
          const url = new URL(req.url ?? '/media-viewer/api/content', 'http://127.0.0.1')
          const path = (url.searchParams.get('path') || '').slice(0, 4096)
          const sessionId = (url.searchParams.get('sessionId') || '').trim().slice(0, 256)
          const download = url.searchParams.get('download') === '1'
          if (!path) { res.writeHead(400); res.end('missing path'); return }
          try {
            const { target, display } = await resolveTarget(path, sessionId)
            const info = await ctx.fs.stat(target)
            if (!info) { res.writeHead(404); res.end('not found'); return }
            const disk = String(target?.displayPath || display)
            const st = await diskStat(disk)
            if (!st.isFile()) { res.writeHead(415); res.end('not a file'); return }
            const size = st.size
            const range = parseRange(req.headers?.range, size)
            const headers = {
              'content-type': mimeOf(display),
              'accept-ranges': 'bytes',
              'x-content-type-options': 'nosniff',
              'cache-control': 'private, max-age=60',
              'content-disposition': contentDisposition(display, download)
            }
            record(display, 'read', st.mtimeMs, sessionId)
            if (range?.invalid) {
              res.writeHead(416, { ...headers, 'content-range': `bytes */${size}` })
              res.end()
              return
            }
            if (range) {
              const length = range.end - range.start + 1
              res.writeHead(206, { ...headers, 'content-range': `bytes ${range.start}-${range.end}/${size}`, 'content-length': length })
              if (req.method === 'HEAD') { res.end(); return }
              const stream = createReadStream(disk, { start: range.start, end: range.end })
              stream.on('error', () => { try { res.destroy() } catch {} })
              stream.pipe(res)
              return
            }
            res.writeHead(200, { ...headers, 'content-length': size })
            if (req.method === 'HEAD') { res.end(); return }
            const stream = createReadStream(disk)
            stream.on('error', () => { try { res.destroy() } catch {} })
            stream.pipe(res)
          } catch (e) {
            res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
            res.end(String(e?.message || e))
          }
        }
      }))

      return () => { for (const dispose of disposers) try { dispose() } catch {} }
    })
  })
}

export const _test = { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns }
