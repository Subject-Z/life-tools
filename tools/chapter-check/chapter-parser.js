export const parseChaptersFromText = (text) => {
  const lines = text.split(/\r?\n/);
  const chapters = [];
  const chapterPrefixRegex = /第(\d+)章/;
  const bracketSuffixRegex = /[（(](\d+)[）)]\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    const prefixMatch = line.match(chapterPrefixRegex);
    if (prefixMatch) {
      const chapterNum = parseInt(prefixMatch[1], 10);
      if (!isNaN(chapterNum)) {
        chapters.push({
          num: chapterNum,
          raw: line,
          orderIndex: chapters.length,
          lineNumber: i + 1,
          format: 'chapter-prefix'
        });
        continue;
      }
    }

    const bracketMatch = line.match(bracketSuffixRegex);
    if (bracketMatch) {
      const chapterNum = parseInt(bracketMatch[1], 10);
      if (!isNaN(chapterNum)) {
        chapters.push({
          num: chapterNum,
          raw: line,
          orderIndex: chapters.length,
          lineNumber: i + 1,
          format: 'bracket-suffix'
        });
        continue;
      }
    }

    const globalBracketRegex = /[（(](\d+)[）)]/g;
    let globalMatch;
    let lastBracketNum = null;
    while ((globalMatch = globalBracketRegex.exec(line)) !== null) {
      lastBracketNum = parseInt(globalMatch[1], 10);
    }
    if (lastBracketNum !== null && !isNaN(lastBracketNum)) {
      chapters.push({
        num: lastBracketNum,
        raw: line,
        orderIndex: chapters.length,
        lineNumber: i + 1,
        format: 'bracket-suffix'
      });
    }
  }
  return chapters;
};

export const analyzeChapters = (chapters) => {
  if (!chapters.length) {
    return {
      missing: [],
      orderErrors: [],
      duplicates: [],
      totalUnique: 0,
      minNum: null,
      maxNum: null,
      uniqueSorted: [],
      allNums: [],
      prefixMissing: [],
      totalChapters: 0
    };
  }

  const seqNums = chapters.map(ch => ch.num);
  const uniqueNumsSet = new Set(seqNums);
  const uniqueSorted = Array.from(uniqueNumsSet).sort((a, b) => a - b);
  const minNum = uniqueSorted[0];
  const maxNum = uniqueSorted[uniqueSorted.length - 1];

  const missing = [];
  for (let i = minNum; i <= maxNum; i++) {
    if (!uniqueNumsSet.has(i)) missing.push(i);
  }

  const prefixMissing = [];
  if (minNum > 1) {
    for (let i = 1; i < minNum; i++) {
      prefixMissing.push(i);
    }
  }

  const countMap = new Map();
  chapters.forEach(ch => {
    countMap.set(ch.num, (countMap.get(ch.num) || 0) + 1);
  });
  const duplicateEntries = [];
  countMap.forEach((cnt, num) => {
    if (cnt > 1) {
      duplicateEntries.push({ num, count: cnt });
    }
  });

  const orderErrors = [];
  for (let i = 1; i < chapters.length; i++) {
    const prev = chapters[i - 1];
    const curr = chapters[i];
    if (curr.num < prev.num) {
      orderErrors.push({
        prevChapter: prev,
        currChapter: curr,
        prevIndex: i - 1,
        currIndex: i
      });
    }
  }

  return {
    missing,
    orderErrors,
    duplicates: duplicateEntries,
    totalUnique: uniqueNumsSet.size,
    minNum,
    maxNum,
    uniqueSorted,
    allNums: seqNums,
    prefixMissing,
    totalChapters: chapters.length
  };
};
