// epub.js — 零依赖 EPUB 解析模块
// 仅使用浏览器原生 API：DecompressionStream / DOMParser / TextDecoder / Blob / Response / URL
// 错误一律抛中文 Error，由调用方 catch 后提示用户。

export function supportsEpub() {
  return typeof DecompressionStream !== 'undefined';
}

// ---------------------------------------------------------------------------
// ZIP 解析（仅支持 stored / deflate，拒绝 ZIP64 与加密条目）
// ---------------------------------------------------------------------------

const SIG_EOCD = 0x06054b50; // PK\x05\x06
const SIG_CDH = 0x02014b50;  // PK\x01\x02
const SIG_LFH = 0x04034b50;  // PK\x03\x04

function decodeEntryName(bytes, utf8Flag) {
  if (utf8Flag) return new TextDecoder('utf-8').decode(bytes);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch { /* fall through */ }
  try {
    return new TextDecoder('gbk').decode(bytes);
  } catch { /* fall through */ }
  try {
    return new TextDecoder('windows-1252').decode(bytes);
  } catch { /* fall through */ }
  return new TextDecoder('utf-8').decode(bytes);
}

async function inflateRaw(u8) {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([u8]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

class ZipReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.entries = new Map();       // 条目名(已归一) -> entry
    this.lowerIndex = new Map();    // 条目名小写 -> entry（大小写回退查找）
    this.cdOffset = 0;
    this.entriesTotal = 0;
  }

  async init() {
    this.#locateEocd();
    this.#parseCentralDirectory();
  }

  #locateEocd() {
    const view = this.view;
    const len = view.byteLength;
    if (len < 22) throw new Error('不是有效的 EPUB（ZIP）文件');
    const minOffset = Math.max(0, len - 22 - 65535);
    let eocd = -1;
    for (let i = len - 22; i >= minOffset; i--) {
      if (view.getUint32(i, true) === SIG_EOCD) { eocd = i; break; }
    }
    if (eocd === -1) throw new Error('不是有效的 EPUB（ZIP）文件');
    const entriesTotal = view.getUint16(eocd + 10, true);
    const cdOffset = view.getUint32(eocd + 16, true);
    if (entriesTotal === 0xFFFF || cdOffset === 0xFFFFFFFF) {
      throw new Error('暂不支持 ZIP64 格式的 EPUB');
    }
    this.entriesTotal = entriesTotal;
    this.cdOffset = cdOffset;
  }

  #parseCentralDirectory() {
    const view = this.view;
    const len = view.byteLength;
    let p = this.cdOffset;
    for (let n = 0; n < this.entriesTotal; n++) {
      if (p + 46 > len || view.getUint32(p, true) !== SIG_CDH) {
        throw new Error('EPUB 文件结构损坏');
      }
      const flags = view.getUint16(p + 8, true);
      const method = view.getUint16(p + 10, true);
      const compSize = view.getUint32(p + 20, true);
      const nameLen = view.getUint16(p + 28, true);
      const extraLen = view.getUint16(p + 30, true);
      const commentLen = view.getUint16(p + 32, true);
      const localOffset = view.getUint32(p + 42, true);
      if (p + 46 + nameLen + extraLen + commentLen > len) {
        throw new Error('EPUB 文件结构损坏');
      }
      const nameBytes = new Uint8Array(this.buffer, p + 46, nameLen);
      // 归一：反斜杠 → 正斜杠（个别打包工具的兼容性防御）
      const name = decodeEntryName(nameBytes, (flags & 0x800) !== 0).replace(/\\/g, '/');
      if (!name.endsWith('/')) {
        const entry = { name, flags, method, compSize, localOffset };
        if (!this.entries.has(name)) this.entries.set(name, entry);
        const lower = name.toLowerCase();
        if (!this.lowerIndex.has(lower)) this.lowerIndex.set(lower, entry);
      }
      p += 46 + nameLen + extraLen + commentLen;
    }
  }

  find(name) {
    const hit = this.entries.get(name);
    if (hit) return hit;
    return this.lowerIndex.get(name.toLowerCase()) || null;
  }

  has(name) {
    return this.find(name) !== null;
  }

  #dataOffset(entry) {
    const view = this.view;
    const lo = entry.localOffset;
    if (lo + 30 > view.byteLength || view.getUint32(lo, true) !== SIG_LFH) {
      throw new Error('EPUB 文件结构损坏');
    }
    // 本地头的 nameLen/extraLen 可能与中央目录不同，必须重新读取
    const nameLen = view.getUint16(lo + 26, true);
    const extraLen = view.getUint16(lo + 28, true);
    return lo + 30 + nameLen + extraLen;
  }

  async readBytes(name) {
    const entry = this.find(name);
    if (!entry) return null;
    if (entry.flags & 0x1) throw new Error('该 EPUB 包含加密条目，无法解析');
    if (entry.method !== 0 && entry.method !== 8) {
      throw new Error('不支持的压缩方式（仅支持 stored / deflate）');
    }
    const start = this.#dataOffset(entry);
    const end = start + entry.compSize;
    if (end > this.view.byteLength) throw new Error('EPUB 文件结构损坏');
    const raw = new Uint8Array(this.buffer, start, entry.compSize);
    if (entry.method === 0) {
      const out = new Uint8Array(entry.compSize);
      out.set(raw);
      return out;
    }
    return await inflateRaw(raw);
  }

  async readText(name) {
    const bytes = await this.readBytes(name);
    if (bytes === null) return null;
    return new TextDecoder('utf-8').decode(bytes);
  }
}

