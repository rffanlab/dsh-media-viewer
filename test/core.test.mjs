import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { classifyPath, mimeOf, parseRange, sanitizePathInput, redundantProjectPrefixParentCwd } from '../index.js'

test('classifies only media and subtitle responsibilities', () => {
  assert.deepEqual(classifyPath('/tmp/demo.mp4'), { kind: 'video', ext: 'mp4' })
  assert.deepEqual(classifyPath('/tmp/song.flac'), { kind: 'audio', ext: 'flac' })
  assert.deepEqual(classifyPath('/tmp/caption.srt'), { kind: 'subtitle', ext: 'srt' })
  assert.equal(classifyPath('/tmp/readme.md').kind, 'unknown')
  assert.equal(classifyPath('/tmp/book.pdf').kind, 'unknown')
  assert.equal(classifyPath('/tmp/report.docx').kind, 'unknown')
  assert.equal(classifyPath('/tmp/book.xlsx').kind, 'unknown')
  assert.equal(classifyPath('/tmp/deck.pptx').kind, 'unknown')
  assert.equal(classifyPath('/tmp/image.png').kind, 'unknown')
})

test('maps media MIME types', () => {
  assert.equal(mimeOf('a.mp4'), 'video/mp4')
  assert.equal(mimeOf('a.flac'), 'audio/flac')
  assert.equal(mimeOf('a.vtt'), 'text/vtt; charset=utf-8')
})

test('parses byte ranges for seekable media', () => {
  assert.deepEqual(parseRange('bytes=0-99', 1000), { start: 0, end: 99 })
  assert.deepEqual(parseRange('bytes=900-', 1000), { start: 900, end: 999 })
  assert.deepEqual(parseRange('bytes=-100', 1000), { start: 900, end: 999 })
  assert.equal(parseRange(null, 1000), null)
  assert.equal(parseRange('bytes=1000-1100', 1000).invalid, true)
})

test('sanitizes wrapped path artifacts without joining independent paths', () => {
  const base = '/srv/e5-data/deepseek-harness/workspace/道家文化主号短视频/'
  const tail = '.dsh-runs/run/final/video.mp4'
  assert.equal(sanitizePathInput(base + '\n  ' + tail), base + tail)
  assert.equal(sanitizePathInput(base + '  ' + tail), base + tail)
  assert.equal(sanitizePathInput('\uFEFF\u200E' + base + tail + '\u200B\u2060'), base + tail)
  assert.equal(
    sanitizePathInput('/srv/a/production.json\n/srv/b/final.mp4'),
    '/srv/a/production.json\n/srv/b/final.mp4'
  )
})

test('keeps conservative redundant project prefix fallback', () => {
  assert.equal(
    redundantProjectPrefixParentCwd('project/final.mp4', '/srv/workspace/project'),
    '/srv/workspace'
  )
  assert.equal(redundantProjectPrefixParentCwd('final.mp4', '/srv/workspace/project'), undefined)
  assert.equal(redundantProjectPrefixParentCwd('/srv/workspace/project/final.mp4', '/srv/workspace/project'), undefined)
})

test('client uses official DSH document preview extension API', async () => {
  const client = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(client, /documentPreviews\.register/)
  assert.match(client, /sidebar\.right\.tab\.document/)
  assert.match(client, /priority: 'extension'/)
  assert.match(client, /loading: 'renderer'/)
  assert.match(client, /loading: 'text-pages'/)
})

test('client no longer globally intercepts conversation clicks', async () => {
  const client = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.doesNotMatch(client, /document\.addEventListener\('click'/)
  assert.doesNotMatch(client, /onClickCapture/)
  assert.doesNotMatch(client, /data-presented-file/)
  assert.doesNotMatch(client, /PATH_TOKEN_RE/)
})

test('client leaves document formats to native DSH preview', async () => {
  const client = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.doesNotMatch(client, /mammoth|pdfjs|exceljs|jszip/i)
  assert.doesNotMatch(client, /extensions:\s*\[[^\]]*'pdf'/)
  assert.doesNotMatch(client, /extensions:\s*\[[^\]]*'docx'/)
  assert.doesNotMatch(client, /extensions:\s*\[[^\]]*'xlsx'/)
  assert.doesNotMatch(client, /extensions:\s*\[[^\]]*'pptx'/)
})

test('package has no document-preview runtime dependencies', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(pkg.version, '0.3.0')
  assert.deepEqual(pkg.dependencies || {}, {})
})
