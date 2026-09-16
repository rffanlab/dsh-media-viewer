from pathlib import Path
import json

# Host-side sanitation -------------------------------------------------------
p = Path('index.js')
s = p.read_text(encoding='utf-8')

s = s.replace('// dsh-media-viewer: DeepSeek Harness plugin (Host side) v0.2', '// dsh-media-viewer: DeepSeek Harness plugin (Host side) v0.2.6', 1)

anchor = '''function safeFilename(value) {
  return basename(String(value || 'download')).replace(/[\\r\\n\\0\"]/g, '_') || 'download'
}
'''
helper = r'''function safeFilename(value) {
  return basename(String(value || 'download')).replace(/[\r\n\0"]/g, '_') || 'download'
}

// Unicode format/control characters that commonly leak into copied chat text
// while remaining visually invisible. They are stripped only at path edges or
// next to a separator, never from ordinary filename content.
const PATH_EDGE_JUNK = /[\s\u00A0\u1680\u180E\u2000-\u200F\u2028-\u202F\u205F\u2060-\u206F\u3000\uFEFF]/
const PATH_FORMAT_JUNK = /[\u00AD\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/

/**
 * Remove chat/rendering artifacts from a path without deleting legitimate
 * spaces inside filenames. This intentionally handles DSH's `.dsh-runs`
 * hidden directory as a special case because spaces immediately before it are
 * presentation artifacts, not part of the generated workspace path.
 */
export function sanitizePathInput(value) {
  let s = String(value ?? '')
  const edge = new RegExp(`^${PATH_EDGE_JUNK.source}+|${PATH_EDGE_JUNK.source}+$`, 'g')
  s = s.replace(edge, '')
  // A rendered/copy-wrapped path may continue on the next visual line.
  s = s.replace(/([/\\])[ \t\f\v]*\r?\n[ \t\f\v]*/g, '$1')
  s = s.replace(/[ \t\f\v]*\r?\n[ \t\f\v]*(?=[/\\])/g, '')
  // Invisible formatting marks next to separators are never meaningful here.
  const fmtAfter = new RegExp(`([/\\\\])${PATH_FORMAT_JUNK.source}+`, 'g')
  const fmtBefore = new RegExp(`${PATH_FORMAT_JUNK.source}+(?=[/\\\\])`, 'g')
  s = s.replace(fmtAfter, '$1').replace(fmtBefore, '')
  // DSH-generated hidden run directory: tolerate UI-inserted horizontal space.
  s = s.replace(/([/\\])[ \t]+(?=\.dsh-runs(?:[/\\]|$))/g, '$1')
  return s.replace(edge, '')
}
'''
if anchor not in s:
    raise SystemExit('host safeFilename anchor not found')
s = s.replace(anchor, helper, 1)

old = '''  async function resolveTarget(path, sessionId) {
    const cwd = cwdOf(sessionId)
    const requested = String(path)
'''
new = '''  async function resolveTarget(path, sessionId) {
    const cwd = cwdOf(sessionId)
    const requested = sanitizePathInput(path)
'''
if old not in s:
    raise SystemExit('resolveTarget sanitation anchor not found')
s = s.replace(old, new, 1)

old_export = 'export const _test = { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns, redundantProjectPrefixParentCwd }'
new_export = 'export const _test = { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns, redundantProjectPrefixParentCwd, sanitizePathInput }'
if old_export not in s:
    raise SystemExit('host _test export anchor not found')
s = s.replace(old_export, new_export, 1)
p.write_text(s, encoding='utf-8')

# Client-side sanitation -----------------------------------------------------
cp = Path('client.js')
c = cp.read_text(encoding='utf-8')
c = c.replace('// dsh-media-viewer: DeepSeek Harness plugin (Client side) v0.2.4', '// dsh-media-viewer: DeepSeek Harness plugin (Client side) v0.2.6', 1)

old_client = r'''    function isSupportedPath(p) { return typeof p === 'string' && PATH_RE.test(p.trim()) }
    function decodeCandidate(s) { try { return decodeURIComponent(s) } catch (e) { return s } }
    function cleanCandidate(raw) {
      if (raw === null || raw === undefined) return null
      var s = decodeCandidate(String(raw)).trim()
'''
new_client = r'''    var PATH_EDGE_JUNK_RE = /^[\s\u00A0\u1680\u180E\u2000-\u200F\u2028-\u202F\u205F\u2060-\u206F\u3000\uFEFF]+|[\s\u00A0\u1680\u180E\u2000-\u200F\u2028-\u202F\u205F\u2060-\u206F\u3000\uFEFF]+$/g
    var PATH_FORMAT_JUNK_AFTER_RE = /([/\\])[\u00AD\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]+/g
    var PATH_FORMAT_JUNK_BEFORE_RE = /[\u00AD\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]+(?=[/\\])/g
    function sanitizePathInput(value) {
      var s = String(value === null || value === undefined ? '' : value).replace(PATH_EDGE_JUNK_RE, '')
      s = s.replace(/([/\\])[ \t\f\v]*\r?\n[ \t\f\v]*/g, '$1')
      s = s.replace(/[ \t\f\v]*\r?\n[ \t\f\v]*(?=[/\\])/g, '')
      s = s.replace(PATH_FORMAT_JUNK_AFTER_RE, '$1').replace(PATH_FORMAT_JUNK_BEFORE_RE, '')
      s = s.replace(/([/\\])[ \t]+(?=\.dsh-runs(?:[/\\]|$))/g, '$1')
      return s.replace(PATH_EDGE_JUNK_RE, '')
    }
    function isSupportedPath(p) { return typeof p === 'string' && PATH_RE.test(sanitizePathInput(p)) }
    function decodeCandidate(s) { try { return decodeURIComponent(s) } catch (e) { return s } }
    function cleanCandidate(raw) {
      if (raw === null || raw === undefined) return null
      var s = sanitizePathInput(decodeCandidate(String(raw)))
'''
if old_client not in c:
    raise SystemExit('client sanitation anchor not found')
