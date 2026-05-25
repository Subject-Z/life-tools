var config_currency_convert = {
  fromCurrency: 'KRW',
  toCurrency: 'CNY',
  fromAmount: '',
  toAmount: ''
};

var currencies = {};

var currencyNamesZh = {
  'AED': '阿联酋迪拉姆',
  'AFN': '阿富汗阿富汗尼',
  'ALL': '阿尔巴尼亚列克',
  'AMD': '亚美尼亚德拉姆',
  'ANG': '荷属安的列斯盾',
  'AOA': '安哥拉宽扎',
  'ARS': '阿根廷比索',
  'AUD': '澳大利亚元',
  'AWG': '阿鲁巴弗罗林',
  'AZN': '阿塞拜疆马纳特',
  'BAM': '波斯尼亚马克',
  'BBD': '巴巴多斯元',
  'BDT': '孟加拉塔卡',
  'BGN': '保加利亚列弗',
  'BHD': '巴林第纳尔',
  'BIF': '布隆迪法郎',
  'BMD': '百慕大元',
  'BND': '文莱元',
  'BOB': '玻利维亚诺',
  'BRL': '巴西雷亚尔',
  'BSD': '巴哈马元',
  'BTN': '不丹努扎姆',
  'BWP': '博茨瓦纳普拉',
  'BYN': '白俄罗斯卢布',
  'BZD': '伯利兹元',
  'CAD': '加拿大元',
  'CDF': '刚果法郎',
  'CHF': '瑞士法郎',
  'CLP': '智利比索',
  'CNY': '人民币',
  'COP': '哥伦比亚比索',
  'CRC': '哥斯达黎加科朗',
  'CUP': '古巴比索',
  'CVE': '佛得角埃斯库多',
  'CZK': '捷克克朗',
  'DJF': '吉布提法郎',
  'DKK': '丹麦克朗',
  'DOP': '多米尼加比索',
  'DZD': '阿尔及利亚第纳尔',
  'EGP': '埃及镑',
  'ERN': '厄立特里亚纳克法',
  'ETB': '埃塞俄比亚比尔',
  'EUR': '欧元',
  'FJD': '斐济元',
  'FKP': '福克兰群岛镑',
  'GBP': '英镑',
  'GEL': '格鲁吉亚拉里',
  'GGP': '根西岛镑',
  'GHS': '加纳塞地',
  'GIP': '直布罗陀镑',
  'GMD': '冈比亚达拉西',
  'GNF': '几内亚法郎',
  'GTQ': '危地马拉格查尔',
  'GYD': '圭亚那元',
  'HKD': '港币',
  'HNL': '洪都拉斯伦皮拉',
  'HRK': '克罗地亚库纳',
  'HTG': '海地古德',
  'HUF': '匈牙利福林',
  'IDR': '印尼卢比',
  'ILS': '以色列新谢克尔',
  'IMP': '马恩岛镑',
  'INR': '印度卢比',
  'IQD': '伊拉克第纳尔',
  'IRR': '伊朗里亚尔',
  'ISK': '冰岛克朗',
  'JEP': '泽西岛镑',
  'JMD': '牙买加元',
  'JOD': '约旦第纳尔',
  'JPY': '日元',
  'KES': '肯尼亚先令',
  'KGS': '吉尔吉斯斯坦索姆',
  'KHR': '柬埔寨瑞尔',
  'KMF': '科摩罗法郎',
  'KPW': '朝鲜圆',
  'KRW': '韩元',
  'KWD': '科威特第纳尔',
  'KYD': '开曼群岛元',
  'KZT': '哈萨克斯坦坚戈',
  'LAK': '老挝基普',
  'LBP': '黎巴嫩镑',
  'LKR': '斯里兰卡卢比',
  'LRD': '利比里亚元',
  'LSL': '莱索托洛蒂',
  'LYD': '利比亚第纳尔',
  'MAD': '摩洛哥迪拉姆',
  'MDL': '摩尔多瓦列伊',
  'MGA': '马达加斯加阿里亚里',
  'MKD': '北马其顿代纳尔',
  'MMK': '缅甸缅元',
  'MNT': '蒙古图格里克',
  'MOP': '澳门元',
  'MRU': '毛里塔尼亚乌吉亚',
  'MUR': '毛里求斯卢比',
  'MVR': '马尔代夫拉菲亚',
  'MWK': '马拉维克瓦查',
  'MXN': '墨西哥比索',
  'MYR': '马来西亚林吉特',
  'MZN': '莫桑比克梅蒂卡尔',
  'NAD': '纳米比亚元',
  'NGN': '尼日利亚奈拉',
  'NIO': '尼加拉瓜科多巴',
  'NOK': '挪威克朗',
  'NPR': '尼泊尔卢比',
  'NZD': '新西兰元',
  'OMR': '阿曼里亚尔',
  'PAB': '巴拿马巴波亚',
  'PEN': '秘鲁索尔',
  'PGK': '巴布亚新几内亚基那',
  'PHP': '菲律宾比索',
  'PKR': '巴基斯坦卢比',
  'PLN': '波兰兹罗提',
  'PYG': '巴拉圭瓜拉尼',
  'QAR': '卡塔尔里亚尔',
  'RON': '罗马尼亚列伊',
  'RSD': '塞尔维亚第纳尔',
  'RUB': '俄罗斯卢布',
  'RWF': '卢旺达法郎',
  'SAR': '沙特里亚尔',
  'SBD': '所罗门群岛元',
  'SCR': '塞舌尔卢比',
  'SDG': '苏丹镑',
  'SEK': '瑞典克朗',
  'SGD': '新加坡元',
  'SHP': '圣赫勒拿镑',
  'SLL': '塞拉利昂利昂',
  'SOS': '索马里先令',
  'SRD': '苏里南元',
  'SSP': '南苏丹镑',
  'STN': '圣多美和普林西比多布拉',
  'SYP': '叙利亚镑',
  'SZL': '斯威士兰里兰吉尼',
  'THB': '泰铢',
  'TJS': '塔吉克斯坦索莫尼',
  'TMT': '土库曼斯坦马纳特',
  'TND': '突尼斯第纳尔',
  'TOP': '汤加潘加',
  'TRY': '土耳其里拉',
  'TTD': '特立尼达和多巴哥元',
  'TWD': '新台币',
  'TZS': '坦桑尼亚先令',
  'UAH': '乌克兰格里夫纳',
  'UGX': '乌干达先令',
  'USD': '美元',
  'UYU': '乌拉圭比索',
  'UZS': '乌兹别克斯坦苏姆',
  'VES': '委内瑞拉玻利瓦尔',
  'VND': '越南盾',
  'VUV': '瓦努阿图瓦图',
  'WST': '萨摩亚塔拉',
  'XAF': '中非法郎',
  'XCD': '东加勒比元',
  'XOF': '西非法郎',
  'XPF': '太平洋法郎',
  'YER': '也门里亚尔',
  'ZAR': '南非兰特',
  'ZMW': '赞比亚克瓦查',
  'ZWL': '津巴布韦元'
};
var currentRate = null;
var isConverting = false;
var lastChangedInput = 'from';

