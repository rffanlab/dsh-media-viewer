from pathlib import Path
import json
import re

p = Path('client.js')
s = p.read_text(encoding='utf-8')

pattern = re.compile(r"    function pathOfElement\(el\) \{.*?    function onPointerOverCapture\(e\) \{", re.S)
replacement = '''    function pathOfElement(el) {
      if (!el) return null
      if (el.closest && (el.closest('.mv-panel') || el.closest('.mv-page'))) return null
      var values = []
      if (el.getAttribute) {
        ;['data-path','data-file-path','data-filename','data-file','data-uri','data-url','href','title','aria-label','data-tooltip'].forEach(function (name) {
          var v = el.getAttribute(name); if (v) values.push(v)
        })
      }
      if (el.href) values.push(el.href)
      // Important: inspect ONLY the clicked file element itself.
      // Do not walk ancestor containers: authorization/confirm buttons can live
      // inside tool cards whose parent text contains unrelated file paths.
      if (el.textContent) values.push(el.textContent)
      for (var i = 0; i < values.length; i += 1) {
        var found = cleanCandidate(values[i])
        if (found) return found
      }
      return null
    }
    function onClickCapture(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      var t = e.target; if (!t || typeof t.closest !== 'function') return
      if (t.closest('.mv-panel') || t.closest('.mv-page')) return

      // Inline Markdown code paths are handled explicitly and locally.
      var code = t.closest('code')
      if (code) {
        var codePath = cleanCandidate(code.textContent || '')
        if (codePath) {
          e.preventDefault(); e.stopPropagation(); requestOpenPath(codePath)
          return
        }
      }

      // Only explicit clickable/file-bearing elements. Do NOT include generic
      // [tabindex], and do not scan parents above the matched element.
      var clickable = t.closest('a,button,[role="button"],[data-path],[data-file-path],[data-filename],[data-file],[data-uri],[data-url]')
      if (!clickable) return
      var path = pathOfElement(clickable); if (!path) return
      e.preventDefault(); e.stopPropagation(); requestOpenPath(path)
    }
    function onPointerOverCapture(e) {'''

s2, count = pattern.subn(replacement, s, count=1)
if count != 1:
    raise SystemExit(f'expected exactly one click interception block, got {count}')

p.write_text(s2, encoding='utf-8')

pkgp = Path('package.json')
pkg = json.loads(pkgp.read_text(encoding='utf-8'))
pkg['version'] = '0.2.3'
pkgp.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('v0.2.3 click interception safety patch applied')
