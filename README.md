<div align="center">

# dsh-media-viewer

[**简体中文**](README.md) | [English](README.en.md)

**DeepSeek Harness 的统一媒体 / 文档查看器**

视频、音频、图片、Markdown、文本、字幕、PDF、Word、Excel、PowerPoint，直接在 DSH 对话旁边查看。可复制的文档支持一键复制全文，所有已识别文件都可以下载原文件。

</div>

## 功能

- **视频播放**：`.mp4 / .webm / .mov / .m4v / .ogv / .mkv`
  - 原生 `<video controls>`：播放 / 暂停 / 音量 / 全屏 / 拖动进度
  - 0.5× ~ 2× 倍速
  - Space/K 播放暂停，J/← 后退 5 秒，L/→ 前进 5 秒
  - 根据视频真实宽高比自动适配停靠栏 / 浮动窗口，横屏和竖屏都使用 `object-fit: contain`，不会拉伸
  - Host 支持 HTTP `Range`，大视频无需一次性读入内存，支持拖动进度条
- **音频播放**：`.mp3 / .wav / .ogg / .m4a / .aac / .flac / .opus`
  - 播放 / 暂停 / 拖动进度 / 倍速 / 键盘控制
- **图片查看**：PNG / JPEG / GIF / WebP / AVIF / BMP / ICO / SVG
- **Markdown 预览**：整合并扩展 `dsh-md-preview` 的 DSH 插槽、右侧停靠和 Markdown 渲染能力
  - 标题、列表、表格、代码块、引用、链接、图片
  - Markdown 相对图片路径自动通过媒体端点加载
- **文本 / 代码预览**：TXT、日志、JSON/YAML/TOML、CSV/XML、常见源码文件等
- **字幕预览**：SRT / WebVTT / ASS / SSA / LRC，按时间轴分条显示
- **PDF**：浏览器原生 PDF 预览；可提取文本层、复制全文、下载原文件
- **DOCX**：提取 Word 正文用于预览和复制；可下载原文件
- **XLSX**：工作表结构化预览、Sheet 切换、单元格滚动查看；可复制整个工作簿文本
- **PPTX**：逐页文字结构预览、上一页 / 下一页；可复制整份幻灯片文字
- **其他 Office 文档**：`.doc / .rtf / .odt / .xls / .ods / .ppt / .odp` 当前提供统一下载入口
- **统一下载**：所有已识别类型都能下载原文件
- **会话隔离最近文件**：只显示当前会话访问过的媒体 / 文档
- **聊天内直接打开**：
  - 支持文件按钮、链接、文件芯片、常见 `data-*` 文件属性
  - 支持聊天 Markdown 中的行内代码路径，例如 `/srv/workspace/demo.mp4`
  - 鼠标移到可识别的 `<code>` 文件路径上，会显示可点击提示
  - 支持完整路径和只含文件名的相对路径；相对路径按当前会话工作目录解析
  - 兼容 `file://` / 部分 `vscode://` 路径，但**不要求模型特意输出 `file://`**
  - 文件拦截只检查实际点击的文件元素本身，不扫描普通 UI 父容器，避免误拦截授权 / 确认 / 取消等 DSH 操作按钮
  - 按住 Ctrl/Cmd/Shift/Alt 点击时保留 DSH 原始打开行为
- **右侧停靠 / 浮动**：停靠宽度可拖动并记忆，也可切换浮动窗口
- **深浅色主题**：UI 使用 DSH 的 `--dsw-alias-*` 设计变量

## 支持情况

| 类型 | 预览 | 复制全文 | 下载 |
| --- | --- | --- | --- |
| 视频 | ✅ 播放 / 倍速 / 自适应 | — | ✅ |
| 音频 | ✅ 播放 / 倍速 | — | ✅ |
| 图片 | ✅ | — | ✅ |
| Markdown | ✅ 渲染 | ✅ Markdown 源文 | ✅ |
| TXT / 代码 / JSON / YAML / CSV 等 | ✅ 纯文本 | ✅ | ✅ |
| SRT / VTT / ASS / SSA / LRC | ✅ 时间轴 | ✅ 原始字幕 | ✅ |
| PDF | ✅ 浏览器 PDF | ✅ 提取文本层 | ✅ |
| DOCX | ✅ 提取正文 | ✅ 提取正文 | ✅ |
| XLSX | ✅ 工作表 / 单元格 | ✅ 整个工作簿文本 | ✅ |
| PPTX | ✅ 逐页文字结构 | ✅ 整份幻灯片文字 | ✅ |
| DOC / XLS / PPT / ODT / ODS / ODP | 暂不内嵌 | 暂不提取 | ✅ |

> PDF 的“复制全文”依赖 PDF 自带文本层。扫描件如果没有 OCR 文本层，提取结果可能为空；插件目前不会自动做 OCR。

> PPTX 当前是**文字结构预览**，不会假装精确还原字体、图片、动画和原始版式。需要检查视觉排版时请下载 / 打开原文件。

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

### 更新已有安装

按当前 DSH 插件安装方式更新即可。GitHub 源安装通常可以先 remove 后重新 add；本地 clone 则执行 `git pull` 后重新安装依赖。更新后建议重启 `dsh web`。

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

如果 profile 使用 pnpm，`file:` 依赖可能会被快照复制到 `.pnpm`。修改插件源码后需要重新 `pnpm install`，或同步快照后再刷新 DSH。

## 使用

