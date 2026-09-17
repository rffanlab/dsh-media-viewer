from pathlib import Path
import json

# Client fix -----------------------------------------------------------------
p = Path('client.js')
s = p.read_text(encoding='utf-8')
s = s.replace('// dsh-media-viewer: DeepSeek Harness plugin (Client side) v0.2.6', '// dsh-media-viewer: DeepSeek Harness plugin (Client side) v0.2.7', 1)

old_prefix = r'''.replace(/^(?:打开|查看|预览|下载|文件|open|view|preview|download|file)\s*(?:文件)?\s*[:：-]?\s*/i, ''))'''
new_prefix = r'''.replace(/^(?:在(?:右侧)?侧边栏(?:中)?\s*)?(?:打开|查看|预览|下载|文件|open|view|preview|download|file)\s*(?:文件)?\s*[:：-]?\s*/i, ''))'''
if old_prefix not in s:
    raise SystemExit('cleanCandidate prefix anchor not found')
s = s.replace(old_prefix, new_prefix, 1)

anchor = '''    function onClickCapture(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      var t = e.target; if (!t || typeof t.closest !== 'function') return
      if (t.closest('.mv-panel') || t.closest('.mv-page')) return
      // Explicit download links must keep their native browser behavior. In
      // particular, triggerDownload() creates a temporary <a download>; without
      // this guard the global file click interceptor re-opens its API URL.
      if (t.closest('a[download],[data-mv-download="1"]')) return

      // Inline Markdown code paths are handled explicitly and locally.
'''
replacement = '''    function onClickCapture(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      var t = e.target; if (!t || typeof t.closest !== 'function') return
      if (t.closest('.mv-panel') || t.closest('.mv-page')) return
      // Explicit download links must keep their native browser behavior. In
      // particular, triggerDownload() creates a temporary <a download>; without
      // this guard the global file click interceptor re-opens its API URL.
      if (t.closest('a[download],[data-mv-download="1"]')) return

      // DSH explicit-delivery cards expose two different strings: the visible
      // Open button carries a localized aria-label such as "在侧边栏打开 …",
      // while the card overlay button's title is the canonical path produced by
      // resolveWorkspacePath(cwd, file.path). Prefer that canonical title
      // instead of guessing a path from localized UI prose. Keep the chevron
      // menu entirely owned by DSH.
      var presentedCard = t.closest('[data-presented-file]')
      if (presentedCard) {
        var presentedButton = t.closest('button')
        if (presentedButton && presentedButton.getAttribute('aria-haspopup') === 'menu') return
        var canonicalButton = presentedCard.querySelector('button[title]')
        var canonicalPath = canonicalButton ? cleanCandidate(canonicalButton.getAttribute('title')) : null
        if (canonicalPath) {
          e.preventDefault(); e.stopPropagation(); requestOpenPath(canonicalPath)
        }
        return
      }

      // Inline Markdown code paths are handled explicitly and locally.
'''
if anchor not in s:
    raise SystemExit('onClickCapture anchor not found')
s = s.replace(anchor, replacement, 1)
p.write_text(s, encoding='utf-8')

# Regression test ------------------------------------------------------------
tp = Path('test/core.test.mjs')
t = tp.read_text(encoding='utf-8')
if "import { readFile as readFixture } from 'node:fs/promises'" not in t:
    t = t.replace("import assert from 'node:assert/strict'\n", "import assert from 'node:assert/strict'\nimport { readFile as readFixture } from 'node:fs/promises'\n", 1)

insert_before = "test('runtime document dependencies import on Node 20+', async () => {"
regression = '''test('client prefers canonical DSH presented-card title paths', async () => {
  const client = await readFixture(new URL('../client.js', import.meta.url), 'utf8')
  assert.match(client, /closest\('\[data-presented-file\]'\)/)
  assert.match(client, /querySelector\('button\[title\]'\)/)
  assert.match(client, /getAttribute\('aria-haspopup'\) === 'menu'/)
  assert.match(client, /在\(\?:右侧\)\?侧边栏/)
})

'''
if 'client prefers canonical DSH presented-card title paths' not in t:
    if insert_before not in t:
        raise SystemExit('test insertion anchor not found')
    t = t.replace(insert_before, regression + insert_before, 1)
tp.write_text(t, encoding='utf-8')

# Version --------------------------------------------------------------------
pkgp = Path('package.json')
pkg = json.loads(pkgp.read_text(encoding='utf-8'))
pkg['version'] = '0.2.7'
pkgp.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Bilingual changelog --------------------------------------------------------
entries = [
    ('README.md', '## 更新记录', '''### v0.2.7\n\n- 修复 DSH 新版显式交付卡片点击“打开”后路径被错误识别为 `在侧边栏打开 /.../file.mp4` 的问题\n- 针对官方 `[data-presented-file]` 卡片直接读取 `resolveWorkspacePath(cwd, file.path)` 写入的 canonical `title` 路径\n- 卡片正文和“打开”按钮由媒体查看器接管；右侧下拉菜单 (`aria-haspopup=menu`) 保持 DSH 原生行为\n- 防御性兼容中文 `在侧边栏打开 ...` aria-label，不再把界面提示语当作文件路径的一部分\n\n'''),
    ('README.en.md', '## Changelog', '''### v0.2.7\n\n- Fix DSH explicit-delivery cards where the localized accessibility label could be mistaken for a path, e.g. `在侧边栏打开 /.../file.mp4`\n- For official `[data-presented-file]` cards, read the canonical `title` generated from `resolveWorkspacePath(cwd, file.path)` instead of parsing UI prose\n- Media preview handles the card body and Open button, while the chevron menu (`aria-haspopup=menu`) remains native DSH behavior\n- Defensively strip the Chinese `在侧边栏打开 ...` accessibility prefix when encountered elsewhere\n\n'''),
]
for filename, heading, body in entries:
    rp = Path(filename)
    r = rp.read_text(encoding='utf-8')
    if '### v0.2.7' not in r:
        if heading not in r:
            raise SystemExit(f'{filename} changelog anchor not found')
        r = r.replace(heading + '\n', heading + '\n\n' + body, 1)
        rp.write_text(r, encoding='utf-8')

print('v0.2.7 DSH presented-card canonical-path patch applied')
