<div align="center">

# dsh-media-viewer

[简体中文](README.md) | [**English**](README.en.md)

**A unified media and document viewer for DeepSeek Harness**

Preview video, audio, images, Markdown, text, subtitles, PDF, Word, Excel, and PowerPoint directly beside your DSH conversation. Supported documents can be copied as full text with one click, and every recognized file type can be downloaded in its original form.

</div>

## Features

- **Video playback**: `.mp4 / .webm / .mov / .m4v / .ogv / .mkv`
  - Native `<video controls>`: play / pause / volume / fullscreen / seek
  - Playback speed from 0.5× to 2×
  - Space/K: play or pause; J/←: back 5 seconds; L/→: forward 5 seconds
  - Automatically follows the video's real aspect ratio in docked and floating layouts; landscape and portrait videos use `object-fit: contain` and are never stretched
  - Host-side HTTP `Range` support, so large videos stream without loading the entire file into memory
- **Audio playback**: `.mp3 / .wav / .ogg / .m4a / .aac / .flac / .opus`
  - Play / pause / seek / playback speed / keyboard controls
- **Image preview**: PNG / JPEG / GIF / WebP / AVIF / BMP / ICO / SVG
- **Markdown preview**: integrates and extends the DSH slot, right-side docking, and Markdown rendering ideas from `dsh-md-preview`
  - Headings, lists, tables, code blocks, quotes, links, and images
  - Relative Markdown image paths are automatically routed through the media endpoint
- **Text / code preview**: TXT, logs, JSON/YAML/TOML, CSV/XML, and common source-code formats
- **Subtitle preview**: SRT / WebVTT / ASS / SSA / LRC displayed as timeline entries
- **PDF**: browser-native PDF preview, text-layer extraction, full-text copy, and original-file download
- **DOCX**: extracted Word text for preview and copy, plus original-file download
- **XLSX**: structured worksheet preview, sheet switching, scrollable cells, and full workbook text copy
- **PPTX**: per-slide text structure preview with previous / next navigation and full presentation text copy
- **Other Office documents**: `.doc / .rtf / .odt / .xls / .ods / .ppt / .odp` currently provide a unified download action
- **Unified download**: every recognized file type can download the original file
- **Session-scoped recent files**: only files accessed by the current conversation are listed
- **Open files directly from chat**:
  - Supports file buttons, links, file chips, and common `data-*` file attributes
  - Supports inline Markdown code paths such as `/srv/workspace/demo.mp4`
  - Hovering a recognized `<code>` file path shows that it is clickable
  - Supports absolute paths and filename-only relative paths; relative paths are resolved from the current session working directory
  - Compatible with `file://` and some `vscode://` paths, but **the model does not need to output `file://`**
  - Ctrl/Cmd/Shift/Alt + click preserves the original DSH behavior
- **Docked / floating viewer**: dock width is draggable and remembered; floating mode is also available
- **Light / dark themes**: UI uses DSH `--dsw-alias-*` design variables

## Support Matrix

| Type | Preview | Copy Full Text | Download |
| --- | --- | --- | --- |
| Video | ✅ Playback / speed / responsive sizing | — | ✅ |
| Audio | ✅ Playback / speed | — | ✅ |
| Images | ✅ | — | ✅ |
| Markdown | ✅ Rendered | ✅ Markdown source | ✅ |
| TXT / code / JSON / YAML / CSV, etc. | ✅ Plain text | ✅ | ✅ |
| SRT / VTT / ASS / SSA / LRC | ✅ Timeline | ✅ Original subtitle text | ✅ |
| PDF | ✅ Browser PDF | ✅ Extracted text layer | ✅ |
| DOCX | ✅ Extracted body text | ✅ Extracted body text | ✅ |
| XLSX | ✅ Worksheets / cells | ✅ Whole workbook text | ✅ |
| PPTX | ✅ Per-slide text structure | ✅ Whole presentation text | ✅ |
| DOC / XLS / PPT / ODT / ODS / ODP | Not embedded yet | Not extracted yet | ✅ |

> PDF full-text copy depends on the PDF's existing text layer. A scanned PDF without OCR text may produce no text. The plugin does not currently run OCR automatically.

> PPTX preview is a **text-structure preview**. It does not pretend to reproduce fonts, images, animation, or exact PowerPoint layout. Download or open the original file when visual fidelity matters.

## Installation

Recommended: use the native DSH plugin command.

```bash
dsh plugin --profile web add github:rffanlab/dsh-media-viewer
```

Windows:

```powershell
dsh.ps1 plugin --profile web add github:rffanlab/dsh-media-viewer
```

The repository already includes the `dsh.bundle` manifest and `cordis.patch.yml`:

```yaml
- insert:
    - id: media-viewer
      name: 'dsh-media-viewer'
```

Restart `dsh web`, then refresh the page.

### Updating an existing installation

Update using the same DSH plugin mechanism you originally used. For a GitHub-source install, removing and re-adding the plugin is usually the simplest route. For a local clone, run `git pull` and reinstall dependencies. Restart `dsh web` after updating.

### Local development

```bash
git clone https://github.com/rffanlab/dsh-media-viewer.git
cd dsh-media-viewer
npm install
npm test
npm run check
```

Reference the local directory from your web profile:

```bash
cd ~/.dsh/profiles/web
npm pkg set "dependencies.dsh-media-viewer=file:~/plugins/dsh-media-viewer"
npm install
```

