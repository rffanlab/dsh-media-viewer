<div align="center">

# dsh-media-viewer

[简体中文](README.md) | [**English**](README.en.md)

**Media enhancement for DeepSeek Harness 0.2.x**

Seekable video/audio playback, HTTP Range streaming, playback speed, subtitle timelines, and original-file download.

**Starting with v0.3.0, Markdown, PDF, Word, Excel, PowerPoint, images, code, HTML, and plain text are delegated to the native DSH Document Preview.**

</div>

## Why v0.3.0 was rebuilt

Earlier DSH versions did not have a complete file preview stack, so this plugin implemented many document viewers itself and used global DOM click interception to discover file references in chat.

DSH 0.2.x now ships a formal Right Sidebar, Resource addressing, and extensible Document Preview system covering Markdown, code, text, images, PDF, HTML, Office, and spreadsheets.

Duplicating those features is no longer useful.

v0.3.0 therefore follows one rule:

> **DSH owns files and documents. This plugin owns the media capabilities that still benefit from specialization.**

## Features

### Video

Supported extensions:

- MP4
- WebM
- MOV
- M4V
- OGV
- MKV

Features:

- Native play / pause / volume / fullscreen
- HTTP Byte Range / 206 Partial Content
- Seek without downloading the entire file first
- 0.5×–2× playback speed
- Responsive landscape / portrait sizing with `object-fit: contain`
- Space / K: play-pause
- J / ←: back 5 seconds
- L / →: forward 5 seconds
- Original-file download

Browser codec support still determines whether formats such as MKV or MOV can actually decode.

### Audio

MP3, WAV, OGG/OGA, M4A, AAC, FLAC, and OPUS with Range streaming, seeking, playback speed, and download.

### Subtitles

SRT, WebVTT, ASS, SSA, and LRC:

- Timeline preview
- Copy full source
- Download original file
- Up to 5000 parsed cues displayed for very large subtitle files

## Architecture

v0.3.0 no longer creates a parallel sidebar.

```text
Chat files / Files tree / Tool outputs
                ↓
          DSH Resource
                ↓
        Native Right Sidebar
                ↓
      Native Document Preview
          ↓             ↓
 native renderers    dsh-media-viewer
                     ├─ Video
                     ├─ Audio
                     └─ Subtitle
```

The Client registers official extension renderers through:

```text
ctx.documentPreviews.register(...)
sidebar.right.tab.document
```

Video/audio use `loading: renderer` so they bypass full-file `readBytes` and keep the plugin's Range endpoint.

Subtitles use `loading: text-pages`, letting DSH own reading, refresh, Session identity, and tab lifetime.

The Host now keeps only:

- `/media-viewer/api/meta`
- `/media-viewer/api/content`

The content endpoint supports GET, HEAD, byte ranges, 206 responses, and original-file download. Media requests require a DSH Session ID.

## Removed in v0.3.0

The plugin no longer implements Markdown, code/text, images, PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, or HTML preview.

It also removes the runtime dependencies:

- `mammoth`
- `pdfjs-dist`
- `exceljs`
- `jszip`

Most importantly, v0.3.0 completely removes global conversation click interception. File identity and Session ownership now come from DSH's Resource model instead of DOM heuristics.

## Installation

v0.3.0 targets **DeepSeek Harness 0.2.x**.

```bash
dsh plugin --profile web add github:rffanlab/dsh-media-viewer
```

Windows:

```powershell
dsh.ps1 plugin --profile web add github:rffanlab/dsh-media-viewer
```

Restart `dsh web` and refresh the browser.

## Usage

There is no separate Media Viewer button anymore.

Open files through normal DSH surfaces:

- Chat file references
- Tool output files
- Deliverables
- Files tree

Video, audio, and subtitle files automatically select this plugin's renderer. Other documents stay with native DSH renderers.

## Responsibility Boundary

**Native DSH:** Resources, Session ownership, Right Sidebar, tab lifecycle, Markdown, code/text, images, PDF, HTML, Office, Excel, and refresh.

**dsh-media-viewer:** video, audio, subtitles, Range streaming, seek, playback rate, and media download.

## Development

```bash
npm install
npm run check
npm test
```

## Changelog

### v0.3.0

- Rebuilt as an official DSH 0.2.x Document Preview extension
- Removed the standalone media/document sidebar
- Removed global DOM file-click interception
- Removed duplicated document/image/text preview code
- Removed Mammoth, PDF.js, ExcelJS, and JSZip runtime dependencies
- Kept dedicated HTTP Range streaming for audio/video
- Moved subtitles onto the native `text-pages` renderer lifecycle
- Delegated file identity and Session lifecycle to the DSH Resource model

## License

MIT
