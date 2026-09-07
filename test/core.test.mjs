import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyPath, mimeOf, parseRange } from '../index.js'

test('classifies core file types', () => {
  assert.equal(classifyPath('/tmp/demo.mp4').kind, 'video')
  assert.equal(classifyPath('/tmp/song.flac').kind, 'audio')
  assert.equal(classifyPath('/tmp/readme.md').kind, 'markdown')
  assert.equal(classifyPath('/tmp/book.pdf').copyable, true)
  assert.equal(classifyPath('/tmp/report.docx').kind, 'docx')
  assert.equal(classifyPath('/tmp/archive.zip').kind, 'unknown')
})

test('maps common MIME types', () => {
  assert.equal(mimeOf('a.mp4'), 'video/mp4')
  assert.equal(mimeOf('a.pdf'), 'application/pdf')
})

test('parses byte ranges', () => {
  assert.deepEqual(parseRange('bytes=0-99', 1000), { start: 0, end: 99 })
  assert.deepEqual(parseRange('bytes=900-', 1000), { start: 900, end: 999 })
  assert.deepEqual(parseRange('bytes=-100', 1000), { start: 900, end: 999 })
  assert.equal(parseRange(null, 1000), null)
  assert.equal(parseRange('bytes=1000-1100', 1000).invalid, true)
})

test('runtime document dependencies expose required APIs', async () => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  assert.equal(typeof pdfjs.getDocument, 'function')

  const mammothMod = await import('mammoth')
  const mammoth = mammothMod.default || mammothMod
  assert.equal(typeof mammoth.extractRawText, 'function')
})
