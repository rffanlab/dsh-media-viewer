<div align="center">

# dsh-media-viewer

**DeepSeek Harness 的统一媒体 / 文档查看器**

视频、音频、图片、Markdown、文本、字幕、PDF、Word、Excel、PowerPoint，在 DSH 对话旁边直接查看；可复制的文档一键复制全文；所有受支持文档都能下载原文件。

</div>

## v0.2 新增

- **XLSX 结构化预览**：直接在 DSH 里切换工作表、滚动查看单元格，并可复制整个工作簿的文本内容
- **PPTX 页面预览**：按幻灯片逐页查看提取出的标题 / 文字，并可复制整份演示文稿文字
- **字幕预览**：支持 `.srt / .vtt / .ass / .ssa / .lrc`，按时间轴分条展示并复制原始全文
- **音视频倍速**：0.5× ~ 2×；播放器获得焦点后支持 Space/K 播放暂停、J/← 后退 5 秒、L/→ 前进 5 秒
- **结构化预览 API**：新增 `/media-viewer/api/structured`，用于 Office 文档的轻量结构数据

## 功能

- **视频播放**：`.mp4 / .webm / .mov / .m4v / .ogv / .mkv`
  - 原生 `<video controls>`：播放 / 暂停 / 音量 / 全屏 / 拖动进度
  - 0.5× ~ 2× 倍速
  - 键盘：Space/K 播放暂停，J/← 后退 5 秒，L/→ 前进 5 秒
  - Host 端支持 HTTP `Range`，大视频无需整文件一次性读入内存
- **音频播放**：`.mp3 / .wav / .ogg / .m4a / .aac / .flac / .opus`
  - 播放 / 暂停 / 拖动进度 / 倍速 / 键盘控制
- **图片查看**：PNG / JPEG / GIF / WebP / AVIF / BMP / ICO / SVG
- **Markdown 预览**：整合 `dsh-md-preview` 的 DSH 插槽接入、右侧停靠思路和 Markdown 渲染能力
  - 标题、列表、表格、代码块、引用、链接、图片
  - Markdown 相对图片路径自动通过媒体端点加载
- **文本 / 代码预览**：TXT、日志、JSON/YAML/TOML、CSV/XML、常见源码文件等
- **字幕预览**：SRT / WebVTT / ASS / SSA / LRC，按时间和字幕正文分条显示
- **PDF**：浏览器原生 PDF 预览；可提取全文并复制；可下载原 PDF
- **DOCX**：提取 Word 正文用于预览和“复制全文”；可下载原 Word 文件
- **XLSX**：Excel 工作表结构化预览；支持工作表切换；可复制整个工作簿文本；可下载原文件
- **PPTX**：PowerPoint 逐页文字结构预览；上一页 / 下一页；可复制整份幻灯片文字；可下载原文件
- **其他 Office 文档**：`.doc / .rtf / .odt / .xls / .ods / .ppt / .odp` 当前提供统一下载入口
- **统一下载**：所有已识别类型都通过同一个下载按钮保存原文件
- **会话隔离最近文件**：只显示当前会话访问过的媒体 / 文档
- **点击拦截**：直接点击对话里的文件引用，在 DSH 右侧打开查看器；按住 Ctrl/Cmd/Shift/Alt 则保留系统默认打开行为
- **右侧停靠 / 浮动**：停靠宽度可拖动并记忆；也可切成浮动窗口
- **深浅色主题**：UI 使用 DSH 的 `--dsw-alias-*` 变量

## “复制全文”支持范围

| 类型 | 预览 | 复制全文 | 下载 |
| --- | --- | --- | --- |
| Markdown | ✅ 渲染 | ✅ Markdown 源文 | ✅ |
| TXT / 代码 / JSON / YAML / CSV 等 | ✅ 纯文本 | ✅ | ✅ |
| SRT / VTT / ASS / SSA / LRC | ✅ 时间轴 | ✅ 原始字幕 | ✅ |
| PDF | ✅ 浏览器 PDF | ✅ 提取文本层 | ✅ |
| DOCX | ✅ 提取正文 | ✅ 提取正文 | ✅ |
| XLSX | ✅ 工作表 / 单元格 | ✅ 整个工作簿文本 | ✅ |
| PPTX | ✅ 逐页文字结构 | ✅ 整份幻灯片文字 | ✅ |
| 视频 / 音频 / 图片 | ✅ | — | ✅ |
| DOC / XLS / PPT / ODT / ODS / ODP | 暂不内嵌 | 暂不提取 | ✅ |

> PDF 的“复制全文”是文本层提取：扫描件 PDF 如果本身没有 OCR 文本层，结果可能为空。插件不会自动做 OCR。

> PPTX v0.2 是**文字结构预览**，不会假装精确还原字体、图片、动画和原始版式；需要检查视觉排版时，请下载 / 打开原文件。

## 安装

推荐使用 DSH 原生插件命令：

```bash
dsh plugin --profile web add github:rffanlab/dsh-media-viewer
```

Windows：

```powershell
dsh.ps1 plugin --profile web add github:rffanlab/dsh-media-viewer
```

仓库已经包含 `dsh.bundle` manifest 和 `cordis.patch.yml`：

```yaml
- insert:
    - id: media-viewer
      name: 'dsh-media-viewer'
```

然后重启 `dsh web` 并刷新页面。

### 从 v0.1 / GitHub 安装版更新

