const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'ISK', 'HUF'];

export const chineseToNumber = (text) => {
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

  const match = text.match(/^([\d零一二两三四五六七八九十百千万亿兆〇壹贰叁肆伍陆柒捌玖\s]*)([十百千万亿兆]*)$/);
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
  let currentNum = 0;
  let hasDigit = false;
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
};

export const formatNumber = (num, currency) => {
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
};