function chineseToNumber(text) {
  if (!text || text.trim() === '') return null;
  
  text = text.trim().replace(/,/g, '');
  
  const chnUnitChar = {
    '十': 10,
    '百': 100,
    '千': 1000,
    '万': 10000,
    '亿': 100000000,
    '兆': 1000000000000
  };
  
  // 先尝试匹配阿拉伯数字+单位的格式，例如：2000万、1.5亿等
  const arabicWithUnitMatch = text.match(/^(\d+(?:\.\d+)?)\s*([十百千万亿兆]*)$/);
  if (arabicWithUnitMatch) {
    let result = parseFloat(arabicWithUnitMatch[1]);
    const units = arabicWithUnitMatch[2];
    for (let i = 0; i < units.length; i++) {
      const unit = chnUnitChar[units[i]];
      if (unit) {
        result *= unit;
      }
    }
    return result;
  }
  
  // 再尝试匹配纯阿拉伯数字
  const arabicOnlyMatch = text.match(/^(\d+(?:\.\d+)?)$/);
  if (arabicOnlyMatch) {
    return parseFloat(arabicOnlyMatch[1]);
  }
  
  const chnNumChar = {
    '零': 0, '0': 0, '〇': 0,
    '一': 1, '1': 1, '壹': 1,
    '二': 2, '2': 2, '贰': 2, '两': 2,
    '三': 3, '3': 3, '叁': 3,
    '四': 4, '4': 4, '肆': 4,
    '五': 5, '5': 5, '伍': 5,
    '六': 6, '6': 6, '陆': 6,
    '七': 7, '7': 7, '柒': 7,
    '八': 8, '8': 8, '捌': 8,
    '九': 9, '9': 9, '玖': 9
  };
  
  const match = text.match(/^([\d零一二三四五六七八九十百千万亿兆〇壹贰叁肆伍陆柒捌玖\s]*)([十百千万亿兆]*)$/);
  if (!match) return null;
  
  const numStr = match[1].replace(/\s/g, '');
  const endUnit = match[2];
  
  if (numStr === '') {
    let result = 0;
    for (let i = 0; i < endUnit.length; i++) {
      const unit = chnUnitChar[endUnit[i]];
      if (unit >= 10000) {
        result = (result + 1) * unit;
      } else {
        result += unit;
      }
    }
    return result || null;
  }
  
  let result = 0;
  let temp = 0;
  let hasDigit = false;
  let currentNum = 0;
  let section = 0;
  
  for (let i = 0; i < numStr.length; i++) {
    const char = numStr[i];
    
    if (chnNumChar[char] !== undefined) {
      currentNum = chnNumChar[char];
      hasDigit = true;
    } else if (chnUnitChar[char]) {
      const unit = chnUnitChar[char];
      
      if (unit >= 10000) {
        section = (section + currentNum) * unit;
        result += section;
        section = 0;
        currentNum = 0;
      } else {
        if (currentNum === 0 && !hasDigit) {
          currentNum = 1;
        }
        section += currentNum * unit;
        currentNum = 0;
      }
      hasDigit = false;
    } else if (char === '.' || char === '点') {
      result += section + currentNum;
      section = 0;
      currentNum = 0;
      
      let decimal = 0;
      let divisor = 10;
      for (let j = i + 1; j < numStr.length; j++) {
        const dc = numStr[j];
        if (chnNumChar[dc] !== undefined) {
          decimal += chnNumChar[dc] / divisor;
          divisor *= 10;
        } else {
          break;
        }
      }
      result += decimal;
      break;
    }
  }
  
  result += section + currentNum;
  
  if (endUnit && chnUnitChar[endUnit]) {
    result *= chnUnitChar[endUnit];
  }
  
  return result || null;
}

