// dsh-media-viewer: DeepSeek Harness media enhancement plugin (Client) v0.3.0
// DSH 0.2.x integration: media/subtitles are Document Preview extension renderers.
// No global click interception and no duplicate Markdown/PDF/Office/Excel preview.

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

    var MEDIA_ID = 'dsh-media-viewer/media'
    var SUBTITLE_ID = 'dsh-media-viewer/subtitle'
    var MEDIA_EXT = ['mp4','webm','mov','m4v','ogv','mkv','mp3','wav','ogg','oga','m4a','aac','flac','opus']
    var SUBTITLE_EXT = ['srt','vtt','ass','ssa','lrc']
    var VIDEO_EXT = { mp4:1, webm:1, mov:1, m4v:1, ogv:1, mkv:1 }

    var CSS = '' +
      '.dmv-media{height:100%;min-height:0;display:flex;flex-direction:column;gap:10px;padding:12px;box-sizing:border-box;overflow:auto}' +
      '.dmv-stage{flex:1;min-height:220px;display:flex;align-items:center;justify-content:center;border-radius:10px;overflow:hidden;background:#000}' +
      '.dmv-video{display:block;width:100%;height:100%;max-height:calc(100vh - 230px);object-fit:contain;background:#000}' +
      '.dmv-audio-stage{background:var(--dsw-alias-bg-layer-1,#f6f8fa);min-height:180px;flex:none}' +
      '.dmv-audio{width:min(720px,92%)}' +
      '.dmv-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px}' +
      '.dmv-btn,.dmv-select{border:1px solid var(--dsw-alias-border-l2,#d0d7de);border-radius:7px;background:var(--dsw-alias-bg-layer-3,#fff);color:inherit;padding:5px 9px;font-size:12px;cursor:pointer}' +
      '.dmv-btn:hover{background:var(--dsw-alias-interactive-bg-hover,#f6f8fa)}' +
      '.dmv-meta{opacity:.68;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}' +
      '.dmv-status{padding:24px;text-align:center;opacity:.7}' +
      '.dmv-error{padding:24px;color:var(--dsw-alias-state-error-primary,#c0392b)}' +
      '.dmv-sub{height:100%;overflow:auto;padding:12px;box-sizing:border-box}' +
      '.dmv-sub-tools{display:flex;gap:8px;align-items:center;margin-bottom:10px;position:sticky;top:0;background:var(--dsw-alias-bg-base,#fff);padding:4px 0 8px;z-index:2}' +
      '.dmv-sub-count{font-size:12px;opacity:.65;flex:1}' +
      '.dmv-cues{display:flex;flex-direction:column;gap:7px}' +
      '.dmv-cue{display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px;border:1px solid var(--dsw-alias-border-l1,#d0d7de);border-radius:8px;padding:8px 10px}' +
      '.dmv-time{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;opacity:.62}' +
      '.dmv-text{white-space:pre-wrap;line-height:1.5;word-break:break-word}' +
      '.dmv-raw{white-space:pre-wrap;word-break:break-word;font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace}'

    function extensionOf(path) {
      var clean = String(path || '').replace(/[?#].*$/, '').replace(/\\/g, '/')
      var name = clean.slice(clean.lastIndexOf('/') + 1).toLowerCase()
      var dot = name.lastIndexOf('.')
      return dot >= 0 ? name.slice(dot + 1) : ''
    }

    function decodeSegment(value) {
      try { return decodeURIComponent(value) } catch (e) { return null }
    }

    function parseFileResource(address) {
      try {
        var url = new URL(String(address || ''))
        if (url.protocol !== 'dsh-resource:' || url.hostname !== 'file') return null
        var parts = url.pathname.split('/')
        if (parts.length < 4 || parts[1] !== 'session' || !parts[2]) return null
        var sessionId = decodeSegment(parts[2])
        if (!sessionId) return null
        var decoded = []
        for (var i = 3; i < parts.length; i += 1) {
          var part = decodeSegment(parts[i])
          if (part === null) return null
          decoded.push(part)
        }
        var path = decoded.join('/')
        if (!path) return null
        return { sessionId: sessionId, path: path }
      } catch (e) {
        return null
      }
    }

    function paramsFor(file, download) {
      var p = new URLSearchParams()
      p.set('sessionId', file.sessionId)
      p.set('path', file.path)
      if (download) p.set('download', '1')
      return p
    }

    function mediaUrl(file, download) {
      return '/media-viewer/api/content?' + paramsFor(file, download).toString()
    }

    function metaUrl(file) {
      return '/media-viewer/api/meta?' + paramsFor(file, false).toString()
    }

    function downloadFile(file) {
      var a = document.createElement('a')
      a.href = mediaUrl(file, true)
      a.download = String(file.path).replace(/\\/g, '/').split('/').pop() || 'download'
      a.rel = 'noopener'
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
    }

    function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(String(text || ''))
      return Promise.resolve()
    }

    function formatBytes(value) {
      var n = Number(value || 0)
      if (!n) return '0 B'
      var units = ['B','KB','MB','GB','TB']
      var i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
      return (n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
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
          var caption = parts.slice(9).join(',').replace(/\{[^}]*\}/g, '').replace(/\\N/g, '\n').trim()
          if (caption) cues.push({ time: (parts[1] || '') + ' → ' + (parts[2] || ''), text: caption })
        })
        return cues
      }
      if (ext === 'lrc') {
        raw.split('\n').forEach(function (line) {
          var m = line.match(/^\s*(\[[0-9]{1,2}:[0-9]{2}(?:[.:][0-9]{1,3})?\])+(.*)$/)
          if (!m || !m[2].trim()) return
          cues.push({ time: line.slice(0, line.indexOf(m[2])), text: m[2].trim() })
        })
        return cues
      }
      raw.replace(/^WEBVTT[^\n]*\n+/i, '').split(/\n{2,}/).forEach(function (block) {
        var lines = block.split('\n').filter(function (line) { return line.trim() !== '' })
        var ti = lines.findIndex(function (line) { return /-->/.test(line) })
        if (ti < 0) return
        var caption = lines.slice(ti + 1).join('\n').replace(/<[^>]+>/g, '').trim()
        if (caption) cues.push({ time: lines[ti].trim(), text: caption })
      })
      return cues
    }

    function MediaBody(props) {
      var parsed = parseFileResource(props.resourceAddress)
      var tabInfo = props.useTabInfo ? props.useTabInfo() : null
      var tab = tabInfo && tabInfo.tab
      var request = props.content && props.content.kind === 'renderer' ? props.content : null
      var state = useState({ loading: true, meta: null, error: null })
      var view = state[0]
      var setView = state[1]
      var rateState = useState(1)
      var rate = rateState[0]
      var setRate = rateState[1]
      var mediaRef = useRef(null)

      useEffect(function () {
        if (!request || !parsed) return
        var controller = new AbortController()
        var cancelled = false
        setView({ loading: true, meta: null, error: null })
        fetch(metaUrl(parsed), { signal: controller.signal, headers: { accept: 'application/json' } })
          .then(function (res) { return res.json() })
          .then(function (data) {
            if (cancelled) return
            if (!data || !data.ok) throw new Error(data && data.error ? data.error : 'media metadata failed')
            setView({ loading: false, meta: data, error: null })
            request.loaded(String(data.mtime || 0) + ':' + String(data.size || 0))
          })
          .catch(function (error) {
            if (cancelled || error && error.name === 'AbortError') return
            setView({ loading: false, meta: null, error: String(error && error.message || error) })
            request.failed()
          })
        function abort() { cancelled = true; controller.abort() }
        if (tab && tab.signal) {
          if (tab.signal.aborted) abort()
          else tab.signal.addEventListener('abort', abort, { once: true })
        }
        return function () {
          if (tab && tab.signal) tab.signal.removeEventListener('abort', abort)
          abort()
        }
      }, [props.resourceAddress, request && request.revision])

      useEffect(function () {
        if (mediaRef.current) {
          try { mediaRef.current.playbackRate = rate } catch (e) {}
        }
      }, [rate])

      function onKeyDown(e) {
        var media = mediaRef.current
        if (!media) return
        var tag = e.target && e.target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (e.key === ' ' || e.key.toLowerCase() === 'k') {
          e.preventDefault()
          if (media.paused) media.play().catch(function () {})
          else media.pause()
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'j') {
          e.preventDefault()
          media.currentTime = Math.max(0, media.currentTime - 5)
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'l') {
          e.preventDefault()
          media.currentTime = Math.min(Number.isFinite(media.duration) ? media.duration : media.currentTime + 5, media.currentTime + 5)
        }
      }

      if (!parsed) return createElement('div', { className: 'dmv-error' }, '无法解析 DSH 文件资源地址。')
      if (!request) return createElement('div', { className: 'dmv-status' }, '等待媒体渲染请求…')
      if (view.loading) return createElement('div', { className: 'dmv-status' }, '媒体加载中…')
      if (view.error) return createElement('div', { className: 'dmv-error' }, view.error)
      var meta = view.meta
      var isVideo = meta && VIDEO_EXT[String(meta.ext || '').toLowerCase()]
      var src = mediaUrl(parsed, false)
      var media = isVideo
        ? createElement('video', {
            ref: mediaRef,
            className: 'dmv-video',
            src: src,
            controls: true,
            preload: 'metadata',
            playsInline: true,
            onLoadedMetadata: function (e) { try { e.currentTarget.playbackRate = rate } catch (err) {} }
          })
        : createElement('audio', {
            ref: mediaRef,
            className: 'dmv-audio',
            src: src,
            controls: true,
            preload: 'metadata',
            onLoadedMetadata: function (e) { try { e.currentTarget.playbackRate = rate } catch (err) {} }
          })

      return createElement('div', {
          className: 'dmv-media',
          tabIndex: 0,
          onKeyDown: onKeyDown,
          ref: props.scrollportRef
        },
        createElement('style', null, CSS),
        createElement('div', { className: 'dmv-stage' + (isVideo ? '' : ' dmv-audio-stage') }, media),
        createElement('div', { className: 'dmv-tools' },
          createElement('span', { className: 'dmv-meta', title: meta.path }, meta.name + ' · ' + formatBytes(meta.size)),
          createElement('span', null, '倍速'),
          createElement('select', {
            className: 'dmv-select',
            value: String(rate),
            onChange: function (e) { setRate(Number(e.target.value) || 1) }
          }, [0.5,0.75,1,1.25,1.5,1.75,2].map(function (value) {
            return createElement('option', { key: String(value), value: String(value) }, value + '×')
          })),
          createElement('button', { className: 'dmv-btn', onClick: function () { downloadFile(parsed) } }, '下载原文件'),
          createElement('span', { style: { opacity: .55 } }, 'Space/K 播放暂停 · J/← 后退5秒 · L/→ 前进5秒')
        )
      )
    }

    function SubtitleBody(props) {
      var parsed = parseFileResource(props.resourceAddress)
      var text = props.content && props.content.kind === 'text' ? props.content.text : ''
      var ext = parsed ? extensionOf(parsed.path) : ''
      var cues = parseSubtitle(text, ext)
      var copied = useState(false)
      var didCopy = copied[0]
      var setDidCopy = copied[1]

      function copyAll() {
        copyText(text).then(function () {
          setDidCopy(true)
          setTimeout(function () { setDidCopy(false) }, 1200)
        }).catch(function () {})
      }

      if (!parsed) return createElement('div', { className: 'dmv-error' }, '无法解析 DSH 文件资源地址。')
      return createElement('div', { className: 'dmv-sub', ref: props.scrollportRef },
        createElement('style', null, CSS),
        createElement('div', { className: 'dmv-sub-tools' },
          createElement('span', { className: 'dmv-sub-count' }, cues.length ? '已解析 ' + cues.length + ' 条字幕' : '字幕原文'),
          createElement('button', { className: 'dmv-btn', onClick: copyAll }, didCopy ? '已复制' : '复制全文'),
          createElement('button', { className: 'dmv-btn', onClick: function () { downloadFile(parsed) } }, '下载原文件')
        ),
        cues.length
          ? createElement('div', { className: 'dmv-cues' }, cues.slice(0, 5000).map(function (cue, index) {
              return createElement('div', { className: 'dmv-cue', key: String(index) },
                createElement('div', { className: 'dmv-time' }, cue.time),
                createElement('div', { className: 'dmv-text' }, cue.text)
              )
            }))
          : createElement('pre', { className: 'dmv-raw' }, text),
        cues.length > 5000 ? createElement('div', { className: 'dmv-status' }, '字幕较长，预览只显示前 5000 条；复制全文不受影响。') : null
      )
    }

    function registerRenderer(scope, definition, Body) {
      var removeDefinition = scope.documentPreviews.register(definition)
      var removeBody = scope.slots.inject('sidebar.right.tab.document', function () {
        return scope.slots.register({
          name: 'sidebar.right.tab.document',
          key: definition.id
        }, Body)
      })
      return function () {
        try { if (removeBody) removeBody() } catch (e) {}
        try { if (removeDefinition) removeDefinition() } catch (e) {}
      }
    }

    exports.inject = ['slots']
    exports.apply = function (ctx) {
      return ctx.inject(['slots', 'documentPreviews'], function (scope) {
        var disposers = []
        disposers.push(registerRenderer(scope, {
          id: MEDIA_ID,
          extensions: MEDIA_EXT,
          binaryExtensions: MEDIA_EXT,
          priority: 'extension',
          title: function () { return '媒体播放器' },
          loading: 'renderer',
          wrap: false
        }, MediaBody))
        disposers.push(registerRenderer(scope, {
          id: SUBTITLE_ID,
          extensions: SUBTITLE_EXT,
          priority: 'extension',
          title: function () { return '字幕时间轴' },
          loading: 'text-pages',
          wrap: false
        }, SubtitleBody))
        return function () {
          disposers.forEach(function (dispose) {
            try { dispose() } catch (e) {}
          })
        }
      })
    }

    return module.exports
  }
})
