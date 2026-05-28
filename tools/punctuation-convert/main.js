import { punctuationToChinese, punctuationToEnglish, createConvertWorker } from './punctuation-convert.js';

const THRESHOLD = 1000000;
const PREVIEW_LIMIT = 500000;

let currentWorker = null;
let workerUrl = null;
let isConverting = false;

const $ = (id) => document.getElementById(id);

function formatSize(chars) {
  if (chars >= 100000000) return (chars / 100000000).toFixed(2) + ' 亿';
  if (chars >= 10000) return (chars / 10000).toFixed(1) + ' 万';
  return chars.toLocaleString();
}

function setConverting(state) {
  isConverting = state;
  const btns = ['btnToChinese', 'btnToEnglish'];
  btns.forEach(id => {
    const btn = $(id);
    if (btn) {
      btn.disabled = state;
      btn.style.opacity = state ? '0.6' : '1';
    }
  });
  const cancel = $('btnCancel');
  if (cancel) cancel.style.display = state ? 'inline-flex' : 'none';
}

function terminateWorker() {
  if (currentWorker) {
    currentWorker.terminate();
    currentWorker = null;
  }
  if (workerUrl) {
    URL.revokeObjectURL(workerUrl);
    workerUrl = null;
  }
}

function renderOutput(result) {
  const output = $('txtOutput');
  const preview = $('previewNotice');
  if (result.length > PREVIEW_LIMIT) {
    output.value = result.substring(0, PREVIEW_LIMIT);
    if (preview) {
      preview.style.display = 'block';
      preview.textContent = '已显示前 ' + formatSize(PREVIEW_LIMIT) + ' 字符，完整结果请点击「下载文件」';
    }
  } else {
    output.value = result;
    if (preview) preview.style.display = 'none';
  }
  output.dataset.fullResult = result;
}

function convertWithWorker(input, direction) {
  terminateWorker();
  const { worker, url } = createConvertWorker();
  currentWorker = worker;
  workerUrl = url;

  setConverting(true);

  worker.onmessage = (e) => {
    const { type, result } = e.data;
    if (type === 'done') {
      renderOutput(result);
      setConverting(false);
      terminateWorker();
    }
  };

  worker.onerror = (err) => {
    console.error('Worker error:', err);
    setConverting(false);
    terminateWorker();
    alert('转换出错，请重试');
  };

  worker.postMessage({ text: input, direction });
}

function convertSync(input, direction) {
  const fn = direction === 'toChinese' ? punctuationToChinese : punctuationToEnglish;
  const result = fn(input);
  renderOutput(result);
}

const handleToChinese = () => {
  if (isConverting) return;
  const input = $('txtInput').value;
  if (!input.trim()) {
    alert('源字符串不能为空');
    return;
  }
  if (input.length > THRESHOLD) {
    convertWithWorker(input, 'toChinese');
  } else {
    convertSync(input, 'toChinese');
  }
};

const handleToEnglish = () => {
  if (isConverting) return;
  const input = $('txtInput').value;
  if (!input.trim()) {
    alert('源字符串不能为空');
    return;
  }
  if (input.length > THRESHOLD) {
    convertWithWorker(input, 'toEnglish');
  } else {
    convertSync(input, 'toEnglish');
  }
};

const handleCancel = () => {
  terminateWorker();
  setConverting(false);
};

const clearAll = () => {
  terminateWorker();
  setConverting(false);
  $('txtInput').value = '';
  $('txtOutput').value = '';
  delete $('txtOutput').dataset.fullResult;
  const preview = $('previewNotice');
  if (preview) preview.style.display = 'none';
};

const copyResult = async () => {
  let output = $('txtOutput').dataset.fullResult || $('txtOutput').value;
  if (!output) return;
  try {
    await navigator.clipboard.writeText(output);
    showToast('已复制到剪贴板');
  } catch {
    const textarea = $('txtOutput');
    textarea.select();
    document.execCommand('copy');
    showToast('已复制到剪贴板');
  }
};

const downloadFile = () => {
  const content = $('txtOutput').dataset.fullResult || $('txtOutput').value;
  if (!content) {
    alert('没有内容可下载');
    return;
  }
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'punctuation-convert.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

function showToast(msg) {
  let toast = $('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:0.6rem 1.4rem;border-radius:6px;font-size:0.9rem;z-index:9999;opacity:0;transition:opacity 0.3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
  $('btnToChinese').addEventListener('click', handleToChinese);
  $('btnToEnglish').addEventListener('click', handleToEnglish);
  $('btnClear').addEventListener('click', clearAll);
  $('btnCopy').addEventListener('click', copyResult);
  $('btnDownload').addEventListener('click', downloadFile);

  const cancel = $('btnCancel');
  if (cancel) cancel.addEventListener('click', handleCancel);
});