function formatNumber(num, currency) {
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'ISK', 'HUF'];
  const decimals = noDecimalCurrencies.includes(currency) ? 0 : 2;
  
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿';
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万';
  } else {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
}

async function loadCurrencies() {
  try {
    const response = await fetch('https://api.frankfurter.dev/v1/currencies');
    if (!response.ok) throw new Error('获取货币列表失败');
    currencies = await response.json();
    populateCurrencySelects();
    return true;
  } catch (error) {
    showError('无法加载货币列表，请检查网络连接');
    return false;
  }
}

function populateCurrencySelects() {
  const fromSelect = document.getElementById('fromCurrency');
  const toSelect = document.getElementById('toCurrency');
  
  const currencyList = Object.keys(currencies).sort();
  
  let html = '';
  currencyList.forEach(code => {
    const zhName = currencyNamesZh[code] || code;
    html += '<option value="' + code + '">' + zhName + '</option>';
  });
  
  fromSelect.innerHTML = html;
  toSelect.innerHTML = html;
  
  fromSelect.value = config_currency_convert.fromCurrency;
  toSelect.value = config_currency_convert.toCurrency;
  
  updateCurrencyNames();
}

function updateCurrencyNames() {
  const fromCurrency = document.getElementById('fromCurrency').value;
  const toCurrency = document.getElementById('toCurrency').value;
  
  document.getElementById('fromCurrencyName').textContent = currencyNamesZh[fromCurrency] || currencies[fromCurrency] || '';
  document.getElementById('toCurrencyName').textContent = currencyNamesZh[toCurrency] || currencies[toCurrency] || '';
}

