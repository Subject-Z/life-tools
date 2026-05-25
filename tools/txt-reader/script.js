document.addEventListener('DOMContentLoaded', function() {
  const uploadArea = document.getElementById('uploadArea');
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

  let chapters = [];
  let currentChapterIndex = 0;
  let currentFontSize = 16;

  // 加载保存的设置
  const savedFontSize = localStorage.getItem('readerFontSize');
  if (savedFontSize) {
    currentFontSize = parseInt(savedFontSize);
    fontSizeValue.textContent = currentFontSize;
    contentBody.style.fontSize = currentFontSize + 'px';
  }

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--accent)';
    uploadArea.style.background = 'var(--accent-dim)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'transparent';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'transparent';
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.txt')) {
      loadFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      loadFile(e.target.files[0]);
    }
  });

  toggleSidebar.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!sidebar.classList.contains('hidden')) {
      sidebar.classList.add('hidden');
      return;
    }
    positionSidebar();
    sidebar.classList.remove('hidden');
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

  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      parseChapters(content);
      uploadArea.style.display = 'none';
      readerContainer.style.display = 'flex';
      positionFixedButtons();
    };
    reader.readAsText(file, 'UTF-8');
  }

  function parseChapters(content) {
    const lines = content.split('\n');
    chapters = [];
    let currentChapter = null;

    const chapterPattern = /^第[0-9一二三四五六七八九十百千万]+章/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (chapterPattern.test(line)) {
        if (currentChapter !== null) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          title: line,
          content: []
        };
      } else if (currentChapter !== null) {
        if (line) {
          currentChapter.content.push(line);
        }
      }
    }

    if (currentChapter !== null) {
      chapters.push(currentChapter);
    }

    renderChapterList();
    
    if (chapters.length > 0) {
      showChapter(0);
    }
  }

  function renderChapterList() {
    chapterList.innerHTML = '';
    
    chapters.forEach((chapter, index) => {
      const item = document.createElement('div');
      item.className = 'chapter-item';
      item.textContent = chapter.title;
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
    positionFixedButtons();
    if (!sidebar.classList.contains('hidden')) {
      positionSidebar();
    }
    if (!settingsPanel.classList.contains('hidden')) {
      positionSettingsPanel();
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

    // 应用当前字体大小
    contentBody.style.fontSize = currentFontSize + 'px';

    const items = chapterList.querySelectorAll('.chapter-item');
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    // 更新章节控制按钮状态
    prevChapter.disabled = index <= 0;
    nextChapter.disabled = index >= chapters.length - 1;

    // 更新章节信息
    chapterInfo.textContent = `${index + 1} / ${chapters.length}`;
  }
});