按你当前 DSH 插件安装方式更新即可。GitHub 源安装通常可先 remove 后重新 add，或者在本地 clone 中 `git pull` 后重新安装依赖。更新后务必重启 `dsh web`。

### 本地开发安装

```bash
git clone https://github.com/rffanlab/dsh-media-viewer.git
cd dsh-media-viewer
npm install
npm test
npm run check
```

在 web profile 中引用本地目录：

```bash
cd ~/.dsh/profiles/web
npm pkg set "dependencies.dsh-media-viewer=file:~/plugins/dsh-media-viewer"
npm install
```

如果 profile 使用 pnpm，`file:` 依赖可能被快照复制到 `.pnpm`；修改插件源码后需要重新 `pnpm install` 或同步快照后再刷新 DSH。

## 使用

1. 点击会话头部 **“媒体查看”** 打开统一查看器；
2. 直接点击对话里的视频、音频、Markdown、字幕、PDF、Word、Excel、PowerPoint、文本等文件引用，也会自动在右侧打开；
3. 视频和音频直接播放，工具栏可选 0.5× ~ 2× 倍速；
4. Markdown / 文本 / 字幕 / PDF / DOCX / XLSX / PPTX 点击 **“复制全文”**；
5. XLSX 在上方切换工作表；PPTX 用上一页 / 下一页逐页查看；
6. 任意已支持文件点击 **“下载”** 获取原文件；
7. 右侧栏左边缘可拖动调整宽度，点 **“浮动”** 可切换窗口模式。

## 架构

### Host：`index.js`

- 监听 `fs/observed`，维护会话隔离的最近文件记录
- `/media-viewer/api/recent`：最近媒体 / 文档
- `/media-viewer/api/meta`：文件类型、大小、MIME、能力信息
- `/media-viewer/api/text`：Markdown / 文本 / 字幕 / PDF / DOCX / XLSX / PPTX 的全文提取
- `/media-viewer/api/structured`：XLSX / PPTX 结构化预览数据
- `/media-viewer/api/peek`：列表摘要
- `/media-viewer/api/content`：二进制流与下载；支持 `HEAD` 和 HTTP Byte Range

音视频不走“读完整文件 → Buffer → 一次性返回”，而是由 `createReadStream()` 流式输出；带 Range 请求时返回 `206 Partial Content`，以支持媒体播放器 seek。

XLSX 使用 ExcelJS 解析；PPTX 本质是 ZIP + XML，使用 JSZip 读取每个 `ppt/slides/slideN.xml`，只抽取文字结构，不执行 Office 文档中的宏或脚本。

### Client：`client.js`

- 使用 DSH `conversation.session.header.actions` 注册入口
- 使用 `shell.overlay` 注册右侧 / 浮动查看器
- 使用 `conversation.view` 注册“媒体查看”页签
- 捕获对话里的受支持文件按钮点击并改为内部预览
- Markdown 渲染逻辑由 `dsh-md-preview` 的实现思路扩展而来
- XLSX：工作表 tabs + 可滚动表格
- PPTX：逐页文字结构卡片
- 字幕：时间轴卡片
- 音视频：原生媒体 controls + 倍速 / 快捷键

## 依赖

- `mammoth`：DOCX 正文提取
- `pdfjs-dist@4.10.38`：PDF 文本层提取
- `exceljs@4.4.0`：XLSX 读取
- `jszip@3.10.1`：PPTX ZIP/XML 读取

PDF.js 固定在 4.10.38，主要是为了保持 DSH 当前 Node 20 系列环境兼容。

## 安全 / 限制

- 文本 / 字幕直接预览与复制上限：8 MB
- PDF / DOCX / XLSX / PPTX 解析文件上限：64 MB
- 提取后的全文最多约 8 MB，超过会截断
- XLSX UI 为保证浏览器流畅，每个工作表最多预览前 250 行、80 列；“复制全文”单独走全文提取逻辑
- PPTX 结构化预览最多读取前 200 页
- 不执行文档中的脚本、宏或嵌入代码；HTML / 源码文件按纯文本显示
- PDF 预览使用浏览器自带 PDF viewer
- MKV / MOV / FLAC 等能否直接播放最终取决于当前浏览器的编解码支持；服务端 Range / 下载能力不受影响
- 本插件面向 DSH 本地工作目录文件；文件解析失败时保留下载能力

## 与 dsh-md-preview 的关系

`dsh-media-viewer` 是对 `dsh-md-preview` 的统一化扩展，而不是旁边再装一个互相抢点击事件的第二套预览器。它复用了 / 改写了后者的：

- DSH Host / Client 分层方式
- session-scoped recent-files 思路
- shell overlay / conversation view 插槽接入
- 对话文件引用点击拦截
- 右侧停靠布局
- Markdown 渲染和相对图片处理

建议安装 `dsh-media-viewer` 后停用 `dsh-md-preview`，避免两者同时拦截 `.md` 点击。

原始 MIT 版权信息见 [LICENSE](LICENSE) 和 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 开发检查

```bash
npm install
npm run check
npm test
```

测试覆盖：

- 文件类型分类（含字幕 / XLSX / PPTX）
- MIME 映射
- HTTP Range 解析（含 suffix range）
- PPTX XML entity / 文本 run 提取
- PDF.js / Mammoth / ExcelJS / JSZip 的 Node 20 runtime import

## License

MIT
