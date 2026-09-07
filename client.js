// dsh-media-viewer: DeepSeek Harness plugin (Client side) v0.2.1
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
      '.mv-dock-handle:hover:after{width:3px;background:var(--dsw-alias-state-business-primary,#0969da)}' +
      '.mv-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);background:var(--dsw-alias-bg-module-platform,#f6f8fa);flex:none}.mv-dock .mv-head{background:transparent;padding:12px 16px 10px}' +
      '.mv-title{font-size:14px;font-weight:600}.mv-actions{display:flex;gap:6px;align-items:center}' +
      '.mv-btn,.mv-open,.mv-select{padding:5px 10px;border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:6px;background:var(--dsw-alias-bg-layer-3,#fff);color:inherit;cursor:pointer;font-size:12px}.mv-btn:hover,.mv-open:hover{background:var(--dsw-alias-interactive-bg-hover,#f6f8fa)}.mv-btn:disabled{opacity:.45;cursor:not-allowed}' +
      '.mv-dock .mv-head .mv-btn{border:none;background:transparent}' +
      '.mv-bar{display:flex;gap:8px;padding:9px 14px;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);flex:none;align-items:center}.mv-input{flex:1;min-width:0;padding:6px 8px;border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:6px;background:var(--dsw-specific-input-major,#fff);color:inherit;font-size:12px}' +
      '.mv-list{flex:1;min-height:0;overflow:auto}.mv-card{display:block;width:100%;text-align:left;padding:10px 16px;border:0;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);background:transparent;color:inherit;cursor:pointer}.mv-card:hover{background:var(--dsw-alias-interactive-bg-hover,#f6f8fa)}' +
      '.mv-card-top{display:flex;gap:8px;align-items:center}.mv-icon{width:22px;flex:none;text-align:center}.mv-card-name{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}.mv-time{font-size:11px;opacity:.58;flex:none}.mv-path{font:10.5px ui-monospace,SFMono-Regular,Menlo,monospace;opacity:.55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px}.mv-snip{font-size:11px;opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:4px}.mv-meta{display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap}.mv-chip{font-size:10px;border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:999px;padding:1px 6px;opacity:.78}' +
      '.mv-empty,.mv-error{padding:18px 16px;opacity:.72}.mv-error{color:var(--dsw-alias-state-error-primary,#c0392b)}.mv-more{display:block;width:100%;text-align:left;padding:8px 16px;border:0;background:transparent;color:var(--dsw-alias-state-business-primary,#0969da);cursor:pointer}' +
      '.mv-view-head{display:flex;gap:8px;align-items:center;padding:8px 14px;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);flex:none}.mv-current{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;opacity:.7}' +
      '.mv-body{flex:1;min-height:0;overflow:auto;padding:14px 16px}.mv-media-shell{height:100%;min-height:0;display:flex;flex-direction:column;gap:8px}.mv-media-wrap{width:100%;min-height:0;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-1,#f6f8fa);border-radius:8px;overflow:hidden;outline:none}.mv-video-wrap{flex:0 1 auto;width:100%;max-height:calc(100vh - 250px);background:#000}.mv-video{display:block;width:100%;height:100%;max-width:100%;max-height:calc(100vh - 250px);object-fit:contain;background:#000}.mv-audio-wrap{flex:1;min-height:180px}.mv-audio{width:min(680px,92%)}.mv-image{max-width:100%;max-height:100%;object-fit:contain}.mv-pdf{width:100%;height:100%;min-height:560px;border:0;background:#fff}.mv-media-tools{display:flex;align-items:center;gap:8px;font-size:11px;opacity:.82;flex-wrap:wrap}.mv-media-hint{opacity:.62}' +
      '.mv-pre{margin:0;white-space:pre-wrap;word-break:break-word;font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace}.mv-doc-note{font-size:11px;opacity:.65;margin-bottom:10px}.mv-copy-status{font-size:11px;opacity:.72}' +
      '.mv-render{line-height:1.62;word-wrap:break-word}.mv-render h1,.mv-render h2,.mv-render h3,.mv-render h4,.mv-render h5,.mv-render h6{margin:16px 0 8px;font-weight:600;line-height:1.3}.mv-render h1{font-size:20px;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);padding-bottom:6px}.mv-render h2{font-size:17px;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de);padding-bottom:4px}.mv-render h3{font-size:15px}.mv-render p{margin:8px 0}.mv-render ul,.mv-render ol{margin:8px 0;padding-left:22px}.mv-render li{margin:3px 0}.mv-render code{background:var(--dsw-alias-markdown-inline-code,#f0f2f4);padding:1px 5px;border-radius:4px;font:12px ui-monospace,SFMono-Regular,Menlo,monospace}.mv-render pre.mv-code{background:var(--dsw-alias-markdown-code-block,#f6f8fa);border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:8px;padding:10px 12px;overflow:auto}.mv-render pre.mv-code code{background:transparent;padding:0;display:block}.mv-render table{border-collapse:collapse;display:block;overflow:auto;max-width:100%;margin:10px 0}.mv-render th,.mv-render td{border:1px solid var(--dsw-alias-border-l2,#d0d7de);padding:5px 9px;font-size:12px}.mv-render th{background:var(--dsw-alias-bg-module-platform,#f6f8fa)}.mv-render blockquote{margin:8px 0;padding:2px 12px;border-left:3px solid var(--dsw-alias-border-l2,#d0d7de);opacity:.8}.mv-render hr{border:0;border-top:1px solid var(--dsw-alias-border-l1,#d0d7de);margin:12px 0}.mv-render img{max-width:100%;height:auto}.mv-render a{color:var(--dsw-alias-state-business-primary,#0969da)}' +
      '.mv-sub-list{display:flex;flex-direction:column;gap:8px}.mv-sub-item{display:grid;grid-template-columns:110px 1fr;gap:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1,#d0d7de);border-radius:7px}.mv-sub-time{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;opacity:.65}.mv-sub-text{white-space:pre-wrap;line-height:1.5}' +
      '.mv-sheet-tabs{display:flex;gap:6px;overflow:auto;padding-bottom:8px}.mv-sheet-tab{white-space:nowrap}.mv-sheet-wrap{overflow:auto;border:1px solid var(--dsw-alias-border-l1,#d0d7de);border-radius:7px;max-height:calc(100vh - 260px)}.mv-sheet{border-collapse:collapse;min-width:100%;font-size:11px}.mv-sheet th,.mv-sheet td{border:1px solid var(--dsw-alias-border-l1,#d0d7de);padding:4px 7px;white-space:pre-wrap;vertical-align:top;max-width:360px;word-break:break-word}.mv-sheet th{position:sticky;top:0;background:var(--dsw-alias-bg-module-platform,#f6f8fa);z-index:2}.mv-sheet .mv-rowno{position:sticky;left:0;background:var(--dsw-alias-bg-module-platform,#f6f8fa);z-index:1;text-align:right;opacity:.7;min-width:36px}.mv-sheet th.mv-rowno{z-index:3}.mv-struct-note{font-size:11px;opacity:.65;margin:7px 0}' +
      '.mv-ppt-tools{display:flex;gap:8px;align-items:center;margin-bottom:10px}.mv-ppt-count{font-size:11px;opacity:.65}.mv-slide{aspect-ratio:16/9;border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:9px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 3px 14px rgba(0,0,0,.08);padding:5% 6%;overflow:auto;display:flex;flex-direction:column;gap:12px}.mv-slide-title{font-size:22px;font-weight:650;line-height:1.25}.mv-slide-lines{display:flex;flex-direction:column;gap:8px;font-size:14px;line-height:1.45}.mv-slide-line{white-space:pre-wrap}.mv-slide-no{text-align:right;font-size:10px;opacity:.55;margin-top:6px}' +
      '.mv-page{height:100%;min-height:480px;display:flex;flex-direction:column;overflow:hidden}.mv-page-title{padding:12px 16px;font-weight:600;border-bottom:1px solid var(--dsw-alias-border-l1,#d0d7de)}' +
      '.mv-chat-file-code{cursor:pointer!important;text-decoration:underline dotted;text-underline-offset:2px}'

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
    function apiStructured(path, sid) { return apiJson('structured', path, sid) }
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
        var path = (src.charAt(0) === '/' || /^[a-zA-Z]:[\\/]/.test(src)) ? src : dir + '/' + src
        return pre + contentUrl(path, sid, false).replace(/&/g, '&amp;') + post
      })
    }

    function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(String(text || ''))
      return new Promise(function (resolve, reject) {
        try {
          var ta = document.createElement('textarea'); ta.value = String(text || ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); resolve()
        } catch (e) { reject(e) }
      })
    }
    function triggerDownload(path, sid) {
      var a = document.createElement('a'); a.href = contentUrl(path, sid, true); a.download = String(path).split(/[\\/]/).pop() || 'download'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove()
    }

    var open = false
    var docked = true
    var pending = null
    var pendingSeq = 0
    var currentSessionId = null
    var layoutSvc = null
    var listeners = new Set()
    function emit(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail })) } catch (e) {} }
    function notify() { listeners.forEach(function (f) { try { f() } catch (e) {} }) }
    function subscribe(f) { listeners.add(f); return function () { listeners.delete(f) } }
    function setOpen(v) { if (open === v) return; open = v; notify(); emit('dsh-media-viewer-open', v) }
    function setDocked(v) { if (docked === v) return; docked = v; notify(); emit('dsh-media-viewer-dock', v) }
    function requestOpenPath(path) { pendingSeq += 1; pending = { path: String(path), seq: pendingSeq }; setDocked(true); setOpen(true); notify(); emit('dsh-media-viewer-path', pending) }
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
    function icon(kind) { return ({ video: '🎬', audio: '🎵', image: '🖼️', markdown: '📝', subtitle: '💬', text: '📄', pdf: '📕', docx: '📘', xlsx: '📊', pptx: '📽️', document: '📦' })[kind] || '📎' }
    function typeLabel(kind, ext) { return ({ video: '视频', audio: '音频', image: '图片', markdown: 'Markdown', subtitle: '字幕', text: '文本', pdf: 'PDF', docx: 'Word', xlsx: 'Excel', pptx: 'PowerPoint', document: '文档' })[kind] || String(ext || '').toUpperCase() || '文件' }

    function FileCard(props) {
      var f = props.file
      var peekState = useState(null); var peek = peekState[0]; var setPeek = peekState[1]
      useEffect(function () {
        if (f.kind !== 'markdown' && f.kind !== 'text' && f.kind !== 'subtitle') return
        var alive = true; apiPeek(f.path, props.sessionId).then(function (r) { if (alive && r && r.ok) setPeek(r) }).catch(function () {})
        return function () { alive = false }
      }, [f.path, props.sessionId])
      return createElement('button', { className: 'mv-card', onClick: props.onClick, title: f.path },
        createElement('div', { className: 'mv-card-top' }, createElement('span', { className: 'mv-icon' }, icon(f.kind)), createElement('span', { className: 'mv-card-name' }, String(f.path).split(/[\\/]/).pop()), createElement('span', { className: 'mv-time' }, fmtTime(f.time))),
        createElement('div', { className: 'mv-path' }, f.rel || f.path),
        createElement('div', { className: 'mv-meta' }, createElement('span', { className: 'mv-chip' }, typeLabel(f.kind, f.ext)), f.copyable ? createElement('span', { className: 'mv-chip' }, '可复制全文') : null, f.structured ? createElement('span', { className: 'mv-chip' }, '结构化预览') : null),
        peek && (peek.title || peek.snippet) ? createElement('div', { className: 'mv-snip' }, peek.title ? peek.title + (peek.snippet ? ' · ' + peek.snippet : '') : peek.snippet) : null
      )
    }

    function MediaPlayer(props) {
      var mediaRef = useRef(null)
      var rateState = useState(1); var rate = rateState[0]; var setRate = rateState[1]
      var aspectState = useState('16 / 9'); var aspect = aspectState[0]; var setAspect = aspectState[1]
      useEffect(function () { if (mediaRef.current) mediaRef.current.playbackRate = rate }, [rate, props.src])
      useEffect(function () { setAspect('16 / 9') }, [props.src])
      function onMetadata() {
        var m = mediaRef.current
        if (!m || props.kind !== 'video') return
        var w = Number(m.videoWidth || 0); var h = Number(m.videoHeight || 0)
        if (w > 0 && h > 0) setAspect(w + ' / ' + h)
      }
      function keyDown(e) {
        var m = mediaRef.current
        if (!m) return
        if (e.key === ' ' || e.key === 'k' || e.key === 'K') { e.preventDefault(); if (m.paused) m.play().catch(function () {}); else m.pause() }
        else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') { e.preventDefault(); m.currentTime = Math.max(0, (m.currentTime || 0) - 5) }
        else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') { e.preventDefault(); m.currentTime = Math.min(Number.isFinite(m.duration) ? m.duration : Infinity, (m.currentTime || 0) + 5) }
      }
      var isVideo = props.kind === 'video'
      var media = isVideo
        ? createElement('video', { ref: mediaRef, className: 'mv-video', controls: true, preload: 'metadata', src: props.src, playsInline: true, onLoadedMetadata: onMetadata })
        : createElement('audio', { ref: mediaRef, className: 'mv-audio', controls: true, preload: 'metadata', src: props.src })
      return createElement('div', { className: 'mv-media-shell' },
        createElement('div', { className: 'mv-media-wrap ' + (isVideo ? 'mv-video-wrap' : 'mv-audio-wrap'), style: isVideo ? { aspectRatio: aspect } : undefined, tabIndex: 0, onKeyDown: keyDown, title: '点击后可用空格播放/暂停，←/→ 快退快进 5 秒' }, media),
        createElement('div', { className: 'mv-media-tools' },
          createElement('span', null, '倍速'),
          createElement('select', { className: 'mv-select', value: String(rate), onChange: function (e) { setRate(Number(e.target.value) || 1) } },
            [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(function (x) { return createElement('option', { key: String(x), value: String(x) }, x + '×') })
          ),
          createElement('span', { className: 'mv-media-hint' }, '视频会按原始宽高比自适应当前面板 · 空格/K 播放暂停 · ←/J 后退5秒 · →/L 前进5秒')
        )
      )
    }

    function parseSubtitle(text, ext) {
      var raw = String(text || '').replace(/\r\n/g, '\n')
      var cues = []
      if (ext === 'ass' || ext === 'ssa') {
        raw.split('\n').forEach(function (line) {
          if (!/^Dialogue\s*:/i.test(line)) return
          var body = line.replace(/^Dialogue\s*:\s*/i, '')
          var parts = body.split(',')
          if (parts.length < 10) return
          var start = parts[1] || ''; var end = parts[2] || ''; var caption = parts.slice(9).join(',').replace(/\{[^}]*\}/g, '').replace(/\\N/g, '\n')
          if (caption.trim()) cues.push({ time: start + ' → ' + end, text: caption.trim() })
        })
        return cues
      }
      if (ext === 'lrc') {
        raw.split('\n').forEach(function (line) {
          var m = line.match(/^\s*(\[[0-9]{1,2}:[0-9]{2}(?:[.:][0-9]{1,3})?\])+(.*)$/)
          if (m && m[2].trim()) cues.push({ time: line.slice(0, line.indexOf(m[2])), text: m[2].trim() })
        })
        return cues
      }
      var blocks = raw.replace(/^WEBVTT[^\n]*\n+/i, '').split(/\n{2,}/)
      blocks.forEach(function (block) {
        var lines = block.split('\n').filter(function (x) { return x.trim() !== '' })
        if (!lines.length) return
        var ti = lines.findIndex(function (x) { return /-->/g.test(x) })
        if (ti < 0) return
        var caption = lines.slice(ti + 1).join('\n').replace(/<[^>]+>/g, '').trim()
        if (caption) cues.push({ time: lines[ti].trim(), text: caption })
      })
      return cues
    }

    function SubtitleViewer(props) {
      var cues = parseSubtitle(props.text, props.ext)
      if (!cues.length) return createElement('pre', { className: 'mv-pre' }, props.text)
      return createElement(Fragment, null,
        createElement('div', { className: 'mv-doc-note' }, '已解析 ' + cues.length + ' 条字幕。复制全文会复制原始字幕文件内容。'),
        createElement('div', { className: 'mv-sub-list' }, cues.slice(0, 3000).map(function (cue, i) {
          return createElement('div', { className: 'mv-sub-item', key: String(i) }, createElement('div', { className: 'mv-sub-time' }, cue.time), createElement('div', { className: 'mv-sub-text' }, cue.text))
        })),
        cues.length > 3000 ? createElement('div', { className: 'mv-struct-note' }, '字幕条目过多，预览只显示前 3000 条；复制全文不受此限制。') : null
      )
    }

    function SpreadsheetViewer(props) {
      var data = props.data || {}
      var sheets = Array.isArray(data.sheets) ? data.sheets : []
      var idxState = useState(0); var idx = idxState[0]; var setIdx = idxState[1]
      useEffect(function () { setIdx(0) }, [props.path])
      if (!sheets.length) return createElement('div', { className: 'mv-empty' }, '工作簿中没有可显示的工作表。')
      var sheet = sheets[Math.min(idx, sheets.length - 1)]
      var maxCols = 0
      ;(sheet.rows || []).forEach(function (r) { if (r.length > maxCols) maxCols = r.length })
      var headers = []
      for (var c = 0; c < maxCols; c += 1) headers.push(columnName(c + 1))
      return createElement(Fragment, null,
        createElement('div', { className: 'mv-sheet-tabs' }, sheets.map(function (s, i) { return createElement('button', { key: s.name + i, className: 'mv-btn mv-sheet-tab', disabled: i === idx, onClick: function () { setIdx(i) } }, s.name) })),
        createElement('div', { className: 'mv-struct-note' }, '工作表：' + sheet.name + ' · ' + sheet.rowCount + ' 行 × ' + sheet.columnCount + ' 列' + (sheet.truncated ? ' · 为保证流畅，当前只显示前 250 行 / 80 列' : '')),
        createElement('div', { className: 'mv-sheet-wrap' },
          createElement('table', { className: 'mv-sheet' },
            createElement('thead', null, createElement('tr', null, createElement('th', { className: 'mv-rowno' }, '#'), headers.map(function (h) { return createElement('th', { key: h }, h) }))),
            createElement('tbody', null, (sheet.rows || []).map(function (row, ri) {
              return createElement('tr', { key: String(ri) }, createElement('td', { className: 'mv-rowno' }, ri + 1), headers.map(function (_h, ci) { return createElement('td', { key: String(ci) }, row[ci] === undefined ? '' : String(row[ci])) }))
            }))
          )
        ),
        data.truncated ? createElement('div', { className: 'mv-struct-note' }, '预览做了尺寸限制；“复制全文”会继续按整个工作簿提取，直到全文安全上限。') : null
      )
    }

    function columnName(n) {
      var s = ''
      while (n > 0) { n -= 1; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) }
      return s
    }

    function PptxViewer(props) {
      var data = props.data || {}
      var slides = Array.isArray(data.slides) ? data.slides : []
      var idxState = useState(0); var idx = idxState[0]; var setIdx = idxState[1]
      useEffect(function () { setIdx(0) }, [props.path])
      if (!slides.length) return createElement('div', { className: 'mv-empty' }, '没有从演示文稿中提取到可显示的幻灯片文字。')
      var slide = slides[Math.min(idx, slides.length - 1)]
      var lines = Array.isArray(slide.texts) ? slide.texts : []
      return createElement(Fragment, null,
        createElement('div', { className: 'mv-ppt-tools' },
          createElement('button', { className: 'mv-btn', disabled: idx <= 0, onClick: function () { setIdx(Math.max(0, idx - 1)) } }, '← 上一页'),
          createElement('button', { className: 'mv-btn', disabled: idx >= slides.length - 1, onClick: function () { setIdx(Math.min(slides.length - 1, idx + 1)) } }, '下一页 →'),
          createElement('span', { className: 'mv-ppt-count' }, '第 ' + (idx + 1) + ' / ' + data.slideCount + ' 页')
        ),
        createElement('div', { className: 'mv-doc-note' }, 'PowerPoint 当前提供“页面文字结构预览”，不保证还原原始字体、图片和排版；下载按钮始终保留原 PPTX。'),
        createElement('div', { className: 'mv-slide' },
          createElement('div', { className: 'mv-slide-title' }, lines[0] || slide.title || ('Slide ' + slide.number)),
          createElement('div', { className: 'mv-slide-lines' }, lines.slice(1).map(function (line, i) { return createElement('div', { className: 'mv-slide-line', key: String(i) }, line) }))
        ),
        createElement('div', { className: 'mv-slide-no' }, 'Slide ' + slide.number),
        data.truncated ? createElement('div', { className: 'mv-struct-note' }, '演示文稿页数较多，结构化预览只加载前 200 页。') : null
      )
    }

    function Viewer(props) {
      var meta = props.meta
      var sid = props.sessionId
      var textState = useState(null); var text = textState[0]; var setText = textState[1]
      var structState = useState(null); var struct = structState[0]; var setStruct = structState[1]
      var errState = useState(null); var error = errState[0]; var setError = errState[1]
      useEffect(function () {
        setText(null); setStruct(null); setError(null)
        if (!meta) return
        var alive = true
        if (meta.kind === 'markdown' || meta.kind === 'text' || meta.kind === 'subtitle' || meta.kind === 'docx') {
          apiText(meta.path, sid).then(function (r) { if (!alive) return; if (r && r.ok) setText(r.text); else setError(r && r.error ? r.error : '读取失败') }).catch(function (e) { if (alive) setError(String(e && e.message ? e.message : e)) })
        } else if (meta.structured) {
          apiStructured(meta.path, sid).then(function (r) { if (!alive) return; if (r && r.ok) setStruct(r.data); else setError(r && r.error ? r.error : '结构化预览失败') }).catch(function (e) { if (alive) setError(String(e && e.message ? e.message : e)) })
        }
        return function () { alive = false }
      }, [meta && meta.path, sid])
      if (!meta) return null
      if (error) return createElement('div', { className: 'mv-error' }, error)
      var src = contentUrl(meta.path, sid, false)
      if (meta.kind === 'video' || meta.kind === 'audio') return createElement(MediaPlayer, { kind: meta.kind, src: src })
      if (meta.kind === 'image') return createElement('div', { className: 'mv-media-wrap' }, createElement('img', { className: 'mv-image', src: src, alt: meta.name || meta.path }))
      if (meta.kind === 'pdf') return createElement('iframe', { className: 'mv-pdf', src: src, title: meta.name || 'PDF preview' })
      if (meta.kind === 'markdown') {
        if (text === null) return createElement('div', { className: 'mv-empty' }, '加载 Markdown…')
        return createElement('div', { className: 'mv-render', dangerouslySetInnerHTML: { __html: qualifyImgSrcs(mdToHtml(text), meta.path, sid) } })
      }
      if (meta.kind === 'subtitle') {
        if (text === null) return createElement('div', { className: 'mv-empty' }, '解析字幕…')
        return createElement(SubtitleViewer, { text: text, ext: meta.ext })
      }
      if (meta.kind === 'text') {
        if (text === null) return createElement('div', { className: 'mv-empty' }, '加载文本…')
        return createElement('pre', { className: 'mv-pre' }, text)
      }
      if (meta.kind === 'docx') {
        if (text === null) return createElement('div', { className: 'mv-empty' }, '提取 Word 正文…')
        return createElement(Fragment, null, createElement('div', { className: 'mv-doc-note' }, 'Word 预览当前以正文提取模式显示；原文件可直接下载。'), createElement('pre', { className: 'mv-pre' }, text))
      }
      if (meta.kind === 'xlsx') {
        if (struct === null) return createElement('div', { className: 'mv-empty' }, '解析 Excel 工作簿…')
        return createElement(SpreadsheetViewer, { data: struct, path: meta.path })
      }
      if (meta.kind === 'pptx') {
        if (struct === null) return createElement('div', { className: 'mv-empty' }, '解析 PowerPoint…')
        return createElement(PptxViewer, { data: struct, path: meta.path })
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
      var widthState = useState(function () { try { return Number(localStorage.getItem('dsh-media-viewer-width')) || 500 } catch (e) { return 500 } }); var width = widthState[0]; var setWidth = widthState[1]
      var topState = useState(0); var top = topState[0]; var setTop = topState[1]
      var drag = useRef(null)
      function frame() { try { var overlay = document.querySelector('[data-shell-overlay]'); return overlay && overlay.parentElement } catch (e) { return null } }
      useEffect(function () {
        if (!isOpen || !isDocked) { var f0 = frame(); if (f0) f0.style.paddingRight = ''; return }
        function sync() { try { var s = document.querySelector('[data-conversation-scroll]'); if (s) setTop(Math.max(0, Math.round(s.getBoundingClientRect().top))) } catch (e) {} }
        sync(); var f = frame(); if (f) f.style.paddingRight = width + 'px'; try { if (layoutSvc && layoutSvc.closeDetails) layoutSvc.closeDetails() } catch (e) {}
        return function () { var f2 = frame(); if (f2) f2.style.paddingRight = '' }
      }, [isOpen, isDocked])
      useEffect(function () { if (isOpen && isDocked) { var f = frame(); if (f) f.style.paddingRight = width + 'px'; try { localStorage.setItem('dsh-media-viewer-width', String(width)) } catch (e) {} } }, [width, isOpen, isDocked])
      if (!isOpen) return null
      function down(e) { drag.current = { x: e.clientX, w: width }; if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault() }
      function move(e) { if (!drag.current) return; var max = Math.round(window.innerWidth * .75); setWidth(Math.max(360, Math.min(max, drag.current.w + drag.current.x - e.clientX))) }
      function up() { drag.current = null }
      var style = isDocked ? { width: width + 'px', top: top + 'px' } : { right: '24px', top: '72px', width: Math.min(820, window.innerWidth - 48) + 'px', height: '80vh' }
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

    var PATH_RE = /\.(?:mp4|webm|mov|m4v|ogv|mkv|mp3|wav|ogg|oga|m4a|aac|flac|opus|png|jpe?g|gif|webp|avif|bmp|ico|svg|md|markdown|srt|vtt|ass|ssa|lrc|txt|log|jsonl?|ya?ml|toml|ini|conf|cfg|csv|tsv|xml|html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|py|java|kt|kts|c|h|cc|cpp|cxx|hpp|rs|go|rb|php|swift|sh|bash|zsh|fish|ps1|bat|cmd|sql|graphql|gql|env|properties|gradle|pdf|docx?|rtf|odt|xlsx?|ods|pptx?|odp)$/i
    var PATH_TOKEN_RE = /([^\s<>"'`]+\.(?:mp4|webm|mov|m4v|ogv|mkv|mp3|wav|ogg|oga|m4a|aac|flac|opus|png|jpe?g|gif|webp|avif|bmp|ico|svg|md|markdown|srt|vtt|ass|ssa|lrc|txt|log|jsonl?|ya?ml|toml|ini|conf|cfg|csv|tsv|xml|html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|py|java|kt|kts|c|h|cc|cpp|cxx|hpp|rs|go|rb|php|swift|sh|bash|zsh|fish|ps1|bat|cmd|sql|graphql|gql|env|properties|gradle|pdf|docx?|rtf|odt|xlsx?|ods|pptx?|odp))/i
    function isSupportedPath(p) { return typeof p === 'string' && PATH_RE.test(p.trim()) }
    function decodeCandidate(s) { try { return decodeURIComponent(s) } catch (e) { return s } }
    function cleanCandidate(raw) {
      if (raw === null || raw === undefined) return null
      var s = decodeCandidate(String(raw)).trim()
      if (!s) return null
      try {
        if (/^(?:https?|file|vscode):/i.test(s)) {
          var u = new URL(s, window.location.href)
          var qp = u.searchParams.get('path') || u.searchParams.get('file') || u.searchParams.get('filename')
          if (qp && isSupportedPath(qp)) return qp
          if (u.protocol === 'file:' || u.protocol === 'vscode:') {
            var pn = decodeCandidate(u.pathname || '').replace(/^\/([A-Za-z]:[\\/])/, '$1')
            if (isSupportedPath(pn)) return pn
          }
        }
      } catch (e) {}
      s = s.replace(/^["'`]+|["'`]+$/g, '')
        .replace(/^(?:打开|查看|预览|下载|文件|open|view|preview|download|file)\s*(?:文件)?\s*[:：-]?\s*/i, '')
        .trim()
      if (isSupportedPath(s)) return s
      var m = PATH_TOKEN_RE.exec(s)
      return m && isSupportedPath(m[1]) ? m[1] : null
    }
    function pathOfElement(el) {
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
    function onPointerOverCapture(e) {
      var t = e.target; if (!t || typeof t.closest !== 'function') return
      if (t.closest('.mv-panel') || t.closest('.mv-page')) return
      var code = t.closest('code')
      if (!code) return
      var path = cleanCandidate(code.textContent || '')
      if (!path) return
      try {
        code.classList.add('mv-chat-file-code')
        code.setAttribute('title', '点击用媒体查看器打开：' + path)
      } catch (err) {}
    }

    exports.inject = ['slots', 'layout']
    exports.apply = function (ctx) {
      var disposeClick = null
      var disposeHover = null
      try {
        document.addEventListener('click', onClickCapture, true)
        document.addEventListener('pointerover', onPointerOverCapture, true)
        disposeClick = function () { document.removeEventListener('click', onClickCapture, true) }
        disposeHover = function () { document.removeEventListener('pointerover', onPointerOverCapture, true) }
      } catch (e) {}
      ctx.inject(['slots', 'layout'], function (scope) {
        layoutSvc = scope.layout || null
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
      return function () { if (disposeClick) disposeClick(); if (disposeHover) disposeHover() }
    }

    return module.exports
  }
})
