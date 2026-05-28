export const toolsConfig = {
  tools: [
    {
      id: 'chapter-check',
      name: '章节序号检测',
      description: '检测章节编号的连续性，自动识别缺失、排序错误与重复章节，支持「第X章」和行末「（序号）」两种格式。',
      path: 'tools/chapter-check/index.html',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
      category: '文本处理'
    },
    {
      id: 'punctuation-convert',
      name: '中英标点转换',
      description: '快速将文本中的标点符号在中文和英文格式之间转换，支持全角半角标点互换，包含常用标点的双向转换。',
      path: 'tools/punctuation-convert/index.html',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><path d="M9 9h2"/><circle cx="13" cy="9" r="1"/></svg>',
      category: '文本处理'
    },
    {
      id: 'currency-convert',
      name: '汇率转换',
      description: '实时获取全球主要货币汇率，支持100+种货币转换，数据来源于Frankfurter API，提供准确的国际汇率。',
      path: 'tools/currency-convert/index.html',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      category: '金融工具'
    },
    {
      id: 'txt-reader',
      name: 'TXT电子书阅读器',
      description: '加载本地TXT文件，自动识别章节，左侧目录导航，右侧阅读正文，支持章节快速切换。',
      path: 'tools/txt-reader/index.html',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
      category: '文本处理'
    }
  ]
};