// ---------------------------------------------------------------------------
// 路径解析
// ---------------------------------------------------------------------------

function dirOf(path) {
  const i = path.lastIndexOf('/');
  return i === -1 ? '' : path.slice(0, i);
}

// 将 href 解析为「书根相对路径」；外部协议 URL 原样返回；去 fragment/query
function resolvePath(baseDir, href) {
  if (!href) return '';
  let h = href.trim();
  const cut = h.search(/[?#]/);
  if (cut !== -1) h = h.slice(0, cut);
  if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(h)) return h;
  try { h = decodeURIComponent(h); } catch { /* 保留原文 */ }
  const parts = [];
  if (baseDir) {
    for (const seg of baseDir.split('/')) if (seg && seg !== '.') parts.push(seg);
  }
  if (h.startsWith('/')) h = h.slice(1); // 书根绝对路径
  for (const seg of h.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') { parts.pop(); continue; }
    parts.push(seg);
  }
  return parts.join('/');
}

// ---------------------------------------------------------------------------
// container.xml / OPF / TOC
// ---------------------------------------------------------------------------

function parseContainerXml(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  let chosen = null;
  let first = null;
  for (const el of doc.getElementsByTagName('*')) {
    if (el.localName !== 'rootfile') continue;
    const fp = el.getAttribute('full-path');
    if (!fp) continue;
    if (!first) first = fp;
    if ((el.getAttribute('media-type') || '') === 'application/oebps-package+xml') {
      chosen = fp;
      break;
    }
  }
  const path = chosen || first;
  if (!path) throw new Error('EPUB 结构不完整：container.xml 中未找到 OPF 路径');
  try { return decodeURIComponent(path); } catch { return path; }
}

function isHtmlDoc(item) {
  const mt = item.mediaType;
  if (mt === 'application/xhtml+xml' || mt === 'text/html') return true;
  if (!mt) return /\.(xhtml|html?)$/i.test(item.href);
  return false;
}

function parseOpf(text, opfDir) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('EPUB 的 OPF 文件已损坏');

  let title = '';
  for (const el of doc.getElementsByTagName('*')) {
    if (el.localName === 'title') { title = el.textContent.trim(); break; }
  }

  const manifestById = new Map();
  const manifestByHref = new Map();
  let navHref = null;
  let ncxHrefByMediaType = null;
  for (const el of doc.getElementsByTagName('*')) {
    if (el.localName !== 'item') continue;
    const id = el.getAttribute('id');
    const href = el.getAttribute('href');
    if (!id || !href) continue;
    const item = {
      id,
      href: resolvePath(opfDir, href),
      mediaType: el.getAttribute('media-type') || '',
      properties: el.getAttribute('properties') || ''
    };
    manifestById.set(id, item);
    if (!manifestByHref.has(item.href)) manifestByHref.set(item.href, item);
    if (!navHref && /\bnav\b/.test(item.properties)) navHref = item.href;
    if (!ncxHrefByMediaType && item.mediaType === 'application/x-dtbncx+xml') {
      ncxHrefByMediaType = item.href;
    }
  }

  let spineEl = null;
  for (const el of doc.getElementsByTagName('*')) {
    if (el.localName === 'spine') { spineEl = el; break; }
  }

  const itemrefs = [];
  let ncxId = null;
  if (spineEl) {
    ncxId = spineEl.getAttribute('toc');
    for (const el of spineEl.getElementsByTagName('*')) {
      if (el.localName !== 'itemref') continue;
      const idref = el.getAttribute('idref');
      if (!idref) continue;
      const item = manifestById.get(idref);
      if (item) itemrefs.push({ item, linear: (el.getAttribute('linear') || 'yes') !== 'no' });
    }
  }
  let docs = itemrefs.filter(r => r.linear && isHtmlDoc(r.item));
  if (docs.length === 0) docs = itemrefs.filter(r => isHtmlDoc(r.item));
  const spineDocHrefs = docs.map(r => r.item.href);
  if (spineDocHrefs.length === 0) throw new Error('EPUB 结构不完整：没有可阅读的章节');

  let ncxHref = null;
  if (ncxId) {
    const item = manifestById.get(ncxId);
    if (item) ncxHref = item.href;
  }
  if (!ncxHref) ncxHref = ncxHrefByMediaType;

  return { title, manifestByHref, spineDocHrefs, navHref, ncxHref };
}