c = c.replace(old_client, new_client, 1)

# Sanitize URL query/file URL candidates too, and final cleaned candidate.
c = c.replace("if (qp && isSupportedPath(qp)) return qp", "if (qp && isSupportedPath(qp)) return sanitizePathInput(qp)", 1)
c = c.replace("var pn = decodeCandidate(u.pathname || '').replace(/^\\/([A-Za-z]:[\\\\/])/, '$1')\n            if (isSupportedPath(pn)) return pn", "var pn = sanitizePathInput(decodeCandidate(u.pathname || '').replace(/^\\/([A-Za-z]:[\\\\/])/, '$1'))\n            if (isSupportedPath(pn)) return pn", 1)

old_finish = r'''      s = s.replace(/^["'`]+|["'`]+$/g, '')
        .replace(/^(?:打开|查看|预览|下载|文件|open|view|preview|download|file)\s*(?:文件)?\s*[:：-]?\s*/i, '')
        .trim()
      if (isSupportedPath(s)) return s
'''
new_finish = r'''      s = sanitizePathInput(s.replace(/^["'`]+|["'`]+$/g, '')
        .replace(/^(?:打开|查看|预览|下载|文件|open|view|preview|download|file)\s*(?:文件)?\s*[:：-]?\s*/i, ''))
      if (isSupportedPath(s)) return s
'''
if old_finish not in c:
    raise SystemExit('client final sanitation anchor not found')
c = c.replace(old_finish, new_finish, 1)

# Manual input and pending/opened paths should use the same sanitation.
c = c.replace("function requestOpenPath(path) { pendingSeq += 1; pending = { path: String(path), seq: pendingSeq };", "function requestOpenPath(path) { pendingSeq += 1; pending = { path: sanitizePathInput(path), seq: pendingSeq };", 1)
c = c.replace("apiMeta(path, sid).then(function (r)", "path = sanitizePathInput(path)\n        apiMeta(path, sid).then(function (r)", 1)

cp.write_text(c, encoding='utf-8')

# Tests ----------------------------------------------------------------------
tp = Path('test/core.test.mjs')
t = tp.read_text(encoding='utf-8')
old_import = "import { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns, redundantProjectPrefixParentCwd } from '../index.js'"
new_import = "import { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns, redundantProjectPrefixParentCwd, sanitizePathInput } from '../index.js'"
if old_import not in t:
    raise SystemExit('test import anchor not found')
t = t.replace(old_import, new_import, 1)

insert_before = "test('runtime document dependencies import on Node 20+', async () => {"
regression = r'''test('sanitizes chat path artifacts without deleting legitimate spaces', () => {
  const base = '/srv/e5-data/deepseek-harness/workspace/道家文化主号短视频/'
  const tail = '.dsh-runs/762b5b31-a1c9-48ed-994d-6f8abaee69be/final/zhuangzi-01-04-liezi-final-v3.mp4'
  assert.equal(sanitizePathInput(base + '\n  ' + tail), base + tail)
  assert.equal(sanitizePathInput(base + '  ' + tail), base + tail)
  assert.equal(sanitizePathInput('\uFEFF\u200E' + base + tail + '\u200B\u2060'), base + tail)
  assert.equal(sanitizePathInput('/srv/workspace/我的 视频/final version.mp4'), '/srv/workspace/我的 视频/final version.mp4')
  assert.equal(sanitizePathInput('/srv/workspace/ normal name.mp4'), '/srv/workspace/ normal name.mp4')
})

'''
if insert_before not in t:
    raise SystemExit('test insertion anchor not found')
t = t.replace(insert_before, regression + insert_before, 1)
tp.write_text(t, encoding='utf-8')

# Package version ------------------------------------------------------------
pkgp = Path('package.json')
pkg = json.loads(pkgp.read_text(encoding='utf-8'))
pkg['version'] = '0.2.6'
pkgp.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Bilingual changelog --------------------------------------------------------
entries = [
    ('README.md', '## 更新记录', '''### v0.2.6\n\n- 兼容聊天/复制路径中混入的首尾不可见 Unicode 字符（零宽空格、BOM、方向控制符等）\n- 兼容长路径在聊天中换行后产生的 `/\\n  子目录` 缩进污染\n- 针对 DSH 生成目录兼容 `/  .dsh-runs`，自动还原为 `/.dsh-runs`\n- 不会全局删除正常文件名空格，例如 `我的 视频/final version.mp4` 保持原样\n- 前端点击提取与 Host 路径解析双层清洗，手动粘贴路径也生效\n\n'''),
    ('README.en.md', '## Changelog', '''### v0.2.6\n\n- Tolerate invisible Unicode artifacts at copied/chat path boundaries (zero-width marks, BOM, bidi controls, etc.)\n- Repair line-wrapped paths where indentation appears after a separator\n- Normalize DSH run-directory artifacts such as `/  .dsh-runs` back to `/.dsh-runs`\n- Preserve legitimate spaces inside normal filenames such as `我的 视频/final version.mp4`\n- Apply sanitation both in the chat client and Host resolver so pasted paths are covered too\n\n'''),
]
for filename, heading, body in entries:
    rp = Path(filename)
    r = rp.read_text(encoding='utf-8')
    if '### v0.2.6' not in r:
        if heading not in r:
            raise SystemExit(f'{filename} changelog anchor not found')
        r = r.replace(heading + '\n', heading + '\n\n' + body, 1)
        rp.write_text(r, encoding='utf-8')

print('v0.2.6 path sanitation patch applied')
