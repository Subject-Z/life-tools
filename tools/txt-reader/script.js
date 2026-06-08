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

  let chapters = [];
  let currentChapterIndex = 0;
  let currentFontSize = 16;
  let currentBookId = null;

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

      card.innerHTML =
        '<div class="book-card-icon">📖</div>' +
        '<div class="book-card-info">' +
          '<div class="book-card-name" title="' + escapeHtml(book.name) + '">' + escapeHtml(book.name) + '</div>' +
          '<div class="book-card-meta">' +
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
    const content = await getBookContent(bookId);
    if (!content) {
      alert('书籍内容已丢失，请重新添加。');
      const books = getBooks().filter(b => b.id !== bookId);
      saveBooks(books);
      removeBookProgress(bookId);
      renderBookshelf();
      return;
    }

    currentBookId = bookId;

    const books = getBooks();
    const book = books.find(b => b.id === bookId);
    if (book) {
      document.title = book.name + ' — TXT电子书阅读器';
    }

    parseChapters(content);

    const progress = getProgress();
    const savedChapter = progress[bookId] || 0;

    if (chapters.length > 0) {
      showChapter(Math.min(savedChapter, chapters.length - 1));
    }

    bookshelfView.style.display = 'none';
    readerContainer.style.display = 'flex';
    positionFixedButtons();
  }

  function showBookshelf() {
    if (currentBookId !== null && currentChapterIndex !== undefined) {
      saveProgress(currentBookId, currentChapterIndex);
    }

    document.title = 'TXT电子书阅读器 — 生活工具箱';

    currentBookId = null;
    chapters = [];
    currentChapterIndex = 0;
    contentBody.innerHTML = '';
    contentTitle.textContent = '选择章节开始阅读';

    readerContainer.style.display = 'none';
    bookshelfView.style.display = 'block';
    sidebar.classList.add('hidden');
    settingsPanel.classList.add('hidden');

    renderBookshelf();
  }

  addBookBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let processed = 0;
    const total = files.length;

    files.forEach(file => {
      if (!file.name.endsWith('.txt')) {
        processed++;
        if (processed === total) {
          renderBookshelf();
          fileInput.value = '';
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = async function(ev) {
        const content = ev.target.result;
        const tempChapters = parseChaptersFromContent(content);
        const bookId = generateBookId(file.name, file.size, file.lastModified);

        const books = getBooks();
        const existing = books.find(b => b.id === bookId);

        if (!existing) {
          books.push({
            id: bookId,
            name: file.name.replace('.txt', ''),
            chapterCount: tempChapters.length,
            addedAt: Date.now()
          });
          saveBooks(books);
          try {
            await saveBookContent(bookId, content);
          } catch {
            books.pop();
            saveBooks(books);
            alert('《' + file.name.replace('.txt', '') + '》存储失败，空间不足。');
            processed++;
            if (processed === total) {
              renderBookshelf();
              fileInput.value = '';
            }
            return;
          }
        }

        processed++;
        if (processed === total) {
          renderBookshelf();
          fileInput.value = '';
        }
      };
      reader.readAsText(file, 'UTF-8');
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

  window.addEventListener('resize', () => {
    if (readerContainer.style.display !== 'none') {
      positionFixedButtons();
      if (!sidebar.classList.contains('hidden')) {
        positionSidebar();
      }
      if (!settingsPanel.classList.contains('hidden')) {
        positionSettingsPanel();
      }
    }
  });

  function showChapter(index) {
    if (index < 0 || index >= chapters.length) return;

    currentChapterIndex = index;
    const chapter = chapters[index];
    contentTitle.textContent = chapter.title;

    contentBody.innerHTML = '';
    chapter.content.forEach(line => {
      const p = document.createElement('p');
      p.textContent = line;
      contentBody.appendChild(p);
    });

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
  }

  renderBookshelf();
});
