// dsh-media-viewer: DeepSeek Harness media enhancement plugin (Host) v0.3.0
// DSH 0.2.x owns document preview/navigation. This Host only provides
// session-scoped media metadata and HTTP byte-range streaming.

import { createReadStream } from 'node:fs'
import { stat as diskStat } from 'node:fs/promises'
import { basename, extname, isAbsolute, dirname } from 'node:path'

export const name = 'media-viewer'
export const inject = ['fs']

const VIDEO_EXT = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv', 'mkv'])
const AUDIO_EXT = new Set(['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus'])
const SUBTITLE_EXT = new Set(['srt', 'vtt', 'ass', 'ssa', 'lrc'])

const MIME = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  ogv: 'video/ogg',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  opus: 'audio/opus',
  srt: 'application/x-subrip; charset=utf-8',
  vtt: 'text/vtt; charset=utf-8',
  ass: 'text/plain; charset=utf-8',
  ssa: 'text/plain; charset=utf-8',
  lrc: 'text/plain; charset=utf-8'
}

function normalizedExt(path) {
  return extname(basename(String(path || '')).toLowerCase()).replace(/^\./, '')
}

export function classifyPath(path) {
  const ext = normalizedExt(path)
  if (VIDEO_EXT.has(ext)) return { kind: 'video', ext }
  if (AUDIO_EXT.has(ext)) return { kind: 'audio', ext }
  if (SUBTITLE_EXT.has(ext)) return { kind: 'subtitle', ext }
  return { kind: 'unknown', ext }
}

export function mimeOf(path) {
  return MIME[normalizedExt(path)] || 'application/octet-stream'
}

export function parseRange(rangeHeader, size) {
  if (!rangeHeader || !/^bytes=/i.test(rangeHeader) || !Number.isFinite(size) || size <= 0) return null
  const value = String(rangeHeader).replace(/^bytes=/i, '').split(',')[0].trim()
  const match = /^(\d*)-(\d*)$/.exec(value)
  if (!match) return { invalid: true }
  let start
  let end
  if (match[1] === '' && match[2] !== '') {
    const suffix = Number(match[2])
    if (!Number.isFinite(suffix) || suffix <= 0) return { invalid: true }
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] === '' ? size - 1 : Number(match[2])
    if (!Number.isFinite(start) || !Number.isFinite(end)) return { invalid: true }
  }
  if (start < 0 || end < start || start >= size) return { invalid: true }
  return { start, end: Math.min(end, size - 1) }
}