1. 点击会话头部 **“媒体查看”** 打开统一查看器；
2. 直接点击聊天里的文件按钮、文件芯片、链接或灰底行内代码路径，也会自动在右侧打开；
3. 视频 / 音频直接播放，工具栏可选 0.5× ~ 2× 倍速；
4. Markdown / 文本 / 字幕 / PDF / DOCX / XLSX / PPTX 可点击 **“复制全文”**；
5. XLSX 在上方切换工作表；PPTX 用上一页 / 下一页逐页查看；
6. 任意已支持文件点击 **“下载”** 获取原文件；
7. 右侧栏左边缘可拖动调整宽度，点 **“浮动”** 可切换窗口模式。

例如模型直接输出：

```text
/srv/e5-data/deepseek-harness/workspace/project/final.mp4
```

只要该路径在聊天中渲染成行内代码并且扩展名受支持，插件即可把它识别为可打开文件。无需改写成 HTML，也无需强制写成 `file://`。

## 架构

### Host：`index.js`

- 监听 `fs/observed`，维护会话隔离的最近文件记录
- `/media-viewer/api/recent`：最近媒体 / 文档
- `/media-viewer/api/meta`：文件类型、大小、MIME、能力信息
- `/media-viewer/api/text`：Markdown / 文本 / 字幕 / PDF / DOCX / XLSX / PPTX 全文提取
- `/media-viewer/api/structured`：XLSX / PPTX 结构化预览数据
- `/media-viewer/api/peek`：列表摘要
- `/media-viewer/api/content`：二进制流与下载；支持 `HEAD` 和 HTTP Byte Range

音视频使用 `createReadStream()` 流式输出。带 Range 请求时返回 `206 Partial Content`，用于媒体 seek。

XLSX 使用 ExcelJS 解析；PPTX 本质是 ZIP + XML，使用 JSZip 读取 `ppt/slides/slideN.xml` 并抽取文字结构，不执行 Office 文档中的宏或脚本。

### Client：`client.js`

- 使用 `conversation.session.header.actions` 注册入口
- 使用 `shell.overlay` 注册右侧 / 浮动查看器
- 使用 `conversation.view` 注册“媒体查看”页签
- 捕获聊天中的文件按钮、链接、文件芯片和 `<code>` 文件路径并改为内部预览
- 文件点击采用局部识别：只从实际匹配的元素读取路径属性 / 文本，不沿父容器继续搜索
- Markdown 渲染逻辑由 `dsh-md-preview` 的实现思路扩展而来
- XLSX：工作表 tabs + 可滚动表格
- PPTX：逐页文字结构卡片
- 字幕：时间轴卡片
- 音视频：原生媒体 controls + 倍速 / 快捷键 / 自适应比例

## 依赖

- `mammoth`：DOCX 正文提取
- `pdfjs-dist@4.10.38`：PDF 文本层提取
- `exceljs@4.4.0`：XLSX 读取
- `jszip@3.10.1`：PPTX ZIP/XML 读取

PDF.js 固定在 4.10.38，主要为了保持 DSH 当前 Node 20 系列环境兼容。

## 安全与限制

- 文本 / 字幕直接预览与复制上限：8 MB
- PDF / DOCX / XLSX / PPTX 解析文件上限：64 MB
- 提取后的全文最多约 8 MB，超过会截断
- XLSX UI 每个工作表最多预览前 250 行、80 列；“复制全文”走单独的全文提取逻辑
- PPTX 结构化预览最多读取前 200 页
- 不执行文档中的脚本、宏或嵌入代码；HTML / 源码文件按纯文本显示
- PDF 预览使用浏览器自带 PDF Viewer
- MKV / MOV / FLAC 等能否直接播放取决于浏览器编解码支持；服务端 Range / 下载能力不受影响
- 插件面向 DSH 本地工作目录文件；文件解析失败时仍保留下载能力

## 与 dsh-md-preview 的关系

`dsh-media-viewer` 是对 `dsh-md-preview` 的统一化扩展，而不是旁边再装一套互相抢点击事件的预览器。它复用 / 改写了后者的：

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

## 更新记录

### v0.2.3

- 修复严重回归：授权 / 确认等操作按钮所在的工具卡片如果同时包含文件路径，旧逻辑可能把操作按钮误判为文件入口
- 文件拦截现在只检查实际匹配的点击元素，不再向上扫描任意祖先容器文本
- 移除通用 `[tabindex]` 拦截，避免误捕获 DSH 自身控件
- 聊天 `<code>` 完整文件路径仍然可以直接点击打开

### v0.2.2

- 支持直接点击聊天 Markdown 中的行内代码文件路径，例如 `/srv/.../final.mp4`
- `<code>` 文件路径悬停时增加可点击样式和提示
- 不再需要让模型特意把本地文件输出为 `file://...`

### v0.2.1

- 视频按原始宽高比自动适配右侧停靠栏和浮动窗口，横屏 / 竖屏不拉伸
- 聊天文件点击识别扩展到 `button`、`a`、`role=button` 和常见 `data-*` 文件属性
- 支持只显示文件名的相对路径，例如 `demo.mp4`

### v0.2.0

- 新增 XLSX 结构化预览和全文复制
- 新增 PPTX 逐页文字结构预览和全文复制
- 新增 SRT / VTT / ASS / SSA / LRC 字幕预览
- 新增音视频倍速和快捷键
- 新增 `/media-viewer/api/structured`

## License

MIT
