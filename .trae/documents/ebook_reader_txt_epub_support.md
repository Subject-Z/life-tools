# 「TXT电子书阅读器」→「电子书阅读器」（TXT + EPUB）

## 背景与目标

现有 `tools/txt-reader/` 是纯 TXT 阅读器（书架 + 章节解析 + 目录侧栏 + 字号调节 + 进度记忆）。需求：
1. 改名为「电子书阅读器」（用户已确认：目录、工具 ID、显示名全部重命名）。
2. 新增 EPUB 格式支持，复用统一的书架与阅读体验。

约束：项目为零依赖纯静态站点（无 CDN/npm/构建），保持零依赖 —— 用浏览器原生 `DecompressionStream('deflate-raw')` 自实现 ZIP 解压，**不引入 epub.js/JSZip**。

已确认决策：
- `tools/txt-reader` → `tools/ebook-reader`（git mv 保留历史），id `txt-reader` → `ebook-reader`。
- 存储标识**保持不变**（localStorage 键 `txtReader_books`/`txtReader_progress`/`readerFontSize`、IndexedDB `txtReaderDB/contents`），老用户书架数据零迁移、不丢失。
- **`push.bat` 存在用户未提交改动：不触碰、不暂存、不提交。**

## 阶段一：重命名与文案

1. `git mv tools/txt-reader tools/ebook-reader`
2. `tools/ebook-reader/index.html`：
   - `<title>` → `电子书阅读器 — 生活工具箱`；面包屑 → `电子书阅读器`
   - `accept` → `.txt,.epub,application/epub+zip,text/plain`（保留 `multiple`）
   - 空状态文案 → `书架空空如也，点击上方按钮添加 TXT / EPUB 电子书吧`
3. `tools/ebook-reader/script.js`：两处 `document.title` 字符串改「电子书阅读器」（存储键不动）。
4. `config/tools.js`（全站唯一路径引用点，grep 已验证）：`id: 'ebook-reader'`、`name: '电子书阅读器'`、description 改为支持 TXT/EPUB 的描述、`path: 'tools/ebook-reader/index.html'`；icon/分类不变。
5. `README.md`：中英文两节（第 18-19、36-37 行）同步改名与描述。

## 阶段二：新建 `tools/ebook-reader/epub.js`（零依赖 EPUB 解析模块）

不引用 DOM 页面元素，仅用 `DOMParser/TextDecoder/Blob/Response/URL/DecompressionStream`。错误抛中文消息，由调用方 alert。

**导出面：**
```js
export function supportsEpub()                // 'DecompressionStream' in globalThis
export async function parseEpub(arrayBuffer) // → EpubBook，任一步失败 throw Error(中文)
class EpubBook {
  title          // dc:title，取不到为 ''
  toc            // [{label, href}]，书根相对路径、去 fragment/query
  buildChapterList()               // → chapters（幂等）
  async getChapter(docHref)        // → { title: string|null, element: Element }
  cleanup()                       // revoke 全书 blob URL
}
```

**ZIP 解析（ZipReader）：**
- EOCD：从尾部向前扫最多 65535+22 字节找签名 `0x06054b50`，读 cdOffset/cdSize/entriesTotal；扫不到 → 报「不是有效的 EPUB（ZIP）文件」。
- ZIP64 哨兵值（0xFFFF/0xFFFFFFFF）→ 明确报错拒绝。
- 中央目录条目（46 字节 + 变长，签名 `0x02014b50`）：flags@8、method@10、compSize@20、uncompSize@24、nameLen@28、extraLen@30、commentLen@32、localOffset@42。
- 跳过目录项（名以 `/` 结尾）；条目名 `\`→`/` 归一。
- **数据真实起点从本地头重算**：`localOffset + 30 + localNameLen + localExtraLen`（本地头 `0x04034b50`，nameLen@26/extraLen@28 —— 本地 extra 长度常与中央目录不同）。bit 3（数据描述符）无需处理：按中央目录 compSize 精确切片。
- 文件名解码：bit11 → utf-8；否则 `utf-8{fatal:true}` → `gbk` → `windows-1252` 兜底。
- 加密（flags bit0）与非 0/8 压缩法：登记后惰性报错（读到该条目才抛）。
- 解压：stored 直接 slice；deflate 用 `new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'))` → `Response.arrayBuffer()`。
- 查找：`Map<decodedName, entry>`，先精确、后大小写不敏感回退。
- 顶层 `parseEpub` 先验前 4 字节 `PK\x03\x04`；打开书只解压 container.xml + OPF + TOC 三个小文件，章节按需解压。

**路径解析 `resolvePath(baseDir, href)`：**去 fragment/query → 外部协议原样返回 → try `decodeURIComponent` → 逐段处理 `./`、`../` 合成书根相对路径。`dirOf(path)` 取目录部分。

**container.xml/OPF/TOC：**
- `META-INF/container.xml` → rootfile full-path（优先 `media-type="application/oebps-package+xml"`，路径 decodeURIComponent）。
- OPF：dc:title（回退 `opf:title`）取书名；manifest（id/href/mediaType/properties）+ spine（itemref 顺序，跳过 `linear="no"`，若全被跳过则不过滤）；只保留 xhtml/html 文档；记录 spine@toc（NCX id）。
- TOC 优先级：EPUB3 nav（manifest properties 含 `nav`，找 `epub:type="toc"` 的 `<nav>`，收集全部 `<a>`）→ EPUB2 NCX（spine@toc 或 media-type `application/x-dtbncx+xml`，navPoint 文档序展平）→ 都没有则 null。

**章节模型：**`chapters` 以 **spine 为骨架**（保证上一章/下一章 = 真实阅读顺序），TOC 仅提供标题：每个 spine 文档找第一个 TOC 匹配条目（去 fragment 比对 + 大小写回退）→ title；无匹配 → `第 N 部分` + `autoTitle: true`。TOC 指向 spine 外的条目丢弃。

