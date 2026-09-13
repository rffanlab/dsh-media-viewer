from pathlib import Path
import json

p = Path('index.js')
s = p.read_text(encoding='utf-8')

old_import = "import { basename, extname } from 'node:path'"
new_import = "import { basename, dirname, extname, isAbsolute } from 'node:path'"
if old_import not in s:
    raise SystemExit('node:path import anchor not found')
s = s.replace(old_import, new_import, 1)

anchor = '''function safeFilename(value) {
  return basename(String(value || 'download')).replace(/[\\r\\n\\0\"]/g, '_') || 'download'
}
'''
helper = '''function safeFilename(value) {
  return basename(String(value || 'download')).replace(/[\\r\\n\\0\"]/g, '_') || 'download'
}

/**
 * Some DSH deliverable cards expose paths relative to the workspace parent
 * (for example `project/file.md`) even when the session cwd is already
 * `/.../project`. In that case resolving against cwd would duplicate the
 * project segment. Return the cwd parent only for this exact redundant-prefix
 * shape; every other relative path keeps normal session-cwd semantics.
 */
export function redundantProjectPrefixParentCwd(requestedPath, cwd) {
  if (typeof requestedPath !== 'string' || typeof cwd !== 'string' || !requestedPath || !cwd) return undefined
  if (isAbsolute(requestedPath)) return undefined
  const normalized = requestedPath.replace(/\\\\/g, '/').replace(/^\\.\\/+/, '')
  const first = normalized.split('/').filter(Boolean)[0]
  const cwdBase = basename(cwd.replace(/[\\\\/]+$/, ''))
  if (!first || !cwdBase || first !== cwdBase) return undefined
  return dirname(cwd)
}
'''
if anchor not in s:
    raise SystemExit('safeFilename anchor not found')
s = s.replace(anchor, helper, 1)

old_resolve = '''  async function resolveTarget(path, sessionId) {
    const cwd = cwdOf(sessionId)
    const target = await ctx.fs.resolve(path, cwd ? { cwd } : {})
    let display = String(path)
    try { display = ctx.fs.processPath(target) } catch {}
    return { target, display, cwd }
  }
'''
new_resolve = '''  async function resolveTarget(path, sessionId) {
    const cwd = cwdOf(sessionId)
    const requested = String(path)
    let target = await ctx.fs.resolve(requested, cwd ? { cwd } : {})

    // Normal DSH semantics are always session-cwd first. Only if that target
    // does not exist do we consider the deliverable-card compatibility case
    // where the relative path redundantly starts with basename(cwd).
    if (cwd && !isAbsolute(requested)) {
      let exists = false
      try { exists = Boolean(await ctx.fs.stat(target)) } catch {}
      if (!exists) {
        const parentCwd = redundantProjectPrefixParentCwd(requested, cwd)
        if (parentCwd) {
          try {
            const fallback = await ctx.fs.resolve(requested, { cwd: parentCwd })
            const fallbackInfo = await ctx.fs.stat(fallback)
            if (fallbackInfo) target = fallback
          } catch {}
        }
      }
    }

    let display = requested
    try { display = ctx.fs.processPath(target) } catch {}
    return { target, display, cwd }
  }
'''
if old_resolve not in s:
    raise SystemExit('resolveTarget anchor not found')
s = s.replace(old_resolve, new_resolve, 1)

old_test_export = "export const _test = { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns }"
new_test_export = "export const _test = { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns, redundantProjectPrefixParentCwd }"
if old_test_export not in s:
    raise SystemExit('_test export anchor not found')
s = s.replace(old_test_export, new_test_export, 1)
p.write_text(s, encoding='utf-8')

# Regression tests.
tp = Path('test/core.test.mjs')
t = tp.read_text(encoding='utf-8')
old_import_test = "import { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns } from '../index.js'"
new_import_test = "import { classifyPath, mimeOf, parseRange, decodeXmlText, extractPptxTextRuns, redundantProjectPrefixParentCwd } from '../index.js'"
if old_import_test not in t:
    raise SystemExit('test import anchor not found')
t = t.replace(old_import_test, new_import_test, 1)
insert_before = "test('runtime document dependencies import on Node 20+', async () => {"
regression = '''test('detects only redundant project-prefix relative paths', () => {
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

'''
if insert_before not in t:
    raise SystemExit('test insertion anchor not found')
t = t.replace(insert_before, regression + insert_before, 1)
tp.write_text(t, encoding='utf-8')

# Version bump.
pkgp = Path('package.json')
pkg = json.loads(pkgp.read_text(encoding='utf-8'))
pkg['version'] = '0.2.5'
pkgp.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Bilingual changelog entries.
for filename, heading, body in [
    ('README.md', '## 更新记录', '''### v0.2.5\n\n- 修复 DSH 会话文件卡片使用“项目名/文件名”相对路径时可能提示 `file not found` 的问题\n- 相对路径仍优先按当前 session cwd 解析；只有当目标不存在且路径首段等于当前 cwd 目录名时，才安全回退到 cwd 的父目录\n- 兼容 `narration.md` 与 `mini-m3-sop-test/narration.md` 两种路径形式，避免重复拼接项目目录名\n\n'''),
    ('README.en.md', '## Changelog', '''### v0.2.5\n\n- Fix `file not found` when DSH deliverable cards expose project-prefixed relative paths such as `project/file.md`\n- Relative paths still resolve against the session cwd first; fallback to the cwd parent happens only when the first path segment exactly matches the cwd basename and the normal target is absent\n- Supports both `narration.md` and `mini-m3-sop-test/narration.md` without duplicating the project directory\n\n'''),
]:
    rp = Path(filename)
    r = rp.read_text(encoding='utf-8')
    if '### v0.2.5' not in r:
        if heading not in r:
            raise SystemExit(f'{filename} changelog anchor not found')
        r = r.replace(heading + '\n', heading + '\n\n' + body, 1)
        rp.write_text(r, encoding='utf-8')

print('v0.2.5 relative-path resolution patch applied')