function getEpubType(el) {
  return el.getAttribute('epub:type')
    || el.getAttributeNS('http://www.idpf.org/2007/ops', 'type')
    || el.getAttribute('type')
    || '';
}

async function parseNavToc(zip, navHref) {
  const text = await zip.readText(navHref);
  if (text === null) return [];
  let doc = new DOMParser().parseFromString(text, 'application/xhtml+xml');
  if (doc.querySelector('parsererror')) {
    doc = new DOMParser().parseFromString(text, 'text/html');
  }
  const navs = doc.getElementsByTagName('nav');
  let nav = null;
  for (const el of navs) {
    if (getEpubType(el).trim() === 'toc') { nav = el; break; }
  }
  if (!nav && navs.length > 0) nav = navs[0];
  if (!nav) return [];

  const toc = [];
  const dir = dirOf(navHref);
  for (const a of nav.getElementsByTagName('a')) {
    const href = a.getAttribute('href');
    if (!href) continue;
    const label = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!label) continue;
    toc.push({ label, href: resolvePath(dir, href) });
  }
  return toc;
}

async function parseNcxToc(zip, ncxHref) {
  const text = await zip.readText(ncxHref);
  if (text === null) return [];
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) return [];

  const toc = [];
  const dir = dirOf(ncxHref);
  for (const np of doc.getElementsByTagName('navPoint')) {
    const labels = np.getElementsByTagName('navLabel');
    let label = '';
    if (labels.length > 0) {
      const texts = labels[0].getElementsByTagName('text');
      if (texts.length > 0) label = (texts[0].textContent || '').replace(/\s+/g, ' ').trim();
    }
    const contents = np.getElementsByTagName('content');
    const src = contents.length > 0 ? contents[0].getAttribute('src') : null;
    if (!label || !src) continue;
    toc.push({ label, href: resolvePath(dir, src) });
  }
  return toc;
}

