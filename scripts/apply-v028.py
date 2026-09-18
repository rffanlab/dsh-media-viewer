from pathlib import Path
import json

p = Path('client.js')
s = p.read_text(encoding='utf-8')
s = s.replace('// dsh-media-viewer: DeepSeek Harness plugin (Client side) v0.2.7', '// dsh-media-viewer: DeepSeek Harness plugin (Client side) v0.2.8', 1)

old = '''      // Inline Markdown code paths are handled explicitly and locally.
      var code = t.closest('code')
      if (code) {
        var codePath = cleanCandidate(code.textContent || '')
        if (codePath) {
          e.preventDefault(); e.stopPropagation(); requestOpenPath(codePath)
          return
        }
      }
'''
new = '''      // DSH inline file mentions render as <code><button title="FULL_PATH">basename</button></code>
      // (and explicit markdown file links can render as <button title="FULL_PATH"><code>...</code></button>).
      // Prefer the owner's canonical title path before falling back to the authored code text,
      // otherwise a unique-basename mention is incorrectly downgraded to just "file.mp4".
      var code = t.closest('code')
      if (code) {
        var mentionButton = t.closest('button[title]') || code.querySelector('button[title]')
        if (mentionButton && (code.contains(mentionButton) || mentionButton.contains(code))) {
          var mentionPath = cleanCandidate(mentionButton.getAttribute('title') || '')
          if (mentionPath) {
            e.preventDefault(); e.stopPropagation(); requestOpenPath(mentionPath)
            return
          }
        }
        var codePath = cleanCandidate(code.textContent || '')
        if (codePath) {
          e.preventDefault(); e.stopPropagation(); requestOpenPath(codePath)
          return
        }
      }
'''
if old not in s:
    raise SystemExit('inline code click anchor not found')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

tp = Path('test/core.test.mjs')
t = tp.read_text(encoding='utf-8')
anchor = "test('runtime document dependencies import on Node 20+', async () => {"
regression = '''test('client prefers canonical title for DSH inline-code file mentions', async () => {
  const client = await readFixture(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(client, /var mentionButton = t\\.closest\\('button\\[title\\]'\\) \\|\\| code\\.querySelector\\('button\\[title\\]'\\)/)
  assert.match(client, /var mentionPath = cleanCandidate\\(mentionButton\\.getAttribute\\('title'\\) \\|\\| ''\\)/)
  const mentionPos = client.indexOf("var mentionPath = cleanCandidate(mentionButton.getAttribute('title') || '')")
  const basenameFallbackPos = client.indexOf("var codePath = cleanCandidate(code.textContent || '')")
  assert.ok(mentionPos >= 0 && basenameFallbackPos > mentionPos)
})

'''
if "client prefers canonical title for DSH inline-code file mentions" not in t:
    if anchor not in t:
        raise SystemExit('test insertion anchor not found')
    t = t.replace(anchor, regression + anchor, 1)
tp.write_text(t, encoding='utf-8')

pkgp = Path('package.json')
pkg = json.loads(pkgp.read_text(encoding='utf-8'))
pkg['version'] = '0.2.8'
pkgp.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

entries = [
    ('README.md', '## 更新记录', '''### v0.2.8

- 修复 DSH 正文行内文件提及只把 basename 传给媒体查看器的问题，例如完整文件实际位于 .dsh-runs/.../final/，插件却只收到 final.mp4
- DSH 行内文件提及的 canonical 完整路径由内部 button[title] 提供；插件现在优先读取该 title
- 仅当 code 是真正的裸代码路径、没有 DSH 文件按钮时，才退回使用 code 文本本身
- 同时兼容 code 包 button 与 button 包 code 两种结构

'''),
    ('README.en.md', '## Changelog', '''### v0.2.8

- Fix DSH inline file mentions being downgraded to basename-only paths, e.g. opening final.mp4 instead of its real .dsh-runs/.../final/final.mp4 location
- DSH exposes the canonical full path on the inline file mention's button[title]; the viewer now prefers that title
- Fall back to raw code text only for genuinely bare code paths without a DSH file button
- Support both code-wrapping-button and button-wrapping-code structures

'''),
]
for filename, heading, body in entries:
    rp = Path(filename)
    r = rp.read_text(encoding='utf-8')
    if '### v0.2.8' not in r:
        if heading not in r:
            raise SystemExit(f'{filename} changelog anchor not found')
        r = r.replace(heading + '\n', heading + '\n\n' + body, 1)
        rp.write_text(r, encoding='utf-8')

print('v0.2.8 inline mention canonical path patch applied')