**getChapter 管线：**revoke 上一章 blob URL → readText → `DOMParser('application/xhtml+xml')`，parsererror 回退 `'text/html'` → 取 body → sanitize → 返回 `{title, element: body}`（title 取 `<title>` 回退首个 `h1-h6`）。调用方 `appendChild` 自动跨 document adopt。

**安全净化（关键）：**
- 节点黑名单（删元素保子文本）：`script, style, link, meta, iframe, object, embed, form, input, select, textarea, button, video, audio, base, frame, frameset, applet, canvas, dialog, math, foreignObject, animate, animateMotion, animateTransform, set, map`。
- 属性白名单：通用 `id, dir, lang`；`a:href`；`img:src,alt,width,height`；`th/td:colspan,rowspan,scope`；`svg:viewBox,width,height,preserveAspectRatio`；`image:href,xlink:href`。其余（含所有 `on*`、`style`、`class`）删除。
- `javascript:`/`data:text/html`/`vbscript:` href → 删属性。

**图片与链接：**
- 图片（img/src、svg image href）：内部路径 → zip 条目 → Blob → `URL.createObjectURL`；zip 无此条目 → 删 img，有 alt 用文本替代；外部 http(s) → 保留并加 `loading="lazy"`、`referrerpolicy="no-referrer"`。
- blob 生命周期：`#blobUrls`（全书）+ `#chapterUrls`（当前章），每章开头 revoke 上一章，`cleanup()` 兜底，零泄漏。
- 链接：纯 fragment → `data-epub-frag`；内部文档 → `data-epub-chapter`（+frag）；死链/外部链接处理见上。

## 阶段三：script.js 集成

- 顶部 `import { parseEpub, supportsEpub } from './epub.js';`
- 新状态：`bookFormat`('txt'|'epub')、`epubBook`、`chapterRenderToken`（showChapter 异步竞态令牌）。
- `fileInput` change 重构：`getFileFormat`（按扩展名分流）→ `importTxt`（现有逻辑抽出，format:'txt'）→ `importEpub`（readAsArrayBuffer → PK 校验 → `parseEpub` → buildChapterList 计章数 → 书名取 dc:title 回退文件名 → 存 **原始 ArrayBuffer** → 失败回滚 pop+alert）；共享 processed 计数器，每文件 try/catch。
- `openBook`：`book.format` 无字段默认 'txt'；epub 分支 parseEpub + buildChapterList，进度恢复逻辑不变（统一为 chapters 下标，saveProgress 零改动）。
- `showChapter` 改 async + 令牌：epub 分支 `getChapter`（加载中提示、过期渲染丢弃、惰性标题回填更新侧栏与 contentTitle）；txt 分支原样。其余（高亮/按钮/N/M/进度）不变。
- `showBookshelf`：开头 `epubBook.cleanup()` + 重置状态。
- `renderBookshelf`：卡片加格式徽章（TXT/EPUB 小样式）。
- 新增 contentBody 点击委托：处理 `data-epub-chapter`（跳章）与 `data-epub-frag`（`CSS.escape` 后 scrollIntoView）。
- prev/next/键盘/deleteBook 零改动。

## 阶段四：style.css 追加（`@media` 之前；TXT 样式零改动）

- `.book-card-format` 徽章（txt 灰边框 / epub 强调色）。
- `.content-body` 作用域的 EPUB 排版：h1-h6、`img,svg{display:block;max-width:100%;height:auto;margin:0.75rem auto}`（化解 `p{text-indent:2em}` 使纯图片段落右移）、blockquote、ul/ol/li、table/th/td、hr、pre/code、a、figure/figcaption。中文小说统一首行缩进是刻意选择。

## 验证清单

测试基建：`start_server.bat`（python http.server 8080，ES module 需 HTTP）。用 python zipfile 生成 3 个测试 EPUB：EPUB3(nav)/EPUB2(ncx)/混合；内容覆盖标题/列表/引用/表格/图片/内链(fragment+跨章)/外链，以及 `<script>`、`onerror`、`javascript:` 安全样例与非法 XHTML 回退样例；另取 Project Gutenberg 真实 epub 做兼容验证。

1. 首页卡片「电子书阅读器」→ 新路径可打开，标题/面包屑正确。
2. TXT 回归：解析/侧栏/翻章/字号/进度正常；存储键与 IndexedDB 名不变，老数据可读。
3. EPUB 三变体入架（EPUB 徽章、章数=spine 数、书名=dc:title）。
4. 阅读：TOC 标题、排版、图片 blob 显示、内链跳章/页内滚动、外链新标签、翻章/方向键/字号/N/M。
5. 安全：恶意样例无 alert，无 script/on* 残留。
6. 容错：假 epub（.zip 改名）友好报错不入架；多选 txt+epub 混合导入不卡计数。
7. 进度记忆（刷新/重开恢复）、内存（createObjectURL/revoke 计数持平）、响应式 375px。

## 风险与边界（已在设计中处理）

ZIP64 拒绝 / 加密条目惰性报错 / 非 0|8 压缩报错 / 数据描述符无需处理 / 本地头 extra 长度重读 / 非 UTF-8 文件名兜底链 / 大小写与反斜杠路径归一 / XHTML 解析回退 / 无 TOC 兜底 / showChapter 竞态令牌 / blob 双保险 revoke / 旧数据无 format 默认 txt / 大书按需解压 + 存压缩态。

## 实施顺序

A. git mv + 全部改名文案（可独立回归）→ B. 新建 epub.js → C. script.js 集成 → D. style.css → E. 验证清单全量执行。