async function convertCurrency(direction = 'from') {
  if (isConverting) return;
  
  const fromCurrency = document.getElementById('fromCurrency').value;
  const toCurrency = document.getElementById('toCurrency').value;
  
  let amount;
  if (direction === 'from') {
    const inputText = document.getElementById('fromAmount').value;
    amount = chineseToNumber(inputText);
  } else {
    const inputText = document.getElementById('toAmount').value;
    amount = chineseToNumber(inputText);
  }

  if (amount === null || amount <= 0) {
    document.getElementById('fromAmount').value = config_currency_convert.fromAmount || '';
    document.getElementById('toAmount').value = config_currency_convert.toAmount || '';
    document.getElementById('rateText').textContent = '输入金额开始转换';
    hideError();
    return;
  }

  if (fromCurrency === toCurrency) {
    document.getElementById('toAmount').value = document.getElementById('fromAmount').value;
    const fromZhName = currencyNamesZh[fromCurrency] || fromCurrency;
    const toZhName = currencyNamesZh[toCurrency] || toCurrency;
    document.getElementById('rateText').textContent = '1 ' + fromZhName + ' = 1 ' + toZhName;
    return;
  }

  hideError();
  isConverting = true;

  try {
    const response = await fetch(
      'https://api.frankfurter.dev/v1/latest?amount=' + amount + '&from=' + (direction === 'from' ? fromCurrency : toCurrency) + '&to=' + (direction === 'from' ? toCurrency : fromCurrency)
    );
    
    if (!response.ok) throw new Error('获取汇率失败');
    
    const data = await response.json();
    const result = data.rates[direction === 'from' ? toCurrency : fromCurrency];
    const rate = result / amount;
    
    if (direction === 'from') {
      document.getElementById('toAmount').value = formatNumber(result, toCurrency);
      config_currency_convert.toAmount = document.getElementById('toAmount').value;
    } else {
      document.getElementById('fromAmount').value = formatNumber(result, fromCurrency);
      config_currency_convert.fromAmount = document.getElementById('fromAmount').value;
    }
    
    const fromZhName = currencyNamesZh[fromCurrency] || fromCurrency;
      const toZhName = currencyNamesZh[toCurrency] || toCurrency;
      document.getElementById('rateText').textContent = 
        '1 ' + fromZhName + ' = ' + rate.toFixed(6) + ' ' + toZhName + ' · ' + data.date;
    
    saveConfig();
  } catch (error) {
    showError('转换失败: ' + error.message);
  } finally {
    isConverting = false;
  }
}

function swapCurrencies() {
  const fromSelect = document.getElementById('fromCurrency');
  const toSelect = document.getElementById('toCurrency');
  
  const tempCurrency = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = tempCurrency;
  
  const tempAmount = document.getElementById('fromAmount').value;
  document.getElementById('fromAmount').value = document.getElementById('toAmount').value;
  document.getElementById('toAmount').value = tempAmount;
  
  config_currency_convert.fromCurrency = fromSelect.value;
  config_currency_convert.toCurrency = toSelect.value;
  config_currency_convert.fromAmount = document.getElementById('fromAmount').value;
  config_currency_convert.toAmount = document.getElementById('toAmount').value;
  
  updateCurrencyNames();
  
  if (document.getElementById('fromAmount').value) {
    convertCurrency('from');
  }
  
  saveConfig();
}

function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = message;
  errorEl.classList.add('show');
}

function hideError() {
  document.getElementById('errorMessage').classList.remove('show');
}

function saveConfig() {
  config_currency_convert.fromCurrency = document.getElementById('fromCurrency').value;
  config_currency_convert.toCurrency = document.getElementById('toCurrency').value;
  config_currency_convert.fromAmount = document.getElementById('fromAmount').value;
  config_currency_convert.toAmount = document.getElementById('toAmount').value;
  localStorage.setItem('config_currency_convert', JSON.stringify(config_currency_convert));
}

function loadConfig() {
  var saved = localStorage.getItem('config_currency_convert');
  if (saved) {
    try {
      config_currency_convert = JSON.parse(saved);
      document.getElementById('fromAmount').value = config_currency_convert.fromAmount || '';
      document.getElementById('toAmount').value = config_currency_convert.toAmount || '';
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  }
}

let convertTimeout = null;

function debouncedConvert(direction) {
  if (convertTimeout) {
    clearTimeout(convertTimeout);
  }
  convertTimeout = setTimeout(function() {
    convertCurrency(direction);
  }, 300);
}

document.addEventListener('DOMContentLoaded', async function() {
  loadConfig();
  
  const loaded = await loadCurrencies();
  if (loaded) {
    document.getElementById('fromCurrency').value = config_currency_convert.fromCurrency;
    document.getElementById('toCurrency').value = config_currency_convert.toCurrency;
    updateCurrencyNames();
    
    if (config_currency_convert.fromAmount) {
      convertCurrency('from');
    }
  }
  
  document.getElementById('btnSwap').addEventListener('click', swapCurrencies);
  
  document.getElementById('fromAmount').addEventListener('input', function() {
    config_currency_convert.fromAmount = this.value;
    debouncedConvert('from');
  });
  
  document.getElementById('toAmount').addEventListener('input', function() {
    config_currency_convert.toAmount = this.value;
    debouncedConvert('to');
  });
  
  document.getElementById('fromCurrency').addEventListener('change', function() {
    config_currency_convert.fromCurrency = this.value;
    updateCurrencyNames();
    saveConfig();
    if (document.getElementById('fromAmount').value) {
      convertCurrency('from');
    }
  });
  
  document.getElementById('toCurrency').addEventListener('change', function() {
    config_currency_convert.toCurrency = this.value;
    updateCurrencyNames();
    saveConfig();
    if (document.getElementById('fromAmount').value) {
      convertCurrency('from');
    }
  });
});
