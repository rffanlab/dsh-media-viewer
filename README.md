<div align="center">

# dsh-media-viewer

**DeepSeek Harness 的统一媒体 / 文档查看器**

视频、音频、图片、Markdown、文本、PDF、Word，在 DSH 对话旁边直接查看；可复制的文档一键复制全文；所有文件都能下载。

</div>

## 功能

- **视频播放**：`.mp4 / .webm / .mov / .m4v / .ogv / .mkv`
  - 原生 `<video controls>`：播放 / 暂停 / 音量 / 全屏 / 拖动进度
  - Host 端支持 HTTP `Range`，大视频无需整文件一次性读入内存
- **音频播放**：`.mp3 / .wav / .ogg / .m4a / .aac / .flac / .opus`
  - 原生 `<audio controls>`：播放 / 暂停 / 拖动进度
- **图片查看**：PNG / JPEG / GIF / WebP / AVIF / BMP / ICO / SVG
- **Markdown 预览**：整合 `dsh-md-preview` 的 DSH 插槽接入、右侧停靠思路和 Markdown 渲染能力
  - 标题、列表、表格、代码块、引用、链接、图片
  - Markdown 相对图片路径自动通过媒体端点加载
- **文本 / 代码预览**：TXT、日志、JSON/YAML/TOML、CSV/XML、常见源码文件等
- **PDF**：浏览器原生 PDF 预览；可提取全文并复制；可下载原 PDF
- **DOCX**：提取 Word 正文用于预览和“复制全文”；可下载原 Word 文件
- **其他 Office 文档**：`.doc / .rtf / .odt / .xls / .xlsx / .ods / .ppt / .pptx / .odp` 当前提供统一下载入口
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
| PDF | ✅ 浏览器 PDF | ✅ 提取文本 | ✅ |
| DOCX | ✅ 提取正文 | ✅ 提取正文 | ✅ |
| 视频 / 音频 / 图片 | ✅ | — | ✅ |
| DOC / XLS(X) / PPT(X) 等 | 暂不内嵌 | 暂不提取 | ✅ |

> PDF 的“复制全文”是文本层提取：扫描件 PDF 如果本身没有 OCR 文本层，结果可能为空。插件不会自动做 OCR。

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
2. 直接点击对话里的视频、音频、Markdown、PDF、Word、文本等文件引用，也会自动在右侧打开；
3. 视频和音频直接使用播放器 controls；
4. 文本 / Markdown / PDF / DOCX 点击 **“复制全文”**；
5. 任意已支持文件点击 **“下载”** 获取原文件；
6. 右侧栏左边缘可拖动调整宽度，点 **“浮动”** 可切换窗口模式。

## 架构

### Host：`index.js`

- 监听 `fs/observed`，维护会话隔离的最近文件记录
- `/media-viewer/api/recent`：最近媒体 / 文档
- `/media-viewer/api/meta`：文件类型、大小、MIME、能力信息
- `/media-viewer/api/text`：Markdown / 文本 / PDF / DOCX 的全文提取
- `/media-viewer/api/peek`：列表摘要
- `/media-viewer/api/content`：二进制流与下载；支持 `HEAD` 和 HTTP Byte Range

音视频不走“读完整文件 → Buffer → 一次性返回”，而是由 `createReadStream()` 流式输出；带 Range 请求时返回 `206 Partial Content`，以支持媒体播放器 seek。

### Client：`client.js`

- 使用 DSH `conversation.session.header.actions` 注册入口
- 使用 `shell.overlay` 注册右侧 / 浮动查看器
- 使用 `conversation.view` 注册“媒体查看”页签
- 捕获对话里的受支持文件按钮点击并改为内部预览
- Markdown 渲染逻辑由 `dsh-md-preview` 的实现思路扩展而来

## 依赖

- `mammoth`：DOCX 正文提取
- `pdfjs-dist@4.10.38`：PDF 文本层提取

PDF.js 固定在 4.10.38，主要是为了保持 DSH 当前 Node 20 系列环境兼容；新版本 PDF.js 已提高部分 Node 版本要求。

## 安全 / 限制

- 文本直接预览 / 复制上限：8 MB
- PDF / DOCX 文本提取文件上限：64 MB
- 提取后的文本最多约 8 MB，超过会截断
- 不执行文档中的脚本；HTML / 源码文件按纯文本显示
- PDF 预览使用浏览器自带 PDF viewer
- 当前 `.doc / .xlsx / .pptx` 等只下载、不做复杂格式还原；后续可增加专门解析器
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
npm run check
npm test
```

测试目前覆盖：

- 文件类型分类
- MIME 映射
- HTTP Range 解析（含 suffix range）

## License

MIT
