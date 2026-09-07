import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns } from '../index.js'

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
