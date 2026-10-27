import { parseEpub, supportsEpub } from './epub.js';

document.addEventListener('DOMContentLoaded', function() {
  const bookshelfView = document.getElementById('bookshelfView');
  const bookList = document.getElementById('bookList');
  const emptyState = document.getElementById('emptyState');
  const addBookBtn = document.getElementById('addBookBtn');
  const fileInput = document.getElementById('fileInput');
  const readerContainer = document.getElementById('readerContainer');
  const chapterList = document.getElementById('chapterList');
  const contentTitle = document.getElementById('contentTitle');
  const contentBody = document.getElementById('contentBody');
  const sidebar = document.getElementById('sidebar');
  const toggleSidebar = document.getElementById('toggleSidebar');
  const closeSidebar = document.getElementById('closeSidebar');
  const openSettings = document.getElementById('openSettings');
  const closeSettings = document.getElementById('closeSettings');
  const settingsPanel = document.getElementById('settingsPanel');
  const fixedButtons = document.getElementById('fixedButtons');
  const contentPanel = document.querySelector('.content-panel');
  const fontSizeValue = document.getElementById('fontSizeValue');
  const fontSizeDecrease = document.getElementById('fontSizeDecrease');
  const fontSizeIncrease = document.getElementById('fontSizeIncrease');
  const prevChapter = document.getElementById('prevChapter');
  const nextChapter = document.getElementById('nextChapter');
  const chapterInfo = document.getElementById('chapterInfo');
  const backToBookshelf = document.getElementById('backToBookshelf');
  const readingProgress = document.getElementById('readingProgress');
  const readingProgressPercent = document.getElementById('readingProgressPercent');

  let chapters = [];
  let currentChapterIndex = 0;
  let currentFontSize = 16;
  let currentBookId = null;
  let bookFormat = 'txt';
  let epubBook = null;
  let chapterRenderToken = 0;
  let chapterReady = false;
  let progressFrameId = 0;
  let lastProgressPercent = -1;

  // 章节正文顶部与视口顶部留出的间距，进度以此刻度为 0%
  const CHAPTER_TOP_OFFSET = 16;

  const BOOKS_KEY = 'txtReader_books';
  const PROGRESS_KEY = 'txtReader_progress';
  const DB_NAME = 'txtReaderDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'contents';

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  const savedFontSize = localStorage.getItem('readerFontSize');
  if (savedFontSize) {
    currentFontSize = parseInt(savedFontSize);
    fontSizeValue.textContent = currentFontSize;
    contentBody.style.fontSize = currentFontSize + 'px';
  }

  function getBooks() {
    try {
      return JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
    } catch { return []; }
  }

  function saveBooks(books) {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch { return {}; }
  }

  function saveProgress(bookId, chapterIndex) {
    const progress = getProgress();
    progress[bookId] = chapterIndex;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  async function getBookContent(bookId) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(bookId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch { return null; }
  }

  async function saveBookContent(bookId, content) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(content, bookId);
      req.onsuccess = () => resolve();
      req.onerror = () => {
        if (req.error.name === 'QuotaExceededError') {
          alert('存储空间不足，请删除一些书籍后再试。');
        }
        reject(req.error);
      };
    });
  }

  async function removeBookContent(bookId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(bookId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function removeBookProgress(bookId) {
    const progress = getProgress();
    delete progress[bookId];
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  function generateBookId(name, size, lastModified) {
    return btoa(encodeURIComponent(name + '_' + size + '_' + lastModified)).replace(/[^a-zA-Z0-9]/g, '_');
  }

  function renderBookshelf() {
    const books = getBooks();
    bookList.innerHTML = '';

    if (books.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    const progress = getProgress();

    books.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';

      const chapterProgress = progress[book.id];
      const progressText = chapterProgress !== undefined
        ? '已读至第 ' + (chapterProgress + 1) + ' 章'
        : '未阅读';
      const fmt = book.format === 'epub' ? 'EPUB' : 'TXT';

      card.innerHTML =
        '<div class="book-card-icon">📖</div>' +
        '<div class="book-card-info">' +
          '<div class="book-card-name" title="' + escapeHtml(book.name) + '">' + escapeHtml(book.name) + '</div>' +
          '<div class="book-card-meta">' +
            '<span class="book-card-format format-' + fmt.toLowerCase() + '">' + fmt + '</span>' +
            '<span class="book-card-chapters">' + book.chapterCount + ' 章</span>' +
            '<span class="book-card-progress">' + progressText + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="book-card-actions">' +
          '<button class="book-open-btn" data-id="' + book.id + '">打开</button>' +
          '<button class="book-delete-btn" data-id="' + book.id + '">删除</button>' +
        '</div>';

      bookList.appendChild(card);
    });

    bookList.querySelectorAll('.book-open-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBook(btn.dataset.id);
      });
    });

    bookList.querySelectorAll('.book-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBook(btn.dataset.id);
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function deleteBook(bookId) {
    const books = getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const confirmed = confirm('确定删除《' + book.name + '》吗？阅读记录将一并清除。');
    if (!confirmed) return;

    const updatedBooks = books.filter(b => b.id !== bookId);
    saveBooks(updatedBooks);
    await removeBookContent(bookId);
    removeBookProgress(bookId);
    renderBookshelf();
  }

  async function openBook(bookId) {
    const books = getBooks();
    const book = books.find(b => b.id === bookId);
    bookFormat = book && book.format === 'epub' ? 'epub' : 'txt';

    const content = await getBookContent(bookId);
    if (!content) {
      alert('书籍内容已丢失，请重新添加。');
      const updatedBooks = books.filter(b => b.id !== bookId);
      saveBooks(updatedBooks);
      removeBookProgress(bookId);
      renderBookshelf();
      return;
    }

    if (book) {
      document.title = book.name + ' — 电子书阅读器';
    }

    currentBookId = bookId;

    if (bookFormat === 'epub') {
      if (!(content instanceof ArrayBuffer)) {
        alert('书籍数据解析失败，文件可能已损坏。');
        bookFormat = 'txt';
        currentBookId = null;
        return;
      }
      try {
        epubBook = await parseEpub(content);
        chapters = epubBook.buildChapterList();
        renderChapterList();
      } catch (err) {
        alert('书籍数据解析失败，文件可能已损坏：' + err.message);
        epubBook = null;
        bookFormat = 'txt';
        currentBookId = null;
        return;
      }
    } else {
      parseChapters(content);
    }

    const progress = getProgress();
    const savedChapter = progress[bookId] || 0;

    bookshelfView.style.display = 'none';
    readerContainer.style.display = 'flex';

    chapterReady = false;
    readingProgress.style.display = chapters.length > 0 ? '' : 'none';
    resetReadingProgress();
    positionFixedButtons();

    if (chapters.length > 0) {
      scrollToChapterTop();
      showChapter(Math.min(savedChapter, chapters.length - 1));
    }
  }

  function showBookshelf() {
    if (epubBook) {
      epubBook.cleanup();
      epubBook = null;
    }
    bookFormat = 'txt';
    chapterRenderToken++;

    if (currentBookId !== null && currentChapterIndex !== undefined) {
      saveProgress(currentBookId, currentChapterIndex);
    }

    document.title = '电子书阅读器 — 生活工具箱';

    currentBookId = null;
    chapters = [];
    currentChapterIndex = 0;
    chapterReady = false;
    contentBody.innerHTML = '';
    contentTitle.textContent = '选择章节开始阅读';

    readerContainer.style.display = 'none';
    bookshelfView.style.display = 'block';
    sidebar.classList.add('hidden');
    settingsPanel.classList.add('hidden');
    resetReadingProgress();

    window.scrollTo({ top: 0, behavior: 'instant' });

    renderBookshelf();
  }

  addBookBtn.addEventListener('click', () => fileInput.click());

  function getFileFormat(file) {
    if (/\.txt$/i.test(file.name)) return 'txt';
    if (/\.epub$/i.test(file.name)) return 'epub';
    return null;
  }

  function readFileAs(file, type) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target.result);
      reader.onerror = () => reject(reader.error);
      if (type === 'arraybuffer') reader.readAsArrayBuffer(file);
      else reader.readAsText(file, 'UTF-8');
    });
  }

  async function importTxt(file, onDone) {
    const content = await readFileAs(file, 'text');
    const tempChapters = parseChaptersFromContent(content);
    const bookId = generateBookId(file.name, file.size, file.lastModified);

    const books = getBooks();
    const existing = books.find(b => b.id === bookId);

    if (!existing) {
      books.push({
        id: bookId,
        name: file.name.replace(/\.txt$/i, ''),
        chapterCount: tempChapters.length,
        addedAt: Date.now(),
        format: 'txt'
      });
      saveBooks(books);
      try {
        await saveBookContent(bookId, content);
      } catch {
        books.pop();
        saveBooks(books);
        alert('《' + file.name.replace(/\.txt$/i, '') + '》存储失败，空间不足。');
      }
    }
    onDone();
  }

  async function importEpub(file, onDone) {
    if (!supportsEpub()) {
      alert('当前浏览器不支持 EPUB 解压，请使用较新版本的 Chrome / Edge / Firefox / Safari。');
      onDone();
      return;
    }
    const buffer = await readFileAs(file, 'arraybuffer');
    let parsed;
    try {
      parsed = await parseEpub(buffer);
    } catch (err) {
      alert('《' + file.name + '》解析失败：' + err.message);
      onDone();
      return;
    }
    const chapterCount = parsed.buildChapterList().length;
    const bookId = generateBookId(file.name, file.size, file.lastModified);

    const books = getBooks();
    const existing = books.find(b => b.id === bookId);

    if (!existing) {
      books.push({
        id: bookId,
        name: parsed.title || file.name.replace(/\.epub$/i, ''),
        chapterCount,
        addedAt: Date.now(),
        format: 'epub'
      });
      saveBooks(books);
      try {
        await saveBookContent(bookId, buffer);
      } catch {
        books.pop();
        saveBooks(books);
        alert('《' + file.name + '》存储失败，空间不足。');
      }
    }
    parsed.cleanup();
    onDone();
  }

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let processed = 0;
    const total = files.length;

    const finish = () => {
      processed++;
      if (processed === total) {
        renderBookshelf();
        fileInput.value = '';
      }
    };

    files.forEach(file => {
      const format = getFileFormat(file);
      let task;
      if (format === 'txt') task = importTxt(file, finish);
      else if (format === 'epub') task = importEpub(file, finish);
      else { finish(); return; }
      task.catch(() => finish());
    });
  });

  function parseChaptersFromContent(content) {
    const lines = content.split('\n');
    const result = [];
    let currentChapter = null;
    const chapterPattern = /^第[0-9一二三四五六七八九十百千万]+章/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (chapterPattern.test(line)) {
        if (currentChapter !== null) {
          result.push(currentChapter);
        }
        currentChapter = { title: line, content: [] };
      } else if (currentChapter !== null) {
        if (line) {
          currentChapter.content.push(line);
        }
      }
    }
    if (currentChapter !== null) {
      result.push(currentChapter);
    }
    return result;
  }

  backToBookshelf.addEventListener('click', showBookshelf);

  toggleSidebar.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!sidebar.classList.contains('hidden')) {
      sidebar.classList.add('hidden');
      return;
    }
    positionSidebar();
    sidebar.classList.remove('hidden');
    requestAnimationFrame(() => {
      const activeItem = chapterList.querySelector('.chapter-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    });
  });

  closeSidebar.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.add('hidden');
  });

  openSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!settingsPanel.classList.contains('hidden')) {
      settingsPanel.classList.add('hidden');
      return;
    }
    positionSettingsPanel();
    settingsPanel.classList.remove('hidden');
  });

  closeSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.classList.add('hidden');
  });

  function updateFontSize(size) {
    currentFontSize = Math.max(12, Math.min(28, size));
    fontSizeValue.textContent = currentFontSize;
    contentBody.style.fontSize = currentFontSize + 'px';
    localStorage.setItem('readerFontSize', currentFontSize);
    scheduleProgressUpdate();
  }

  fontSizeDecrease.addEventListener('click', () => updateFontSize(currentFontSize - 1));
  fontSizeIncrease.addEventListener('click', () => updateFontSize(currentFontSize + 1));

  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target)) {
      sidebar.classList.add('hidden');
    }
    if (!settingsPanel.contains(e.target) && !openSettings.contains(e.target)) {
      settingsPanel.classList.add('hidden');
    }
  });

  prevChapter.addEventListener('click', () => {
    if (currentChapterIndex > 0) {
      showChapter(currentChapterIndex - 1);
    }
  });

  nextChapter.addEventListener('click', () => {
    if (currentChapterIndex < chapters.length - 1) {
      showChapter(currentChapterIndex + 1);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (readerContainer.style.display === 'none') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (currentChapterIndex > 0) {
        showChapter(currentChapterIndex - 1);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (currentChapterIndex < chapters.length - 1) {
        showChapter(currentChapterIndex + 1);
      }
    }
  });

  // EPUB 正文内链接：内部章节跳转 / 页内定位
  contentBody.addEventListener('click', (e) => {
    if (bookFormat !== 'epub') return;
    const a = e.target.closest('a[data-epub-chapter], a[data-epub-frag]');
    if (!a) return;
    e.preventDefault();
    const idxAttr = a.getAttribute('data-epub-chapter');
    const frag = a.getAttribute('data-epub-frag');
    const scrollToFragment = () => {
      if (!frag) return;
      let el = null;
      try { el = contentBody.querySelector('#' + CSS.escape(frag)); } catch { el = null; }
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (idxAttr !== null) {
      const idx = parseInt(idxAttr, 10);
      if (!isNaN(idx)) {
        showChapter(idx).then(scrollToFragment);
        return;
      }
    }
    scrollToFragment();
  });

  function parseChapters(content) {
    chapters = parseChaptersFromContent(content);
    renderChapterList();
  }

  function renderChapterList() {
    chapterList.innerHTML = '';
    chapters.forEach((chapter, index) => {
      const item = document.createElement('div');
      item.className = 'chapter-item';
      item.textContent = chapter.title;
      item.dataset.index = index;
      item.addEventListener('click', () => {
        showChapter(index);
        sidebar.classList.add('hidden');
      });
      chapterList.appendChild(item);
    });
  }

  function positionFixedButtons() {
    const panelRect = contentPanel.getBoundingClientRect();
    fixedButtons.style.left = (panelRect.right + 8) + 'px';
  }

  function positionSidebar() {
    const panelRect = contentPanel.getBoundingClientRect();
    sidebar.style.right = (window.innerWidth - panelRect.right) + 'px';
  }

  function positionSettingsPanel() {
    const panelRect = contentPanel.getBoundingClientRect();
    settingsPanel.style.right = (window.innerWidth - panelRect.right) + 'px';
  }

  function isReaderOpen() {
    return readerContainer.style.display !== 'none';
  }

  // 章节内进度：正文顶部对齐视口顶部记为 0%，正文底部对齐视口底部记为 100%
  function computeChapterProgress() {
    if (!isReaderOpen() || !chapterReady || currentBookId === null) return 0;

    const rect = contentBody.getBoundingClientRect();
    const bodyHeight = rect.height;
    if (bodyHeight < 1) return 0;

    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const bodyTop = rect.top + scrollTop;
    const start = bodyTop - CHAPTER_TOP_OFFSET;
    const end = bodyTop + bodyHeight - viewportHeight;

    // 不足一屏的短章：从章节起点滚动到正文完整可见时记为 100%；
    // 若章节起点处正文已完整可见，则直接是 100%
    if (end - start <= 4) {
      const panelTop = contentPanel.getBoundingClientRect().top + scrollTop;
      const chapterStart = panelTop - CHAPTER_TOP_OFFSET;
      const span = end - chapterStart;
      if (span <= 1) return 1;
      return Math.min(1, Math.max(0, (scrollTop - chapterStart) / span));
    }

    return Math.min(1, Math.max(0, (scrollTop - start) / (end - start)));
  }

  function updateReadingProgress() {
    if (!isReaderOpen()) return;

    const percent = Math.round(computeChapterProgress() * 100);
    if (percent !== lastProgressPercent) {
      lastProgressPercent = percent;
      readingProgressPercent.textContent = String(percent);
      readingProgress.setAttribute('aria-valuenow', String(percent));
    }
  }

  function resetReadingProgress() {
    lastProgressPercent = -1;
    readingProgressPercent.textContent = '0';
    readingProgress.setAttribute('aria-valuenow', '0');
  }

  function scheduleProgressUpdate() {
    if (progressFrameId) return;
    progressFrameId = requestAnimationFrame(() => {
      progressFrameId = 0;
      updateReadingProgress();
    });
  }

  function scrollToChapterTop() {
    if (!isReaderOpen() || !contentPanel) return;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const target = Math.max(0, contentPanel.getBoundingClientRect().top + scrollTop - CHAPTER_TOP_OFFSET);
    try {
      window.scrollTo({ top: target, behavior: 'instant' });
    } catch {
      window.scrollTo(0, target);
    }
  }

  window.addEventListener('resize', () => {
    if (readerContainer.style.display !== 'none') {
      positionFixedButtons();
      scheduleProgressUpdate();
      if (!sidebar.classList.contains('hidden')) {
        positionSidebar();
      }
      if (!settingsPanel.classList.contains('hidden')) {
        positionSettingsPanel();
      }
    }
  });

  window.addEventListener('scroll', () => {
    if (isReaderOpen()) scheduleProgressUpdate();
  }, { passive: true });

  // 图片、字体等异步内容会改变正文高度，重新测量一次
  contentBody.addEventListener('load', scheduleProgressUpdate, true);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => scheduleProgressUpdate());
  }

  async function showChapter(index) {
    if (index < 0 || index >= chapters.length) return;

    const token = ++chapterRenderToken;
    currentChapterIndex = index;
    chapterReady = false;
    resetReadingProgress();
    const chapter = chapters[index];
    contentTitle.textContent = chapter.title;

    if (bookFormat === 'epub' && epubBook) {
      contentBody.innerHTML = '<p>加载中…</p>';
      let out = null;
      try {
        out = await epubBook.getChapter(chapter.href);
      } catch {
        out = null;
      }
      if (token !== chapterRenderToken) return; // 过期渲染丢弃
      if (out) {
        contentBody.innerHTML = '';
        // 章节根节点是 <body> 元素，展开子节点后插入，
        // 避免页面全局 body 样式（背景色等）作用到 EPUB 正文区域
        contentBody.append(...out.element.childNodes);
        chapterReady = true;
        if (out.title && chapter.autoTitle) {
          chapter.title = out.title;
          chapter.autoTitle = false;
          contentTitle.textContent = out.title;
          const item = chapterList.children[index];
          if (item) item.textContent = out.title;
        }
      } else {
        contentBody.innerHTML = '<p>本章内容加载失败。</p>';
      }
    } else {
      contentBody.innerHTML = '';
      chapter.content.forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        contentBody.appendChild(p);
      });
      chapterReady = true;
    }

    contentBody.style.fontSize = currentFontSize + 'px';

    const items = chapterList.querySelectorAll('.chapter-item');
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    prevChapter.disabled = index <= 0;
    nextChapter.disabled = index >= chapters.length - 1;
    chapterInfo.textContent = (index + 1) + ' / ' + chapters.length;

    if (currentBookId !== null) {
      saveProgress(currentBookId, index);
    }

    // 换章后回到正文顶部，让章节进度从 0% 重新开始
    scrollToChapterTop();
    scheduleProgressUpdate();
  }

  renderBookshelf();
});