If the profile uses pnpm, a `file:` dependency may be copied into a `.pnpm` snapshot. After editing the plugin source, run `pnpm install` again or synchronize the snapshot before refreshing DSH.

## Usage

1. Click **Media Viewer** in the conversation header to open the unified viewer.
2. Click a file button, file chip, link, or gray inline-code path directly in chat to open it on the right.
3. Play video / audio directly and choose 0.5×–2× playback speed when needed.
4. Use **Copy full text** for Markdown, text, subtitles, PDF, DOCX, XLSX, and PPTX.
5. Switch worksheet tabs for XLSX; use previous / next for PPTX.
6. Click **Download** for the original version of any recognized file.
7. Drag the left edge of the docked panel to resize it, or switch to floating mode.

For example, the model may simply output:

```text
/srv/e5-data/deepseek-harness/workspace/project/final.mp4
```

If that path is rendered as inline Markdown code and the extension is supported, the plugin can recognize and open it directly. No HTML wrapper and no forced `file://` prefix are required.

## Architecture

### Host: `index.js`

- Watches `fs/observed` and keeps a session-scoped recent-file list
- `/media-viewer/api/recent`: recent media / documents
- `/media-viewer/api/meta`: file type, size, MIME type, and capabilities
- `/media-viewer/api/text`: full-text extraction for Markdown / text / subtitles / PDF / DOCX / XLSX / PPTX
- `/media-viewer/api/structured`: structured XLSX / PPTX preview data
- `/media-viewer/api/peek`: list snippets
- `/media-viewer/api/content`: binary streaming and downloads, including `HEAD` and HTTP byte ranges

Audio and video are streamed with `createReadStream()`. Range requests return `206 Partial Content`, allowing media seeking without buffering the entire file.

XLSX is parsed with ExcelJS. PPTX is ZIP + XML, so JSZip reads `ppt/slides/slideN.xml` and extracts text structure without executing Office macros or embedded scripts.

### Client: `client.js`

- Registers an entry with `conversation.session.header.actions`
- Registers the docked / floating viewer with `shell.overlay`
- Registers the Media Viewer tab with `conversation.view`
- Intercepts supported file buttons, links, file chips, and `<code>` file paths in chat
- Extends the Markdown rendering approach from `dsh-md-preview`
- XLSX: sheet tabs + scrollable grid
- PPTX: per-slide text cards
- Subtitles: timeline cards
- Audio / video: native controls + playback speed + shortcuts + responsive aspect ratio

## Dependencies

- `mammoth`: DOCX text extraction
- `pdfjs-dist@4.10.38`: PDF text-layer extraction
- `exceljs@4.4.0`: XLSX parsing
- `jszip@3.10.1`: PPTX ZIP/XML parsing

PDF.js is pinned to 4.10.38 primarily for compatibility with the current DSH Node 20 environment.

## Safety and Limitations

- Direct text / subtitle preview and copy limit: 8 MB
- PDF / DOCX / XLSX / PPTX input parsing limit: 64 MB
- Extracted full text is capped at about 8 MB and is truncated beyond that
- XLSX UI previews at most the first 250 rows and 80 columns of each worksheet; full-text copy uses a separate extraction path
- PPTX structured preview reads at most the first 200 slides
- Document scripts, macros, and embedded code are never executed; HTML and source-code files are displayed as text
- PDF preview uses the browser's built-in PDF viewer
- Direct playback of MKV / MOV / FLAC depends on browser codec support; server-side Range and download support remain available
- The plugin is intended for files in the DSH local workspace; download remains available when document parsing fails

## Relationship to dsh-md-preview

`dsh-media-viewer` is a unified extension of `dsh-md-preview`, not a second preview plugin intended to compete for the same click events. It reuses / adapts ideas from the original project including:

- DSH Host / Client separation
- Session-scoped recent files
- `shell.overlay` / `conversation.view` integration
- Conversation file-reference interception
- Right-side docking
- Markdown rendering and relative image handling

After installing `dsh-media-viewer`, it is recommended to disable `dsh-md-preview` so both plugins do not intercept `.md` clicks at the same time.

Original MIT attribution is preserved in [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Development Checks

```bash
npm install
npm run check
npm test
```

Tests cover:

- File classification, including subtitles / XLSX / PPTX
- MIME mapping
- HTTP Range parsing, including suffix ranges
- PPTX XML entity and text-run extraction
- Node 20 runtime imports for PDF.js / Mammoth / ExcelJS / JSZip

## Changelog

### v0.2.3

- Fixed a serious regression where authorization / confirmation buttons could be hijacked if a parent tool-card container also contained a recognized file path
- File interception now inspects only the actual matched clickable/file element and no longer walks arbitrary ancestor text
- Removed generic `[tabindex]` interception to avoid capturing unrelated DSH controls
- Inline `<code>` file paths remain directly clickable

### v0.2.2

- Added direct opening for inline-code file paths in chat, such as `/srv/.../final.mp4`
- Added clickable styling and hover hints for recognized `<code>` paths
- The model no longer needs to output local files as `file://...`

### v0.2.1

- Video now follows its real aspect ratio in docked and floating layouts
- Chat file detection expanded to buttons, links, `role=button`, common `data-*` file attributes, and file chips
- Filename-only relative paths such as `demo.mp4` are supported

### v0.2.0

- Added structured XLSX preview and full workbook text copy
- Added per-slide PPTX text preview and full presentation text copy
- Added SRT / VTT / ASS / SSA / LRC subtitle preview
- Added media playback speed controls and shortcuts
- Added `/media-viewer/api/structured`

## License

MIT
