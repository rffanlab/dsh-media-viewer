// dsh-media-viewer: DeepSeek Harness plugin (Client side)
// Based on the DSH slot/panel integration patterns from dsh-md-preview.

window.__ModuleLoader__.load({
  id: 'dsh-media-viewer',
  factory: function (require) {
    var module = { exports: {} }
    var exports = module.exports
    var react = require('react')
    var useState = react.useState
    var useEffect = react.useEffect
    var useRef = react.useRef
    var createElement = react.createElement
    var Fragment = react.Fragment

    var CSS = '' +
      '.mv-panel{position:fixed;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-2,#fff);border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.24);z-index:999;overflow:hidden;color:var(--dsw-alias-label-primary,#1f2328);font-size:13px}' +
      '.mv-panel.mv-dock{right:0;bottom:0;border-radius:0;border-right:0;border-bottom:0;box-shadow:none;background:var(--dsw-alias-bg-base,#fff);z-index:40}' +
      '.mv-dock-handle{position:absolute;left:-3px;top:0;bottom:0;width:8px;cursor:col-resize;z-index:4}.mv-dock-handle:after{content:"";position:absolute;left:3px;top:0;bottom:0;width:2px;background:var(--dsw-alias-border-l2,#d0d7de)}' +
      '.mv-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);background:var(--dsw-alias-bg-module-platform,#f6f8fa);flex:none}.mv-dock .mv-head{background:transparent;padding:12px 16px 10px}' +
      '.mv-title{font-size:14px;font-weight:600}.mv-actions{display:flex;gap:6px;align-items:center}' +
      '.mv-btn,.mv-open{padding:5px 10px;border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:6px;background:var(--dsw-alias-bg-layer-3,#fff);color:inherit;cursor:pointer;font-size:12px}.mv-btn:hover,.mv-open:hover{background:var(--dsw-alias-interactive-bg-hover,#f6f8fa)}' +
      '.mv-dock .mv-head .mv-btn{border:none;background:transparent}' +
      '.mv-bar{display:flex;gap:8px;padding:9px 14px;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);flex:none;align-items:center}.mv-input{flex:1;min-width:0;padding:6px 8px;border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:6px;background:var(--dsw-specific-input-major,#fff);color:inherit;font-size:12px}' +
      '.mv-list{flex:1;min-height:0;overflow:auto}.mv-card{display:block;width:100%;text-align:left;padding:10px 16px;border:0;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);background:transparent;color:inherit;cursor:pointer}.mv-card:hover{background:var(--dsw-alias-interactive-bg-hover,#f6f8fa)}' +
      '.mv-card-top{display:flex;gap:8px;align-items:center}.mv-icon{width:22px;flex:none;text-align:center}.mv-card-name{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}.mv-time{font-size:11px;opacity:.58;flex:none}.mv-path{font:10.5px ui-monospace,SFMono-Regular,Menlo,monospace;opacity:.55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px}.mv-snip{font-size:11px;opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:4px}.mv-meta{display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap}.mv-chip{font-size:10px;border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:999px;padding:1px 6px;opacity:.78}' +
      '.mv-empty,.mv-error{padding:18px 16px;opacity:.72}.mv-error{color:var(--dsw-alias-state-error-primary,#c0392b)}.mv-more{display:block;width:100%;text-align:left;padding:8px 16px;border:0;background:transparent;color:var(--dsw-alias-state-business-primary,#0969da);cursor:pointer}' +
      '.mv-view-head{display:flex;gap:8px;align-items:center;padding:8px 14px;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);flex:none}.mv-current{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;opacity:.7}' +
      '.mv-body{flex:1;min-height:0;overflow:auto;padding:14px 16px}.mv-media-wrap{height:100%;min-height:320px;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-1,#f6f8fa);border-radius:8px;overflow:hidden}.mv-video{width:100%;height:100%;max-height:100%;background:#000}.mv-audio{width:min(680px,92%)}.mv-image{max-width:100%;max-height:100%;object-fit:contain}.mv-pdf{width:100%;height:100%;min-height:560px;border:0;background:#fff}' +
      '.mv-pre{margin:0;white-space:pre-wrap;word-break:break-word;font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace}.mv-doc-note{font-size:11px;opacity:.65;margin-bottom:10px}.mv-copy-status{font-size:11px;opacity:.72}' +
      '.mv-render{line-height:1.62;word-wrap:break-word}.mv-render h1,.mv-render h2,.mv-render h3,.mv-render h4,.mv-render h5,.mv-render h6{margin:16px 0 8px;font-weight:600;line-height:1.3}.mv-render h1{font-size:20px;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);padding-bottom:6px}.mv-render h2{font-size:17px;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);padding-bottom:4px}.mv-render h3{font-size:15px}.mv-render p{margin:8px 0}.mv-render ul,.mv-render ol{margin:8px 0;padding-left:22px}.mv-render li{margin:3px 0}.mv-render code{background:var(--dsw-alias-markdown-inline-code,#f0f2f4);padding:1px 5px;border-radius:4px;font:12px ui-monospace,SFMono-Regular,Menlo,monospace}.mv-render pre.mv-code{background:var(--dsw-alias-markdown-code-block,#f6f8fa);border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:8px;padding:10px 12px;overflow:auto}.mv-render pre.mv-code code{background:transparent;padding:0;display:block}.mv-render table{border-collapse:collapse;display:block;overflow:auto;max-width:100%;margin:10px 0}.mv-render th,.mv-render td{border:1px solid var(--dsw-alias-border-l2,#d0d7de);padding:5px 9px;font-size:12px}.mv-render th{background:var(--dsw-alias-bg-module-platform,#f6f8fa)}.mv-render blockquote{margin:8px 0;padding:2px 12px;border-left:3px solid var(--dsw-alias-border-l2,#d0d7de);opacity:.8}.mv-render hr{border:0;border-top:1px solid var(--dsw-alias-border-l1,#d0d7de);margin:12px 0}.mv-render img{max-width:100%;height:auto}.mv-render a{color:var(--dsw-alias-state-business-primary,#0969da)}' +
      '.mv-page{height:100%;min-height:480px;display:flex;flex-direction:column;overflow:hidden}.mv-page-title{padding:12px 16px;font-weight:600;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de)}'

    function esc(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    function inline(text) {
      var t = String(text)
      var codes = []
      t = t.replace(/`([^`]+)`/g, function (_m, c) { codes.push(c); return '\u0000C' + (codes.length - 1) + '\u0000' })
      t = esc(t)
      t = t.replace(/\u0000C(\d+)\u0000/g, function (_m, i) { return '<code>' + esc(codes[+i]) + '</code>' })
      t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">')
      t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
      return t
    }

    function cells(raw) {
      var c = String(raw).split('|')
      if (c[0] && c[0].trim() === '') c = c.slice(1)
      if (c[c.length - 1] && c[c.length - 1].trim() === '') c = c.slice(0, -1)
      return c.map(function (s) { return s.trim() })
    }

    function mdToHtml(text) {
      var lines = String(text).replace(/\r\n/g, '\n').split('\n')
      var out = []
      var para = []
      function flush() { if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para.length = 0 } }
      var i = 0
      while (i < lines.length) {
        var line = lines[i]
        if (/^\s*$/.test(line)) { flush(); i++; continue }
        if (/^\s*```/.test(line)) {
          flush()
          var lang = esc(line.replace(/^\s*```/, '').trim())
          var buf = []
          i++
          while (i < lines.length && !/^\s*```/.test(lines[i])) { buf.push(esc(lines[i])); i++ }
          if (i < lines.length) i++
          out.push('<pre class="mv-code">' + (lang ? '<div style="font-size:10px;opacity:.6;margin-bottom:4px">' + lang + '</div>' : '') + '<code>' + buf.join('\n') + '</code></pre>')
          continue
        }
        var h = line.match(/^(#{1,6})\s+(.*)$/)
        if (h) { flush(); out.push('<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>'); i++; continue }
        if (/^\s*([-*_])\s*\1\s*\1/.test(line)) { flush(); out.push('<hr>'); i++; continue }
        var bq = line.match(/^>\s?(.*)$/)
        if (bq) {
          flush(); var q = [inline(bq[1])]; i++
          while (i < lines.length) { var qb = lines[i].match(/^>\s?(.*)$/); if (!qb) break; q.push(inline(qb[1])); i++ }
          out.push('<blockquote>' + q.join('<br>') + '</blockquote>'); continue
        }
        if (/^\s*[-*+]\s+/.test(line)) {
          flush(); out.push('<ul>')
          while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { out.push('<li>' + inline(lines[i].replace(/^\s*[-*+]\s+/, '')) + '</li>'); i++ }
          out.push('</ul>'); continue
        }
        if (/^\s*\d+\.\s+/.test(line)) {
          flush(); out.push('<ol>')
          while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { out.push('<li>' + inline(lines[i].replace(/^\s*\d+\.\s+/, '')) + '</li>'); i++ }
          out.push('</ol>'); continue
        }
        if (line.indexOf('|') >= 0 && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
          flush(); var hs = cells(line); out.push('<table><thead><tr>' + hs.map(function (c) { return '<th>' + inline(c) + '</th>' }).join('') + '</tr></thead><tbody>'); i += 2
          while (i < lines.length && lines[i].indexOf('|') >= 0 && lines[i].trim()) { out.push('<tr>' + cells(lines[i]).map(function (c) { return '<td>' + inline(c) + '</td>' }).join('') + '</tr>'); i++ }
          out.push('</tbody></table>'); continue
        }
        if (/^\s*<img\s+([^>]*)>\s*$/i.test(line)) {
          flush(); var a = line.match(/^\s*<img\s+([^>]*)>\s*$/i)[1]
          var sm = /(?:^|\s)src\s*=\s*["']?([^"'\s>]+)/i.exec(a); var am = /(?:^|\s)alt\s*=\s*["']?([^"'\s>]+)/i.exec(a); var src = sm ? sm[1] : ''
          if (src && !/^(javascript|data|vbscript):/i.test(src)) out.push('<img src="' + esc(src) + '" alt="' + esc(am ? am[1] : '') + '">')
          i++; continue
        }
        if (/^\s*<\/?[a-zA-Z][^>]*>\s*$/.test(line)) { i++; continue }
        para.push(line); i++
      }
      flush(); return out.join('\n')
    }

    function buildParams(path, sessionId) {
      var p = new URLSearchParams({ path: String(path) })
      if (sessionId) p.set('sessionId', String(sessionId))
      return p
    }
    function contentUrl(path, sessionId, download) {
      var p = buildParams(path, sessionId)
      if (download) p.set('download', '1')
      return '/media-viewer/api/content?' + p.toString()
    }
    function apiJson(endpoint, path, sessionId) {
      return fetch('/media-viewer/api/' + endpoint + '?' + buildParams(path, sessionId).toString(), { headers: { accept: 'application/json' } }).then(function (r) { return r.json() })
    }
    function apiMeta(path, sid) { return apiJson('meta', path, sid) }
    function apiText(path, sid) { return apiJson('text', path, sid) }
    function apiPeek(path, sid) { return apiJson('peek', path, sid) }
    function apiRecent(sid) {
      var p = new URLSearchParams(); if (sid) p.set('sessionId', String(sid))
      return fetch('/media-viewer/api/recent?' + p.toString(), { headers: { accept: 'application/json' } }).then(function (r) { return r.json() })
    }

    function qualifyImgSrcs(html, base, sid) {
      if (!base) return html
      var dir = String(base).replace(/[\\/][^\\/]*$/, '')
      return String(html).replace(/(<img\s+src=")([^"]+?)(")/g, function (_m, pre, src, post) {
        if (/^(https?:)?\/\//i.test(src) || /^data:/i.test(src) || /^[a-z][a-z0-9+.-]*:/i.test(src) || src.indexOf('/media-viewer/api/content') === 0) return _m
        var p = src.charAt(0) === '/' || /^[A-Za-z]:[\\/]/.test(src) ? src : dir + '/' + src
        return pre + contentUrl(p, sid, false).replace(/&/g, '&amp;') + post
      })
    }

    function copyText(value) {
      var text = String(value == null ? '' : value)
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text)
      return new Promise(function (resolve, reject) {
        try {
          var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); resolve()
        } catch (e) { reject(e) }
      })
    }

    function triggerDownload(path, sid) {
      var a = document.createElement('a'); a.href = contentUrl(path, sid, true); a.download = ''; a.rel = 'noopener'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    }

    var open = false
    var docked = true
    var pending = null
    var seq = 0
    var currentSessionId = null
    var listeners = new Set()
    function notify() { listeners.forEach(function (f) { try { f() } catch (e) {} }) }
    function subscribe(f) { listeners.add(f); return function () { listeners.delete(f) } }
    function emit(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail })) } catch (e) {} }
    function setOpen(v) { if (open === v) return; open = v; notify(); emit('dsh-media-viewer-open', open) }
    function setDocked(v) { if (docked === v) return; docked = v; notify(); emit('dsh-media-viewer-dock', docked) }
    function requestOpenPath(path) { seq += 1; pending = { path: String(path), seq: seq }; setDocked(true); setOpen(true); notify(); emit('dsh-media-viewer-path', pending) }
    function setSession(sid) { if (currentSessionId === sid) return; currentSessionId = sid; notify(); emit('dsh-media-viewer-session', sid) }
    function useExternal(read, eventName) {
      var s = useState(read()); var v = s[0]; var setV = s[1]
      useEffect(function () { function changed() { setV(read()) } function dom(e) { setV(e.detail) } var un = subscribe(changed); window.addEventListener(eventName, dom); return function () { un(); window.removeEventListener(eventName, dom) } }, [])
      return v
    }
    function useOpen() { return useExternal(function () { return open }, 'dsh-media-viewer-open') }
    function useDocked() { return useExternal(function () { return docked }, 'dsh-media-viewer-dock') }
    function usePending() { return useExternal(function () { return pending }, 'dsh-media-viewer-path') }
    function useCurrentSession() { return useExternal(function () { return currentSessionId }, 'dsh-media-viewer-session') }

    function findSessionId(x) {
      try {
        if (!x) return undefined
        if (typeof x.sessionId === 'string') return x.sessionId
        if (typeof x.id === 'string') return x.id
        if (x.header && typeof x.header.id === 'string') return x.header.id
        if (x.meta && typeof x.meta.id === 'string') return x.meta.id
      } catch (e) {}
    }
    function useSessionId(props) {
      if (props && typeof props.sessionId === 'string' && props.sessionId) return props.sessionId
      if (props && typeof props.useSession === 'function') { try { return findSessionId(props.useSession()) || null } catch (e) {} }
      return null
    }

    function fmtTime(t) {
      if (!t) return ''
      var d = Math.max(0, Date.now() - t)
      if (d < 60000) return '刚刚'
      if (d < 3600000) return Math.floor(d / 60000) + ' 分钟前'
      if (d < 86400000) return Math.floor(d / 3600000) + ' 小时前'
      return Math.floor(d / 86400000) + ' 天前'
    }
    function icon(kind) { return ({ video: '🎬', audio: '🎵', image: '🖼️', markdown: '📝', text: '📄', pdf: '📕', docx: '📘', document: '📦' })[kind] || '📎' }
    function typeLabel(kind, ext) { return ({ video: '视频', audio: '音频', image: '图片', markdown: 'Markdown', text: '文本', pdf: 'PDF', docx: 'Word', document: '文档' })[kind] || String(ext || '').toUpperCase() || '文件' }

    function FileCard(props) {
      var f = props.file
      var peekState = useState(null); var peek = peekState[0]; var setPeek = peekState[1]
      useEffect(function () {
        if (f.kind !== 'markdown' && f.kind !== 'text') return
        var alive = true; apiPeek(f.path, props.sessionId).then(function (r) { if (alive && r && r.ok) setPeek(r) }).catch(function () {})
        return function () { alive = false }
      }, [f.path, props.sessionId])
      return createElement('button', { className: 'mv-card', onClick: props.onClick, title: f.path },
        createElement('div', { className: 'mv-card-top' }, createElement('span', { className: 'mv-icon' }, icon(f.kind)), createElement('span', { className: 'mv-card-name' }, String(f.path).split(/[\\/]/).pop()), createElement('span', { className: 'mv-time' }, fmtTime(f.time))),
        createElement('div', { className: 'mv-path' }, f.rel || f.path),
        createElement('div', { className: 'mv-meta' }, createElement('span', { className: 'mv-chip' }, typeLabel(f.kind, f.ext)), f.copyable ? createElement('span', { className: 'mv-chip' }, '可复制全文') : null),
        peek && (peek.title || peek.snippet) ? createElement('div', { className: 'mv-snip' }, peek.title ? peek.title + (peek.snippet ? ' · ' + peek.snippet : '') : peek.snippet) : null
      )
    }

    function Viewer(props) {
      var meta = props.meta
      var sid = props.sessionId
      var textState = useState(null); var text = textState[0]; var setText = textState[1]
      var errState = useState(null); var error = errState[0]; var setError = errState[1]
      useEffect(function () {
        setText(null); setError(null)
        if (!meta || (meta.kind !== 'markdown' && meta.kind !== 'text' && meta.kind !== 'docx')) return
        var alive = true
        apiText(meta.path, sid).then(function (r) { if (!alive) return; if (r && r.ok) setText(r.text); else setError(r && r.error ? r.error : '读取失败') }).catch(function (e) { if (alive) setError(String(e && e.message ? e.message : e)) })
        return function () { alive = false }
      }, [meta && meta.path, sid])
      if (!meta) return null
      if (error) return createElement('div', { className: 'mv-error' }, error)
      var src = contentUrl(meta.path, sid, false)
      if (meta.kind === 'video') return createElement('div', { className: 'mv-media-wrap' }, createElement('video', { className: 'mv-video', controls: true, preload: 'metadata', src: src }))
      if (meta.kind === 'audio') return createElement('div', { className: 'mv-media-wrap' }, createElement('audio', { className: 'mv-audio', controls: true, preload: 'metadata', src: src }))
      if (meta.kind === 'image') return createElement('div', { className: 'mv-media-wrap' }, createElement('img', { className: 'mv-image', src: src, alt: meta.name || meta.path }))
      if (meta.kind === 'pdf') return createElement('iframe', { className: 'mv-pdf', src: src, title: meta.name || 'PDF preview' })
      if (meta.kind === 'markdown') {
        if (text === null) return createElement('div', { className: 'mv-empty' }, '加载 Markdown…')
        return createElement('div', { className: 'mv-render', dangerouslySetInnerHTML: { __html: qualifyImgSrcs(mdToHtml(text), meta.path, sid) } })
      }
      if (meta.kind === 'text') {
        if (text === null) return createElement('div', { className: 'mv-empty' }, '加载文本…')
        return createElement('pre', { className: 'mv-pre' }, text)
      }
      if (meta.kind === 'docx') {
        if (text === null) return createElement('div', { className: 'mv-empty' }, '提取 Word 正文…')
        return createElement(Fragment, null, createElement('div', { className: 'mv-doc-note' }, 'Word 预览当前以正文提取模式显示；原文件可直接下载。'), createElement('pre', { className: 'mv-pre' }, text))
      }
      return createElement('div', { className: 'mv-empty' }, '该格式暂不做内嵌预览，但可以直接下载原文件。')
    }

    function PreviewBody(props) {
      var sid = props.sessionId
      var filesState = useState([]); var files = filesState[0]; var setFiles = filesState[1]
      var busyState = useState(false); var busy = busyState[0]; var setBusy = busyState[1]
      var selectedState = useState(null); var selected = selectedState[0]; var setSelected = selectedState[1]
      var inputState = useState(''); var input = inputState[0]; var setInput = inputState[1]
      var expandedState = useState(false); var expanded = expandedState[0]; var setExpanded = expandedState[1]
      var statusState = useState(''); var status = statusState[0]; var setStatus = statusState[1]
      var pendingRef = useRef(null)

      function fetchList() {
        setBusy(true)
        return apiRecent(sid).then(function (r) { setFiles(Array.isArray(r && r.files) ? r.files : []); setBusy(false) }).catch(function () { setBusy(false) })
      }
      function openPath(path) {
        if (!path) return
        setBusy(true); setStatus('')
        apiMeta(path, sid).then(function (r) { setBusy(false); if (r && r.ok) setSelected(r); else setSelected({ path: String(path), error: r && r.error ? r.error : '打开失败' }) }).catch(function (e) { setBusy(false); setSelected({ path: String(path), error: String(e && e.message ? e.message : e) }) })
      }
      useEffect(function () { setFiles([]); setSelected(null); setExpanded(false); fetchList() }, [sid])
      useEffect(function () {
        var p = props.pendingPath
        if (p && p.path && p.seq !== pendingRef.current) { pendingRef.current = p.seq; openPath(p.path) }
      }, [props.pendingPath, sid])

      function onCopy() {
        if (!selected || !selected.copyable) return
        setStatus('提取全文…')
        apiText(selected.path, sid).then(function (r) {
          if (!r || !r.ok) throw new Error(r && r.error ? r.error : '提取失败')
          return copyText(r.text).then(function () { setStatus('已复制全文') })
        }).catch(function (e) { setStatus('复制失败：' + String(e && e.message ? e.message : e)) })
      }

      var inputBar = createElement('div', { className: 'mv-bar' },
        createElement('input', { className: 'mv-input', placeholder: '输入文件路径（相对当前工作目录或绝对路径）', value: input, onChange: function (e) { setInput(e.target.value) }, onKeyDown: function (e) { if (e.key === 'Enter') openPath(input.trim()) } }),
        createElement('button', { className: 'mv-btn', onClick: function () { openPath(input.trim()) } }, '打开'),
        createElement('button', { className: 'mv-btn', onClick: function () { setSelected(null); fetchList() } }, '刷新')
      )

      if (!selected) {
        var visible = expanded ? files : files.slice(0, 10)
        return createElement(Fragment, null, inputBar,
          createElement('div', { className: 'mv-list' }, busy ? createElement('div', { className: 'mv-empty' }, '加载中…') : files.length === 0 ? createElement('div', { className: 'mv-empty' }, '暂无记录。本会话里读写/打开过的媒体和文档会自动出现在这里。') : createElement(Fragment, null,
            visible.map(function (f) { return createElement(FileCard, { key: f.path, file: f, sessionId: sid, onClick: function () { openPath(f.path) } }) }),
            files.length > 10 ? createElement('button', { className: 'mv-more', onClick: function () { setExpanded(!expanded) } }, expanded ? '收起' : '展开全部 ' + files.length + ' 条') : null
          ))
        )
      }

      if (selected.error) return createElement(Fragment, null, inputBar, createElement('div', { className: 'mv-view-head' }, createElement('button', { className: 'mv-btn', onClick: function () { setSelected(null) } }, '← 返回'), createElement('span', { className: 'mv-current' }, selected.path)), createElement('div', { className: 'mv-error' }, selected.error))

      return createElement(Fragment, null,
        inputBar,
        createElement('div', { className: 'mv-view-head' },
          createElement('button', { className: 'mv-btn', onClick: function () { setSelected(null); setStatus('') } }, '← 返回'),
          createElement('span', { className: 'mv-current', title: selected.path }, icon(selected.kind) + ' ' + selected.path),
          selected.copyable ? createElement('button', { className: 'mv-btn', onClick: onCopy }, '复制全文') : null,
          createElement('button', { className: 'mv-btn', onClick: function () { triggerDownload(selected.path, sid) } }, '下载')
        ),
        status ? createElement('div', { className: 'mv-bar' }, createElement('span', { className: 'mv-copy-status' }, status)) : null,
        createElement('div', { className: 'mv-body' }, busy ? createElement('div', { className: 'mv-empty' }, '加载中…') : createElement(Viewer, { meta: selected, sessionId: sid }))
      )
    }

    class Boundary extends react.Component {
      constructor(props) { super(props); this.state = { err: null } }
      componentDidCatch(err) { this.setState({ err: err }) }
      render() { return this.state.err ? createElement('div', { className: 'mv-error' }, '媒体查看器加载失败：' + String(this.state.err.message || this.state.err)) : this.props.children }
    }
    function wrap(C) { return function (props) { return createElement(Boundary, null, createElement(C, props || {})) } }

    function OpenButton(props) {
      var sid = useSessionId(props); useEffect(function () { if (sid) setSession(sid) }, [sid]); var isOpen = useOpen()
      return createElement(Fragment, null, createElement('style', null, CSS), createElement('button', { className: 'mv-open', title: '查看视频、音频、图片和文档', onClick: function () { setOpen(!isOpen) } }, isOpen ? '关闭查看器' : '媒体查看'))
    }

    function FloatingPanel() {
      var isOpen = useOpen(); var isDocked = useDocked(); var p = usePending(); var sid = useCurrentSession()
      var widthState = useState(function () { try { return Number(localStorage.getItem('dsh-media-viewer-width')) || 460 } catch (e) { return 460 } }); var width = widthState[0]; var setWidth = widthState[1]
      var topState = useState(0); var top = topState[0]; var setTop = topState[1]
      var drag = useRef(null)
      function frame() { try { var overlay = document.querySelector('[data-shell-overlay]'); return overlay && overlay.parentElement } catch (e) { return null } }
      useEffect(function () {
        if (!isOpen || !isDocked) { var f0 = frame(); if (f0) f0.style.paddingRight = ''; return }
        function sync() { try { var s = document.querySelector('[data-conversation-scroll]'); if (s) setTop(Math.max(0, Math.round(s.getBoundingClientRect().top))) } catch (e) {} }
        sync(); var f = frame(); if (f) f.style.paddingRight = width + 'px'
        return function () { var f2 = frame(); if (f2) f2.style.paddingRight = '' }
      }, [isOpen, isDocked])
      useEffect(function () { if (isOpen && isDocked) { var f = frame(); if (f) f.style.paddingRight = width + 'px'; try { localStorage.setItem('dsh-media-viewer-width', String(width)) } catch (e) {} } }, [width, isOpen, isDocked])
      if (!isOpen) return null
      function down(e) { drag.current = { x: e.clientX, w: width }; if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault() }
      function move(e) { if (!drag.current) return; var max = Math.round(window.innerWidth * .7); setWidth(Math.max(340, Math.min(max, drag.current.w + drag.current.x - e.clientX))) }
      function up() { drag.current = null }
      var style = isDocked ? { width: width + 'px', top: top + 'px' } : { right: '24px', top: '72px', width: Math.min(720, window.innerWidth - 48) + 'px', height: '78vh' }
      return createElement('div', { className: 'mv-panel' + (isDocked ? ' mv-dock' : ''), style: style },
        createElement('style', null, CSS),
        isDocked ? createElement('div', { className: 'mv-dock-handle', onPointerDown: down, onPointerMove: move, onPointerUp: up, title: '拖动调整宽度' }) : null,
        createElement('div', { className: 'mv-head' }, createElement('span', { className: 'mv-title' }, '媒体 / 文档查看器'), createElement('div', { className: 'mv-actions' }, createElement('button', { className: 'mv-btn', onClick: function () { setDocked(!isDocked) } }, isDocked ? '浮动' : '停靠'), createElement('button', { className: 'mv-btn', onClick: function () { setOpen(false) } }, '✕'))),
        createElement(PreviewBody, { sessionId: sid, pendingPath: p })
      )
    }

    function ViewPage(props) {
      var sid = useSessionId(props)
      return createElement('div', { className: 'mv-page' }, createElement('style', null, CSS), createElement('div', { className: 'mv-page-title' }, '媒体 / 文档查看器'), createElement(PreviewBody, { sessionId: sid }))
    }

    var PATH_RE = /\.(?:mp4|webm|mov|m4v|ogv|mkv|mp3|wav|ogg|oga|m4a|aac|flac|opus|png|jpe?g|gif|webp|avif|bmp|ico|svg|md|markdown|txt|log|jsonl?|ya?ml|toml|ini|conf|cfg|csv|tsv|xml|html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|py|java|kt|kts|c|h|cc|cpp|cxx|hpp|rs|go|rb|php|swift|sh|bash|zsh|fish|ps1|bat|cmd|sql|graphql|gql|env|properties|gradle|pdf|docx?|rtf|odt|xlsx?|ods|pptx?|odp)$/i
    function isSupportedPath(p) { return typeof p === 'string' && PATH_RE.test(p.trim()) }
    function pathOfButton(btn) {
      var p = btn.getAttribute ? (btn.getAttribute('title') || btn.getAttribute('aria-label') || '') : ''
      p = p.replace(/^打开\s+/, '').trim(); if (isSupportedPath(p)) return p
      var txt = (btn.textContent || '').trim(); if (isSupportedPath(txt) && (txt.indexOf('/') >= 0 || txt.indexOf('\\') >= 0)) return txt
      return null
    }
    function onClickCapture(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      var t = e.target; if (!t || typeof t.closest !== 'function') return
      var btn = t.closest('button'); if (!btn || btn.closest('.mv-panel') || btn.closest('.mv-page')) return
      var path = pathOfButton(btn); if (!path) return
      e.preventDefault(); e.stopPropagation(); requestOpenPath(path)
    }

    exports.inject = ['slots', 'layout']
    exports.apply = function (ctx) {
      var disposeClick = null
      try { document.addEventListener('click', onClickCapture, true); disposeClick = function () { document.removeEventListener('click', onClickCapture, true) } } catch (e) {}
      ctx.inject(['slots', 'layout'], function (scope) {
        scope.slots.inject('conversation.session.header.actions', function () {
          return scope.slots.register({ name: 'conversation.session.header.actions', id: 'media-viewer', order: 100, inject: function (sessionId) { return sessionId ? { sessionId: sessionId } : {} } }, wrap(OpenButton))
        })
        scope.slots.inject('shell.overlay', function () {
          return scope.slots.register({ name: 'shell.overlay', id: 'media-viewer-panel', order: 100 }, wrap(FloatingPanel))
        })
        scope.slots.inject('conversation.view', function () {
          return scope.slots.register({ name: 'conversation.view', id: 'media-viewer-view', order: 20, label: '媒体查看', inject: function (sessionId) { return sessionId ? { sessionId: sessionId } : {} } }, wrap(ViewPage))
        })
      })
      return function () { if (disposeClick) disposeClick() }
    }

    return module.exports
  }
})