const PATH_EDGE_JUNK = /[\s\u00A0\u1680\u180E\u2000-\u200F\u2028-\u202F\u205F\u2060-\u206F\u3000\uFEFF]/
const PATH_FORMAT_JUNK = /[\u00AD\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/

export function sanitizePathInput(value) {
  let text = String(value == null ? '' : value)
  const edge = new RegExp('^' + PATH_EDGE_JUNK.source + '+|' + PATH_EDGE_JUNK.source + '+$', 'g')
  text = text.replace(edge, '')
  // Repair one path visually wrapped immediately after a separator.
  text = text.replace(/([/\\])[ \t\f\v]*\r?\n[ \t\f\v]*/g, '$1')
  const after = new RegExp('([/\\\\])' + PATH_FORMAT_JUNK.source + '+', 'g')
  const before = new RegExp(PATH_FORMAT_JUNK.source + '+(?=[/\\\\])', 'g')
  text = text.replace(after, '$1').replace(before, '')
  text = text.replace(/([/\\])[ \t]+(?=\.dsh-runs(?:[/\\]|$))/g, '$1')
  return text.replace(edge, '')
}

export function redundantProjectPrefixParentCwd(requestedPath, cwd) {
  if (typeof requestedPath !== 'string' || typeof cwd !== 'string' || !requestedPath || !cwd) return undefined
  if (isAbsolute(requestedPath)) return undefined
  const normalized = requestedPath.replace(/\\/g, '/').replace(/^\.\/+/, '')
  const first = normalized.split('/').filter(Boolean)[0]
  const cwdBase = basename(cwd.replace(/[\\/]+$/, ''))
  if (!first || !cwdBase || first !== cwdBase) return undefined
  return dirname(cwd)
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

function safeFilename(value) {
  return basename(String(value || 'download')).replace(/[\r\n\0"]/g, '_') || 'download'
}

function contentDisposition(filename, attachment) {
  const safe = safeFilename(filename)
  const ascii = safe.replace(/[^\x20-\x7E]/g, '_')
  const encoded = encodeURIComponent(safe).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
  return (attachment ? 'attachment' : 'inline') + '; filename="' + ascii + '"; filename*=UTF-8\'\'' + encoded
}

function json(res, status, value) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store',
    'x-content-type-options': 'nosniff'
  })
  res.end(JSON.stringify(value))
}

export function apply(ctx) {
  function cwdOf(sessionId) {
    try {
      const sessions = ctx.get('sessions')
      if (!sessions || !sessionId) return undefined
      const session = sessions.get(String(sessionId))
      const header = session?.header
      const cwd = header?.meta?.cwd || header?.cwd || session?.meta?.cwd || session?.cwd
      return typeof cwd === 'string' ? cwd : undefined
    } catch {
      return undefined
    }
  }

  async function resolveTarget(rawPath, sessionId) {
    if (!sessionId) throw Object.assign(new Error('missing sessionId'), { statusCode: 400 })
    const requested = sanitizePathInput(rawPath)
    if (!requested) throw Object.assign(new Error('missing path'), { statusCode: 400 })
    const cwd = cwdOf(sessionId)
    let target = await ctx.fs.resolve(requested, cwd ? { cwd } : {})

    // Keep the conservative compatibility fallback from v0.2.x for DSH cards
    // that redundantly prefix the current project directory.
    if (cwd && !isAbsolute(requested)) {
      let exists = false
      try { exists = Boolean(await ctx.fs.stat(target)) } catch {}
      if (!exists) {
        const parent = redundantProjectPrefixParentCwd(requested, cwd)
        if (parent) {
          try {
            const fallback = await ctx.fs.resolve(requested, { cwd: parent })
            if (await ctx.fs.stat(fallback)) target = fallback
          } catch {}
        }
      }
    }

    let display = requested
    try { display = ctx.fs.processPath(target) } catch {}
    return { target, display }
  }

  ctx.inject(['webServer'], function (scope) {
    scope.effect(function () {
      const disposers = []

      disposers.push(scope.webServer.register({
        kind: 'exact',
        path: '/media-viewer/api/meta',
        handler: async function (req, res) {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405)
            res.end()
            return
          }
          const url = new URL(req.url || '/media-viewer/api/meta', 'http://127.0.0.1')
          const path = (url.searchParams.get('path') || '').slice(0, 8192)
          const sessionId = (url.searchParams.get('sessionId') || '').trim().slice(0, 512)
          try {
            const resolved = await resolveTarget(path, sessionId)
            const info = await ctx.fs.stat(resolved.target)
            if (!info) {
              json(res, 404, { ok: false, error: 'file not found' })
              return
            }
            const cls = classifyPath(resolved.display)
            if (cls.kind === 'unknown') {
              json(res, 415, { ok: false, error: 'not a media file' })
              return
            }
            const payload = {
              ok: true,
              path: resolved.display,
              name: basename(resolved.display),
              size: Number(info.size || 0),
              mtime: mtimeOf(info),
              mime: mimeOf(resolved.display),
              kind: cls.kind,
              ext: cls.ext
            }
            if (req.method === 'HEAD') {
              res.writeHead(200, {
                'cache-control': 'private, no-store',
                'x-content-type-options': 'nosniff',
                'content-type': 'application/json; charset=utf-8'
              })
              res.end()
              return
            }
            json(res, 200, payload)
          } catch (error) {
            json(res, error?.statusCode || 500, { ok: false, error: String(error?.message || error) })
          }
        }
      }))

      disposers.push(scope.webServer.register({
        kind: 'exact',
        path: '/media-viewer/api/content',
        handler: async function (req, res) {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405)
            res.end()
            return
          }
          const url = new URL(req.url || '/media-viewer/api/content', 'http://127.0.0.1')
          const path = (url.searchParams.get('path') || '').slice(0, 8192)
          const sessionId = (url.searchParams.get('sessionId') || '').trim().slice(0, 512)
          const download = url.searchParams.get('download') === '1'
          try {
            const resolved = await resolveTarget(path, sessionId)
            const cls = classifyPath(resolved.display)
            if (cls.kind === 'unknown') {
              res.writeHead(415)
              res.end('not a media file')
              return
            }
            const disk = String(resolved.target?.displayPath || resolved.display)
            const stat = await diskStat(disk)
            if (!stat.isFile()) {
              res.writeHead(415)
              res.end('not a file')
              return
            }
            const size = stat.size
            const range = parseRange(req.headers?.range, size)
            const headers = {
              'content-type': mimeOf(resolved.display),
              'accept-ranges': 'bytes',
              'cache-control': 'private, no-store',
              'x-content-type-options': 'nosniff',
              'content-disposition': contentDisposition(resolved.display, download)
            }
            if (range?.invalid) {
              res.writeHead(416, Object.assign({}, headers, { 'content-range': 'bytes */' + size }))
              res.end()
              return
            }
            if (range) {
              const length = range.end - range.start + 1
              res.writeHead(206, Object.assign({}, headers, {
                'content-range': 'bytes ' + range.start + '-' + range.end + '/' + size,
                'content-length': length
              }))
              if (req.method === 'HEAD') {
                res.end()
                return
              }
              const stream = createReadStream(disk, { start: range.start, end: range.end })
              stream.on('error', function () { try { res.destroy() } catch {} })
              stream.pipe(res)
              return
            }
            res.writeHead(200, Object.assign({}, headers, { 'content-length': size }))
            if (req.method === 'HEAD') {
              res.end()
              return
            }
            const stream = createReadStream(disk)
            stream.on('error', function () { try { res.destroy() } catch {} })
            stream.pipe(res)
          } catch (error) {
            res.writeHead(error?.statusCode || 500, { 'content-type': 'text/plain; charset=utf-8' })
            res.end(String(error?.message || error))
          }
        }
      }))

      return function () {
        for (const dispose of disposers) {
          try { dispose() } catch {}
        }
      }
    })
  })
}

export const _test = {
  classifyPath,
  mimeOf,
  parseRange,
  sanitizePathInput,
  redundantProjectPrefixParentCwd
}
