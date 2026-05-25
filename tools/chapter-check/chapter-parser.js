(function() {

  function parseChaptersFromText(text) {
    var lines = text.split(/\r?\n/);
    var chapters = [];
    var chapterPrefixRegex = /第(\d+)章/;
    var bracketSuffixRegex = /[（(](\d+)[）)]\s*$/;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line === '') continue;

      var prefixMatch = line.match(chapterPrefixRegex);
      if (prefixMatch) {
        var chapterNum = parseInt(prefixMatch[1], 10);
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

      var bracketMatch = line.match(bracketSuffixRegex);
      if (bracketMatch) {
        var chapterNum = parseInt(bracketMatch[1], 10);
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

      var globalBracketRegex = /[（(](\d+)[）)]/g;
      var globalMatch;
      var lastBracketNum = null;
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
  }

  function analyzeChapters(chapters) {
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

    var seqNums = chapters.map(function(ch) { return ch.num; });
    var uniqueNumsSet = new Set(seqNums);
    var uniqueSorted = Array.from(uniqueNumsSet).sort(function(a, b) { return a - b; });
    var minNum = uniqueSorted[0];
    var maxNum = uniqueSorted[uniqueSorted.length - 1];

    var missing = [];
    for (var i = minNum; i <= maxNum; i++) {
      if (!uniqueNumsSet.has(i)) missing.push(i);
    }

    var prefixMissing = [];
    if (minNum > 1) {
      for (var i = 1; i < minNum; i++) {
        prefixMissing.push(i);
      }
    }

    var countMap = new Map();
    chapters.forEach(function(ch) {
      countMap.set(ch.num, (countMap.get(ch.num) || 0) + 1);
    });
    var duplicateEntries = [];
    countMap.forEach(function(cnt, num) {
      if (cnt > 1) {
        duplicateEntries.push({
          num: num,
          count: cnt
        });
      }
    });

    var orderErrors = [];
    for (var i = 1; i < chapters.length; i++) {
      var prev = chapters[i - 1];
      var curr = chapters[i];
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
      missing: missing,
      orderErrors: orderErrors,
      duplicates: duplicateEntries,
      totalUnique: uniqueNumsSet.size,
      minNum: minNum,
      maxNum: maxNum,
      uniqueSorted: uniqueSorted,
      allNums: seqNums,
      prefixMissing: prefixMissing,
      totalChapters: chapters.length
    };
  }

  window.ChapterParser = {
    parseChaptersFromText: parseChaptersFromText,
    analyzeChapters: analyzeChapters
  };

})();
