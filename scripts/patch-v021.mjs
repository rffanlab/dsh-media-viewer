import fs from 'node:fs'

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`patch target not found: ${label}`)
  return text.replace(from, to)
}

let client = fs.readFileSync('client.js', 'utf8')
client = replaceOnce(client,
  '// dsh-media-viewer: DeepSeek Harness plugin (Client side) v0.2',
  '// dsh-media-viewer: DeepSeek Harness plugin (Client side) v0.2.1',
  'client version')

client = replaceOnce(client,
  "'.mv-body{flex:1;min-height:0;overflow:auto;padding:14px 16px}.mv-media-shell{height:100%;min-height:320px;display:flex;flex-direction:column;gap:8px}.mv-media-wrap{flex:1;min-height:260px;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-1,#f6f8fa);border-radius:8px;overflow:hidden;outline:none}.mv-video{width:100%;height:100%;max-height:100%;background:#000}.mv-audio{width:min(680px,92%)}.mv-image{max-width:100%;max-height:100%;object-fit:contain}.mv-pdf{width:100%;height:100%;min-height:560px;border:0;background:#fff}.mv-media-tools{display:flex;align-items:center;gap:8px;font-size:11px;opacity:.82;flex-wrap:wrap}.mv-media-hint{opacity:.62}' +",
  "'.mv-body{flex:1;min-height:0;overflow:auto;padding:14px 16px}.mv-media-shell{height:100%;min-height:0;display:flex;flex-direction:column;gap:8px}.mv-media-wrap{width:100%;min-height:0;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-1,#f6f8fa);border-radius:8px;overflow:hidden;outline:none}.mv-video-wrap{flex:0 1 auto;width:100%;max-height:calc(100vh - 250px);background:#000}.mv-video{display:block;width:100%;height:100%;max-width:100%;max-height:calc(100vh - 250px);object-fit:contain;background:#000}.mv-audio-wrap{flex:1;min-height:180px}.mv-audio{width:min(680px,92%)}.mv-image{max-width:100%;max-height:100%;object-fit:contain}.mv-pdf{width:100%;height:100%;min-height:560px;border:0;background:#fff}.mv-media-tools{display:flex;align-items:center;gap:8px;font-size:11px;opacity:.82;flex-wrap:wrap}.mv-media-hint{opacity:.62}' +",
  'responsive media CSS')

const oldPlayer = `    function MediaPlayer(props) {
      var mediaRef = useRef(null)
      var rateState = useState(1); var rate = rateState[0]; var setRate = rateState[1]
      useEffect(function () { if (mediaRef.current) mediaRef.current.playbackRate = rate }, [rate, props.src])
      function keyDown(e) {
        var m = mediaRef.current
        if (!m) return
        if (e.key === ' ' || e.key === 'k' || e.key === 'K') { e.preventDefault(); if (m.paused) m.play().catch(function () {}); else m.pause() }
        else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') { e.preventDefault(); m.currentTime = Math.max(0, (m.currentTime || 0) - 5) }
        else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') { e.preventDefault(); m.currentTime = Math.min(Number.isFinite(m.duration) ? m.duration : Infinity, (m.currentTime || 0) + 5) }
      }
      var media = props.kind === 'video'
        ? createElement('video', { ref: mediaRef, className: 'mv-video', controls: true, preload: 'metadata', src: props.src, playsInline: true })
        : createElement('audio', { ref: mediaRef, className: 'mv-audio', controls: true, preload: 'metadata', src: props.src })
      return createElement('div', { className: 'mv-media-shell' },
        createElement('div', { className: 'mv-media-wrap', tabIndex: 0, onKeyDown: keyDown, title: '点击后可用空格播放/暂停，←/→ 快退快进 5 秒' }, media),
        createElement('div', { className: 'mv-media-tools' },
          createElement('span', null, '倍速'),
          createElement('select', { className: 'mv-select', value: String(rate), onChange: function (e) { setRate(Number(e.target.value) || 1) } },
            [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(function (x) { return createElement('option', { key: String(x), value: String(x) }, x + '×') })
          ),
          createElement('span', { className: 'mv-media-hint' }, '点击播放器区域后：空格/K 播放暂停 · ←/J 后退5秒 · →/L 前进5秒')
        )
      )
    }`

const newPlayer = `    function MediaPlayer(props) {
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
    }`
client = replaceOnce(client, oldPlayer, newPlayer, 'MediaPlayer')

const oldClick = `    var PATH_RE = /\\.(?:mp4|webm|mov|m4v|ogv|mkv|mp3|wav|ogg|oga|m4a|aac|flac|opus|png|jpe?g|gif|webp|avif|bmp|ico|svg|md|markdown|srt|vtt|ass|ssa|lrc|txt|log|jsonl?|ya?ml|toml|ini|conf|cfg|csv|tsv|xml|html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|py|java|kt|kts|c|h|cc|cpp|cxx|hpp|rs|go|rb|php|swift|sh|bash|zsh|fish|ps1|bat|cmd|sql|graphql|gql|env|properties|gradle|pdf|docx?|rtf|odt|xlsx?|ods|pptx?|odp)$/i
    function isSupportedPath(p) { return typeof p === 'string' && PATH_RE.test(p.trim()) }
    function pathOfButton(btn) {
      var p = btn.getAttribute ? (btn.getAttribute('title') || btn.getAttribute('aria-label') || '') : ''
      p = p.replace(/^打开\\s+/, '').trim(); if (isSupportedPath(p)) return p
      var txt = (btn.textContent || '').trim(); if (isSupportedPath(txt) && (txt.indexOf('/') >= 0 || txt.indexOf('\\\\') >= 0)) return txt
      return null
    }
    function onClickCapture(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      var t = e.target; if (!t || typeof t.closest !== 'function') return
      var btn = t.closest('button'); if (!btn || btn.closest('.mv-panel') || btn.closest('.mv-page')) return
      var path = pathOfButton(btn); if (!path) return
      e.preventDefault(); e.stopPropagation(); requestOpenPath(path)
    }`