async function parseToc(zip, opf) {
  if (opf.navHref && zip.has(opf.navHref)) {
    const toc = await parseNavToc(zip, opf.navHref);
    if (toc.length > 0) return toc;
  }
  if (opf.ncxHref && zip.has(opf.ncxHref)) {
    const toc = await parseNcxToc(zip, opf.ncxHref);
    if (toc.length > 0) return toc;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 内容净化（黑名单节点 + 属性白名单）与图片/链接处理
// ---------------------------------------------------------------------------

const REMOVE_NODES = new Set([
  'script', 'style', 'link', 'meta', 'iframe', 'object', 'embed',
  'form', 'input', 'select', 'textarea', 'button', 'video', 'audio',
  'base', 'frame', 'frameset', 'applet', 'canvas', 'dialog', 'math',
  'foreignobject', 'animate', 'animatemotion', 'animatetransform', 'set', 'map'
]);

const GLOBAL_ATTRS = new Set(['id', 'dir', 'lang']);
const TAG_ATTRS = {
  a: ['href'],
  img: ['src', 'alt', 'width', 'height'],
  image: ['href', 'xlink:href'],
  svg: ['viewbox', 'width', 'height', 'preserveaspectratio'],
  th: ['colspan', 'rowspan', 'scope', 'headers'],
  td: ['colspan', 'rowspan', 'scope', 'headers']
};

const IMG_MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp'
};

function guessMime(path, manifestByHref) {
  const item = manifestByHref.get(path);
  if (item && item.mediaType) return item.mediaType;
  const m = path.toLowerCase().match(/\.([a-z0-9]+)$/);
  return (m && IMG_MIME[m[1]]) || 'application/octet-stream';
}

function removeBlacklisted(body) {
  for (const el of [...body.querySelectorAll('*')]) {
    if (REMOVE_NODES.has(el.localName.toLowerCase())) el.remove();
  }
}

function applyAttrWhitelist(body) {
  // 含根元素本身：EPUB 常见 <body style="background:…"> / bgcolor，需一并清除，
  // 否则书籍自带背景色会覆盖阅读区的白色背景
  for (const el of [body, ...body.querySelectorAll('*')]) {
    const tag = el.localName.toLowerCase();
    const allowed = TAG_ATTRS[tag];
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      const kept = GLOBAL_ATTRS.has(name)
        || (allowed ? allowed.includes(name) : false);
      if (!kept) el.removeAttribute(attr.name);
    }
  }
}

function isExternalUrl(p) {
  return /^https?:/i.test(p);
}

function replaceWithAlt(el, alt) {
  if (alt) {
    const span = el.ownerDocument.createElement('span');
    span.className = 'img-alt';
    span.textContent = alt;
    el.replaceWith(span);
  } else {
    el.remove();
  }
}

async function resolveImage(el, rawAttr, raw, ctx) {
  if (!raw) { replaceWithAlt(el, el.getAttribute('alt')); return; }
  const resolved = resolvePath(ctx.docDir, raw);
  if (isExternalUrl(resolved)) {
    el.setAttribute(rawAttr, raw);
    el.setAttribute('loading', 'lazy');
    el.setAttribute('referrerpolicy', 'no-referrer');
    return;
  }
  let bytes;
  try {
    bytes = await ctx.zip.readBytes(resolved);
  } catch {
    bytes = null;
  }
  if (bytes === null) { replaceWithAlt(el, el.getAttribute('alt')); return; }
  const blob = new Blob([bytes], { type: guessMime(resolved, ctx.manifestByHref) });
  const url = URL.createObjectURL(blob);
  ctx.allUrls.add(url);
  el.setAttribute(rawAttr, url);
}

async function processImages(body, ctx) {
  for (const img of [...body.querySelectorAll('img')]) {
    await resolveImage(img, 'src', img.getAttribute('src'), ctx);
  }
  for (const image of [...body.querySelectorAll('image')]) {
    const raw = image.getAttribute('href') || image.getAttribute('xlink:href');
    const attr = image.getAttribute('href') ? 'href' : 'xlink:href';
    if (!raw) { image.remove(); continue; }
    await resolveImage(image, attr, raw, ctx);
  }
}

