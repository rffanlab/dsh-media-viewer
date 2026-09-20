import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile as readFixture } from 'node:fs/promises'
import { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns, redundantProjectPrefixParentCwd, sanitizePathInput } from '../index.js'

test('classifies core file types', () => {
  assert.equal(classifyPath('/tmp/demo.mp4').kind, 'video')
  assert.equal(classifyPath('/tmp/song.flac').kind, 'audio')
  assert.equal(classifyPath('/tmp/readme.md').kind, 'markdown')
  assert.equal(classifyPath('/tmp/caption.srt').kind, 'subtitle')
  assert.equal(classifyPath('/tmp/book.pdf').copyable, true)
  assert.equal(classifyPath('/tmp/report.docx').kind, 'docx')
  assert.deepEqual(
    { kind: classifyPath('/tmp/book.xlsx').kind, previewable: classifyPath('/tmp/book.xlsx').previewable, copyable: classifyPath('/tmp/book.xlsx').copyable, structured: classifyPath('/tmp/book.xlsx').structured },
    { kind: 'xlsx', previewable: true, copyable: true, structured: true }
  )
  assert.deepEqual(
    { kind: classifyPath('/tmp/deck.pptx').kind, previewable: classifyPath('/tmp/deck.pptx').previewable, copyable: classifyPath('/tmp/deck.pptx').copyable, structured: classifyPath('/tmp/deck.pptx').structured },
    { kind: 'pptx', previewable: true, copyable: true, structured: true }
  )
  assert.equal(classifyPath('/tmp/legacy.xls').kind, 'document')
  assert.equal(classifyPath('/tmp/archive.zip').kind, 'unknown')
})

test('maps common MIME types', () => {
  assert.equal(mimeOf('a.mp4'), 'video/mp4')
  assert.equal(mimeOf('a.pdf'), 'application/pdf')
  assert.equal(mimeOf('a.vtt'), 'text/vtt; charset=utf-8')
  assert.equal(mimeOf('a.xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  assert.equal(mimeOf('a.pptx'), 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
})

test('parses byte ranges', () => {
  assert.deepEqual(parseRange('bytes=0-99', 1000), { start: 0, end: 99 })
  assert.deepEqual(parseRange('bytes=900-', 1000), { start: 900, end: 999 })
  assert.deepEqual(parseRange('bytes=-100', 1000), { start: 900, end: 999 })
  assert.equal(parseRange(null, 1000), null)
  assert.equal(parseRange('bytes=1000-1100', 1000).invalid, true)
})

test('decodes and extracts PPTX text runs', () => {
  assert.equal(decodeXmlText('A &amp; B &lt; C &#33;'), 'A & B < C !')
  assert.deepEqual(
    extractPptxTextRuns('<p:sp><a:t>Hello &amp; world</a:t><a:r><a:t>Second</a:t></a:r></p:sp>'),
    ['Hello & world', 'Second']
  )
})

test('detects only redundant project-prefix relative paths', () => {
  assert.equal(
    redundantProjectPrefixParentCwd('mini-m3-sop-test/narration.md', '/srv/workspace/mini-m3-sop-test'),
    '/srv/workspace'
  )
  assert.equal(
    redundantProjectPrefixParentCwd('./mini-m3-sop-test/narration.md', '/srv/workspace/mini-m3-sop-test'),
    '/srv/workspace'
  )
  assert.equal(redundantProjectPrefixParentCwd('narration.md', '/srv/workspace/mini-m3-sop-test'), undefined)
  assert.equal(redundantProjectPrefixParentCwd('other-project/narration.md', '/srv/workspace/mini-m3-sop-test'), undefined)
  assert.equal(redundantProjectPrefixParentCwd('/srv/workspace/mini-m3-sop-test/narration.md', '/srv/workspace/mini-m3-sop-test'), undefined)
})

test('sanitizes chat path artifacts without deleting legitimate spaces', () => {
  const base = '/srv/e5-data/deepseek-harness/workspace/道家文化主号短视频/'
  const tail = '.dsh-runs/762b5b31-a1c9-48ed-994d-6f8abaee69be/final/zhuangzi-01-04-liezi-final-v3.mp4'
  assert.equal(sanitizePathInput(base + '\n  ' + tail), base + tail)
  assert.equal(sanitizePathInput(base + '  ' + tail), base + tail)
  assert.equal(sanitizePathInput('\uFEFF\u200E' + base + tail + '\u200B\u2060'), base + tail)
  assert.equal(sanitizePathInput('/srv/workspace/我的 视频/final version.mp4'), '/srv/workspace/我的 视频/final version.mp4')
  assert.equal(sanitizePathInput('/srv/workspace/ normal name.mp4'), '/srv/workspace/ normal name.mp4')
})

test('client prefers canonical DSH presented-card title paths', async () => {
  const client = await readFixture(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(client, /closest\('\[data-presented-file\]'\)/)
  assert.match(client, /querySelector\('button\[title\]'\)/)
  assert.match(client, /getAttribute\('aria-haspopup'\) === 'menu'/)
  assert.match(client, /在\(\?:右侧\)\?侧边栏/)
})

test('client prefers canonical title for DSH inline-code file mentions', async () => {
  const client = await readFixture(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(client, /var mentionButton = t\.closest\('button\[title\]'\) \|\| code\.querySelector\('button\[title\]'\)/)
  assert.match(client, /var mentionPath = cleanCandidate\(mentionButton\.getAttribute\('title'\) \|\| ''\)/)
  const mentionPos = client.indexOf("var mentionPath = cleanCandidate(mentionButton.getAttribute('title') || '')")
  const basenameFallbackPos = client.indexOf("var codePath = cleanCandidate(code.textContent || '')")
  assert.ok(mentionPos >= 0 && basenameFallbackPos > mentionPos)
})

test('client never infers files from generic choice button prose', async () => {
  const client = await readFixture(new URL('../client.js', import.meta.url), 'utf8')
  const pathFnStart = client.indexOf('function pathOfElement(el)')
  const clickStart = client.indexOf('function onClickCapture(e)')
  const pathFn = client.slice(pathFnStart, clickStart)
  assert.ok(pathFnStart >= 0 && clickStart > pathFnStart)
  assert.doesNotMatch(pathFn, /textContent/)
  assert.doesNotMatch(pathFn, /['\"]aria-label['\"]/)
  assert.doesNotMatch(pathFn, /['\"]data-tooltip['\"]/)
  assert.match(client, /a\[href\],button\[title\],\[role="button"\]\[title\]/)
  assert.doesNotMatch(client, /closest\('a,button,\[role="button"\]/)
})

test('runtime document dependencies import on Node 20+', async () => {
  const [pdfjs, mammoth, exceljs, jszip] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('mammoth'),
    import('exceljs'),
    import('jszip')
  ])
  assert.equal(typeof pdfjs.getDocument, 'function')
  assert.ok(mammoth.default || mammoth)
  const ExcelJS = exceljs.default || exceljs
  assert.equal(typeof ExcelJS.Workbook, 'function')
  assert.ok(jszip.default || jszip)
})
