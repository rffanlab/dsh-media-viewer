<div align="center">

# dsh-media-viewer

[**简体中文**](README.md) | [English](README.en.md)

**DeepSeek Harness 0.2.x 的音视频增强插件**

视频 / 音频原生播放、HTTP Range 拖动、倍速、字幕时间轴与原文件下载。

**Markdown、PDF、Word、Excel、PowerPoint、图片、代码和普通文本从 v0.3.0 起全部交给 DSH 官方 Document Preview。**

</div>

## 为什么 v0.3.0 要重构

早期 DSH 缺少完整文件预览能力，因此本插件曾经自己实现 Markdown、文本、图片、PDF、DOCX、XLSX、PPTX 等预览，并通过全局 DOM 点击拦截识别聊天里的文件路径。

DSH 0.2.x 已经提供正式的右侧 Sidebar、Resource 地址和 Document Preview 扩展体系，官方预览已经覆盖：

- Markdown / 代码 / 纯文本
- 图片
- PDF
- HTML
- Word / PowerPoint
- Excel / CSV / TSV

继续重复维护这些功能没有意义，而且全局 DOM 点击猜路径也是旧版大量兼容问题的主要来源。

因此 v0.3.0 改成：

> **官方 DSH 管文件和文档，我们只做官方暂时没有做完整的媒体能力。**

## v0.3.0 能力

### 视频

支持：

- MP4
- WebM
- MOV
- M4V
- OGV
- MKV

功能：

- 播放 / 暂停
- 浏览器原生进度条
- HTTP Byte Range / 206 Partial Content
- 任意 seek
- 0.5× ～ 2× 倍速
- 横屏 / 竖屏自适应，`object-fit: contain`
- Space / K：播放暂停
- J / ←：后退 5 秒
- L / →：前进 5 秒
- 下载原文件

> MKV / MOV 等是否可以直接播放仍取决于浏览器自身编解码支持。

### 音频

支持：

- MP3
- WAV
- OGG / OGA
- M4A
- AAC
- FLAC
- OPUS

同样支持 Range、seek、倍速和下载。

### 字幕

支持：

- SRT
- WebVTT
- ASS
- SSA
- LRC

字幕直接作为 DSH Document Preview 的扩展 renderer：

- 时间轴展示
- 复制全文
- 下载原文件
- 超长字幕预览最多展示前 5000 条，复制全文不受此限制

## 新架构

v0.3.0 不再创建自己的“平行 Sidebar”。

文件打开链路变成：

```text
聊天文件 / Files 树 / 工具产物
            ↓
      DSH Resource
            ↓
    官方 Right Sidebar
            ↓
  官方 Document Preview
       ↓           ↓
普通文档 renderer   dsh-media-viewer
                    ├─ Video
                    ├─ Audio
                    └─ Subtitle
```

### Client

插件通过 DSH 官方扩展接口注册：

```text
ctx.documentPreviews.register(...)
sidebar.right.tab.document
```

媒体 renderer 使用：

```text
loading: renderer
priority: extension
```

因此视频不会经过官方 `readBytes` 整文件读取，而是直接使用本插件的 Range Streaming。

字幕使用：

```text
loading: text-pages
priority: extension
```

文本读取、自动刷新、Session 生命周期全部由 DSH 官方负责。

### Host

Host 现在只保留两个接口：

- `/media-viewer/api/meta`
- `/media-viewer/api/content`

`content` 支持：

- GET
- HEAD
- `Range: bytes=...`
- `206 Partial Content`
- 原文件下载

所有媒体请求都必须带当前 DSH Session ID。

## v0.3.0 删除了什么

以下能力不再由本插件实现：

| 类型 | v0.2.x | v0.3.0 |
| --- | --- | --- |
| Markdown | 插件自己渲染 | DSH 官方 |
| 代码 / TXT | 插件自己渲染 | DSH 官方 |
| 图片 | 插件自己预览 | DSH 官方 |
| PDF | PDF.js | DSH 官方 |
| DOC / DOCX | Mammoth / 下载 | DSH 官方 Office Preview |
| XLS / XLSX | ExcelJS 简易表格 | DSH 官方 Excel Preview |
| PPT / PPTX | JSZip 文字提取 | DSH 官方 Office Preview |
| HTML | 文本 | DSH 官方沙箱 Preview |
| 聊天文件点击 | 全局 DOM 拦截 | DSH Resource / Sidebar |

因此 v0.3.0 删除了这些运行时依赖：

- `mammoth`
- `pdfjs-dist`
- `exceljs`
- `jszip`

插件安装明显更轻。

## 最重要的变化：不再全局抢 click

v0.2.x 为了兼容不同版本 DSH，曾经需要：

```js
document.addEventListener('click', ..., true)
```

再从：

- `title`
- `aria-label`
- `data-*`
- `<code>`
- 文件卡片
- 文本内容

猜用户到底点了哪个文件。

这也是后来授权按钮、问题选项、多路径代码块等兼容问题的根源。

**v0.3.0 已完全移除这套全局点击拦截。**

文件身份和 Session 归属现在由 DSH 官方 Resource 模型负责。

## 安装

v0.3.0 面向 **DeepSeek Harness 0.2.x**。

```bash
dsh plugin --profile web add github:rffanlab/dsh-media-viewer
```

Windows：

```powershell
dsh.ps1 plugin --profile web add github:rffanlab/dsh-media-viewer
```

然后重启 `dsh web` 并刷新浏览器。

如果已经安装旧版插件，请正常更新插件后重启 DSH。

## 使用

不再需要单独点击“媒体查看”按钮。

直接使用 DSH 自己的文件入口：

- 聊天中的文件引用
- 工具输出文件
- 交付文件
- Files 文件树

打开视频、音频或字幕时，官方 Document Preview 会自动选择本插件提供的 renderer。

其他文档继续使用 DSH 官方 renderer。

## 与 DSH 官方预览的边界

### DSH 官方负责

- Resource 地址
- Session 文件归属
- Right Sidebar
- tab 生命周期
- Markdown / Code / Text
- Image
- PDF
- HTML
- Office
- Excel
- 文件自动刷新

### dsh-media-viewer 负责

- Video Player
- Audio Player
- Subtitle Timeline
- HTTP Range Streaming
- Seek
- Playback Rate
- Media Download

## 开发检查

```bash
npm install
npm run check
npm test
```

测试覆盖：

- 媒体类型分类
- MIME
- HTTP Range
- 路径污染清理
- 不连接两个独立绝对路径
- DSH Document Preview extension 注册
- 确认已经删除全局 click 拦截
- 确认插件不再认领 PDF / Office / Excel / Markdown / 图片
- 确认运行时无文档解析依赖

## 升级记录

### v0.3.0

- 重构为 DSH 0.2.x 官方 Document Preview extension
- 删除独立媒体/文档 Sidebar
- 删除全局 DOM 文件点击拦截
- 删除 Markdown / PDF / Office / Excel / 图片 / 代码 / 文本重复预览
- 删除 Mammoth / PDF.js / ExcelJS / JSZip 运行时依赖
- 视频 / 音频保留独立 HTTP Range Streaming
- 字幕迁移到官方 `text-pages` renderer
- 媒体文件身份和 Session 生命周期交给 DSH Resource 模型

## License

MIT