function processLinks(body, ctx) {
  for (const a of [...body.querySelectorAll('a')]) {
    const raw = a.getAttribute('href');
    if (!raw) continue;
    const href = raw.trim();
    if (/^\s*(javascript:|vbscript:)/i.test(href) || /^data:text\/html/i.test(href)) {
      a.removeAttribute('href');
      continue;
    }
    if (href.startsWith('#')) {
      const frag = href.slice(1);
      if (frag) a.setAttribute('data-epub-frag', frag);
      a.removeAttribute('href');
      continue;
    }
    const resolved = resolvePath(ctx.docDir, href);
    if (isExternalUrl(resolved)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      continue;
    }
    const frag = (href.match(/#([^#]*)$/) || [])[1] || '';
    let idx = ctx.spineIndex.get(resolved);
    if (idx === undefined) idx = ctx.spineIndexLower.get(resolved.toLowerCase());
    if (idx !== undefined) {
      a.setAttribute('data-epub-chapter', String(idx));
      if (frag) a.setAttribute('data-epub-frag', frag);
    }
    // 内部死链降级为纯文本
    a.removeAttribute('href');
  }
}

// ---------------------------------------------------------------------------
// EpubBook
// ---------------------------------------------------------------------------

class EpubBook {
  #zip;
  #opf;
  #chapters = null;
  #blobUrls = new Set();
  #spineIndex = new Map();
  #spineIndexLower = new Map();

  constructor(zip, opf, toc) {
    this.#zip = zip;
    this.#opf = opf;
    this.title = opf.title || '';
    this.toc = toc || [];
    opf.spineDocHrefs.forEach((href, i) => {
      this.#spineIndex.set(href, i);
      this.#spineIndexLower.set(href.toLowerCase(), i);
    });
  }

  // 章节以 spine 为骨架（保证翻章 = 真实阅读顺序），TOC 只提供标题
  buildChapterList() {
    if (this.#chapters) return this.#chapters;
    const tocByHref = new Map();
    const tocByHrefLower = new Map();
    for (const t of this.toc) {
      if (!tocByHref.has(t.href)) tocByHref.set(t.href, t.label);
      const lower = t.href.toLowerCase();
      if (!tocByHrefLower.has(lower)) tocByHrefLower.set(lower, t.label);
    }
    this.#chapters = this.#opf.spineDocHrefs.map((href, i) => {
      const label = tocByHref.has(href)
        ? tocByHref.get(href)
        : tocByHrefLower.get(href.toLowerCase());
      return label !== undefined
        ? { title: label, href, autoTitle: false }
        : { title: '第 ' + (i + 1) + ' 部分', href, autoTitle: true };
    });
    return this.#chapters;
  }

  async getChapter(docHref) {
    // 释放上一章的图片 blob URL（集合中均为上一章渲染时创建）
    for (const url of this.#blobUrls) URL.revokeObjectURL(url);
    this.#blobUrls.clear();

    const text = await this.#zip.readText(docHref);
    if (text === null) throw new Error('章节文件缺失');
    let doc = new DOMParser().parseFromString(text, 'application/xhtml+xml');
    if (doc.querySelector('parsererror')) {
      doc = new DOMParser().parseFromString(text, 'text/html');
    }
    const body = doc.body || doc.documentElement;
    if (!body) throw new Error('章节内容为空');

    const ctx = {
      zip: this.#zip,
      docDir: dirOf(docHref),
      manifestByHref: this.#opf.manifestByHref,
      allUrls: this.#blobUrls,
      spineIndex: this.#spineIndex,
      spineIndexLower: this.#spineIndexLower
    };

    removeBlacklisted(body);
    applyAttrWhitelist(body);
    await processImages(body, ctx);
    processLinks(body, ctx);

    // 章节标题：<title> 优先，回退首个 h1-h6
    let title = null;
    const titleEl = doc.getElementsByTagName('title');
    if (titleEl.length > 0 && titleEl[0].textContent.trim()) {
      title = titleEl[0].textContent.trim();
    } else {
      for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
        const els = body.getElementsByTagName(tag);
        if (els.length > 0) {
          title = els[0].textContent.replace(/\s+/g, ' ').trim() || null;
          break;
        }
      }
    }
    return { title, element: body };
  }

  cleanup() {
    for (const url of this.#blobUrls) URL.revokeObjectURL(url);
    this.#blobUrls.clear();
  }
}

// ---------------------------------------------------------------------------
// 顶层入口
// ---------------------------------------------------------------------------

export async function parseEpub(arrayBuffer) {
  if (!supportsEpub()) throw new Error('当前浏览器不支持 EPUB 解压功能');
  const head = new Uint8Array(arrayBuffer, 0, Math.min(4, arrayBuffer.byteLength));
  if (head.length < 4 || head[0] !== 0x50 || head[1] !== 0x4B || head[2] !== 0x03 || head[3] !== 0x04) {
    throw new Error('不是有效的 EPUB 文件（缺少 ZIP 标识）');
  }
  const zip = new ZipReader(arrayBuffer);
  await zip.init();
  if (!zip.has('META-INF/container.xml')) {
    throw new Error('EPUB 结构不完整：缺少 META-INF/container.xml');
  }
  const opfPath = parseContainerXml(await zip.readText('META-INF/container.xml'));
  const opfText = await zip.readText(opfPath);
  if (opfText === null) throw new Error('EPUB 结构不完整：未找到 OPF 文件');
  const opf = parseOpf(opfText, dirOf(opfPath));
  const toc = await parseToc(zip, opf);
  return new EpubBook(zip, opf, toc);
}