const newClick = `    var PATH_RE = /\\.(?:mp4|webm|mov|m4v|ogv|mkv|mp3|wav|ogg|oga|m4a|aac|flac|opus|png|jpe?g|gif|webp|avif|bmp|ico|svg|md|markdown|srt|vtt|ass|ssa|lrc|txt|log|jsonl?|ya?ml|toml|ini|conf|cfg|csv|tsv|xml|html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|py|java|kt|kts|c|h|cc|cpp|cxx|hpp|rs|go|rb|php|swift|sh|bash|zsh|fish|ps1|bat|cmd|sql|graphql|gql|env|properties|gradle|pdf|docx?|rtf|odt|xlsx?|ods|pptx?|odp)$/i
    var PATH_TOKEN_RE = /([^\\s<>\"'\x60]+\\.(?:mp4|webm|mov|m4v|ogv|mkv|mp3|wav|ogg|oga|m4a|aac|flac|opus|png|jpe?g|gif|webp|avif|bmp|ico|svg|md|markdown|srt|vtt|ass|ssa|lrc|txt|log|jsonl?|ya?ml|toml|ini|conf|cfg|csv|tsv|xml|html?|css|scss|less|js|mjs|cjs|jsx|ts|tsx|py|java|kt|kts|c|h|cc|cpp|cxx|hpp|rs|go|rb|php|swift|sh|bash|zsh|fish|ps1|bat|cmd|sql|graphql|gql|env|properties|gradle|pdf|docx?|rtf|odt|xlsx?|ods|pptx?|odp))/i
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
            var pn = decodeCandidate(u.pathname || '').replace(/^\\/([A-Za-z]:[\\\\/])/, '$1')
            if (isSupportedPath(pn)) return pn
          }
        }
      } catch (e) {}
      s = s.replace(/^[\"'\x60]+|[\"'\x60]+$/g, '')
        .replace(/^(?:打开|查看|预览|下载|文件|open|view|preview|download|file)\\s*(?:文件)?\\s*[:：-]?\\s*/i, '')
        .trim()
      if (isSupportedPath(s)) return s
      var m = PATH_TOKEN_RE.exec(s)
      return m && isSupportedPath(m[1]) ? m[1] : null
    }
    function pathOfElement(el) {
      var node = el
      var depth = 0
      while (node && depth < 7 && node !== document.body) {
        if (node.closest && (node.closest('.mv-panel') || node.closest('.mv-page'))) return null
        var values = []
        if (node.getAttribute) {
          ;['data-path','data-file-path','data-filename','data-file','data-uri','data-url','href','title','aria-label','data-tooltip'].forEach(function (name) {
            var v = node.getAttribute(name); if (v) values.push(v)
          })
        }
        if (node.href) values.push(node.href)
        if (node.textContent) values.push(node.textContent)
        for (var i = 0; i < values.length; i += 1) {
          var found = cleanCandidate(values[i])
          if (found) return found
        }
        node = node.parentElement
        depth += 1
      }
      return null
    }
    function onClickCapture(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      var t = e.target; if (!t || typeof t.closest !== 'function') return
      if (t.closest('.mv-panel') || t.closest('.mv-page')) return
      var clickable = t.closest('button,a,[role="button"],[data-path],[data-file-path],[data-filename],[data-file],[data-uri],[data-url],[tabindex]')
      if (!clickable) return
      var path = pathOfElement(clickable); if (!path) return
      e.preventDefault(); e.stopPropagation(); requestOpenPath(path)
    }`
client = replaceOnce(client, oldClick, newClick, 'chat file click interception')

fs.writeFileSync('client.js', client)

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
pkg.version = '0.2.1'
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')

let readme = fs.readFileSync('README.md', 'utf8')
if (!readme.includes('## v0.2.1')) {
  readme += '\n\n## v0.2.1\n\n- 视频按原始宽高比自适应右侧停靠栏或浮动窗口，横屏/竖屏均使用 object-fit: contain，不会拉伸。\n- 聊天文件点击识别扩展到 button、a、role=button、常见 data-* 文件属性以及 tabindex 文件芯片。\n- 支持直接点击仅显示文件名的相对路径（例如 demo.mp4），由 DSH 按当前会话工作目录解析，不再要求路径文本包含斜杠。\n- 仍可按住 Ctrl/Cmd/Shift/Alt 点击以保留 DSH 原始打开行为。\n'
  fs.writeFileSync('README.md', readme)
}

console.log('v0.2.1 patch applied')
