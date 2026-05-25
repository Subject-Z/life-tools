(function() {
  var textarea = document.getElementById('chapterInput');
  var detectBtn = document.getElementById('detectBtn');
  var clearBtn = document.getElementById('clearBtn');
  var resultArea = document.getElementById('resultArea');

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderReport(chapters, analysis) {
    if (!chapters.length) {
      resultArea.innerHTML =
        '<div class="success-msg" style="background: rgba(248,113,113,0.1); color:#f87171; border-color: rgba(248,113,113,0.2);">' +
          '<strong>未检测到任何章节</strong><br>' +
          '<span style="font-size:0.8rem;">请确保章节标题包含「第X章」或行末「（序号）」标记</span>' +
        '</div>';
      return;
    }

    var missing = analysis.missing;
    var orderErrors = analysis.orderErrors;
    var duplicates = analysis.duplicates;
    var totalUnique = analysis.totalUnique;
    var minNum = analysis.minNum;
    var maxNum = analysis.maxNum;
    var totalChapters = analysis.totalChapters;
    var prefixMissing = analysis.prefixMissing;

    var allMissing = prefixMissing.concat(missing);
    var hasAnyIssue = (allMissing.length > 0) || (orderErrors.length > 0) || (duplicates.length > 0);

    var html = '';

    html += '<div class="stat-bar">' +
              '<span>&#128203; 有效章节 <strong>' + totalChapters + '</strong> 条</span>' +
              '<span class="stat-divider">|</span>' +
              '<span>&#128290; 唯一序号 <strong>' + totalUnique + '</strong> 个</span>' +
              '<span class="stat-divider">|</span>' +
              '<span>&#128218; 范围 <strong>#' + minNum + ' ~ #' + maxNum + '</strong></span>' +
            '</div>';

    if (!hasAnyIssue && totalChapters > 0) {
      html += '<div class="success-msg">' +
                '&#9989; 章节序号连续，无排序错误，无重复 — 完全正确！' +
              '</div>';
    } else {
      html += '<div style="font-weight:600; margin-bottom:0.6rem; font-size:0.85rem;">&#128276; 检测到以下问题：</div><ul class="issue-list">';

      if (allMissing.length > 0) {
        var missingStr = allMissing.join('、');
        var prefixLabel = prefixMissing.length > 0 ?
          '（含起始前缺失第1~' + (minNum - 1) + '章）' : '';
        html += '<li class="issue-missing">' +
                  '<strong>&#128301; 缺失章节</strong>：第 ' + missingStr + ' 章，共 <strong>' + allMissing.length + '</strong> 个 ' + prefixLabel +
                '</li>';
      }

      if (orderErrors.length > 0) {
        for (var j = 0; j < orderErrors.length; j++) {
          var err = orderErrors[j];
          html += '<li class="issue-order">' +
                    '<strong>&#128259; 排序异常</strong>：第' + err.prevChapter.num + '章 排在第' + err.currChapter.num + '章 之前，序号逆序' +
                  '</li>';
        }
      }

      if (duplicates.length > 0) {
        for (var k = 0; k < duplicates.length; k++) {
          var dup = duplicates[k];
          html += '<li class="issue-duplicate">' +
                    '<strong>&#128259; 重复章节</strong>：第' + dup.num + '章 出现 <strong>' + dup.count + '</strong> 次' +
                  '</li>';
        }
      }

      html += '</ul>';
    }

    resultArea.innerHTML = html;
  }

  function runDetection() {
    var rawText = textarea.value;
    if (!rawText.trim()) {
      resultArea.innerHTML =
        '<div class="success-msg" style="background: rgba(251,191,36,0.1); color:#fbbf24; border-color: rgba(251,191,36,0.2);">' +
          '&#128301; 输入区域为空，请粘贴章节内容后点击检测。' +
        '</div>';
      return;
    }
    var chapters = ChapterParser.parseChaptersFromText(rawText);
    if (chapters.length === 0) {
      resultArea.innerHTML =
        '<div class="success-msg" style="background: rgba(248,113,113,0.1); color:#f87171; border-color: rgba(248,113,113,0.2);">' +
          '&#10060; 未能提取任何有效章节<br>' +
          '<span style="font-size:0.8rem;">请确保章节标题包含「第X章」或行末「（序号）」标记</span>' +
        '</div>';
      return;
    }
    var analysis = ChapterParser.analyzeChapters(chapters);
    renderReport(chapters, analysis);
  }

  function clearAll() {
    textarea.value = '';
    resultArea.innerHTML =
      '<div class="success-msg">' +
        '&#10024; 已清空，等待输入新的章节列表。' +
      '</div>';
  }

  detectBtn.addEventListener('click', runDetection);
  clearBtn.addEventListener('click', clearAll);
})();
