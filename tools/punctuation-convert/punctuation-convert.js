const EN_TO_CN = new Map([
  [',', '，'],
  ['.', '。'],
  ["'", '\u2019'],
  ['"', '\u201D'],
  [';', '；'],
  [':', '：'],
  ['?', '？'],
  ['!', '！'],
  ['(', '（'],
  [')', '）'],
  ['[', '【'],
  ['{', '【'],
  [']', '】'],
  ['}', '】'],
  ['<', '＜'],
  ['>', '＞'],
]);

const CN_TO_EN = new Map([
  ['，', ','],
  ['。', '.'],
  ['\u2018', "'"],
  ['\u2019', "'"],
  ['\u201C', '"'],
  ['\u201D', '"'],
  ['；', ';'],
  ['：', ':'],
  ['？', '?'],
  ['！', '!'],
  ['（', '('],
  ['）', ')'],
  ['【', '['],
  ['】', ']'],
  ['＜', '<'],
  ['＞', '>'],
]);

export const punctuationToChinese = (text) => {
  if (!text) return '';
  let result = '';
  let openDouble = false;
  let openSingle = false;
  for (const ch of text) {
    if (ch === '"') {
      result += openDouble ? '\u201D' : '\u201C';
      openDouble = !openDouble;
    } else if (ch === "'") {
      result += openSingle ? '\u2019' : '\u2018';
      openSingle = !openSingle;
    } else {
      result += EN_TO_CN.has(ch) ? EN_TO_CN.get(ch) : ch;
    }
  }
  return result;
};

export const punctuationToEnglish = (text) => {
  if (!text) return '';
  return convert(text, CN_TO_EN);
};

function convert(text, map) {
  const len = text.length;
  const CHUNK = 500000;
  const parts = [];
  for (let i = 0; i < len; i += CHUNK) {
    const end = Math.min(i + CHUNK, len);
    const chunk = text.substring(i, end);
    let result = '';
    for (let j = 0; j < chunk.length; j++) {
      const ch = chunk[j];
      result += map.has(ch) ? map.get(ch) : ch;
    }
    parts.push(result);
  }
  return parts.join('');
}

function convertToChinese(text) {
  let result = '';
  let openDouble = false;
  let openSingle = false;
  for (const ch of text) {
    if (ch === '"') {
      result += openDouble ? '\u201D' : '\u201C';
      openDouble = !openDouble;
    } else if (ch === "'") {
      result += openSingle ? '\u2019' : '\u2018';
      openSingle = !openSingle;
    } else {
      result += EN_TO_CN.has(ch) ? EN_TO_CN.get(ch) : ch;
    }
  }
  return result;
}

export function createWorkerCode() {
  return `
const EN_TO_CN = new Map([
  [',', '\\uFF0C'],
  ['.', '\\u3002'],
  [';', '\\uFF1B'],
  [':', '\\uFF1A'],
  ['?', '\\uFF1F'],
  ['!', '\\uFF01'],
  ['(', '\\uFF08'],
  [')', '\\uFF09'],
  ['[', '\\u3010'],
  ['{', '\\u3010'],
  [']', '\\u3011'],
  ['}', '\\u3011'],
  ['<', '\\uFF1C'],
  ['>', '\\uFF1E'],
]);

const CN_TO_EN = new Map([
  ['\\uFF0C', ','],
  ['\\u3002', '.'],
  ['\\u2018', "'"],
  ['\\u2019', "'"],
  ['\\u201C', '"'],
  ['\\u201D', '"'],
  ['\\uFF1B', ';'],
  ['\\uFF1A', ':'],
  ['\\uFF1F', '?'],
  ['\\uFF01', '!'],
  ['\\uFF08', '('],
  ['\\uFF09', ')'],
  ['\\u3010', '['],
  ['\\u3011', ']'],
  ['\\uFF1C', '<'],
  ['\\uFF1E', '>'],
]);

function convertToChinese(text) {
  let result = '';
  let openDouble = false;
  let openSingle = false;
  for (const ch of text) {
    if (ch === '"') {
      result += openDouble ? '\\u201D' : '\\u201C';
      openDouble = !openDouble;
    } else if (ch === "'") {
      result += openSingle ? '\\u2019' : '\\u2018';
      openSingle = !openSingle;
    } else {
      result += EN_TO_CN.has(ch) ? EN_TO_CN.get(ch) : ch;
    }
  }
  return result;
}

function convertToEnglish(text) {
  const result = [];
  for (const ch of text) {
    result.push(CN_TO_EN.has(ch) ? CN_TO_EN.get(ch) : ch);
  }
  return result.join('');
}

self.onmessage = function(e) {
  const { text, direction } = e.data;
  const result = direction === 'toChinese' ? convertToChinese(text) : convertToEnglish(text);
  self.postMessage({ type: 'done', result });
};
`;
}

export function createConvertWorker() {
  const blob = new Blob([createWorkerCode()], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  return { worker, url };
}
