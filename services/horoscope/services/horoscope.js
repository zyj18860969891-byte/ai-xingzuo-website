/**
 * 🌟 星座数据和运势计算服务
 * 提供星座信息和各种运势计算功能，集成ModelScope star-mcp服务
 * 
 * @author: GitHub Copilot
 * @version: 1.0.0-alpha
 */

const axios = require('axios');
const dayjs = require('dayjs');

// MCP配置 - 集成ModelScope star-mcp服务
const MCP_CONFIG = {
  serverUrl: process.env.STAR_MCP_URL || 'https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp',
  timeout: parseInt(process.env.STAR_MCP_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// 星座数据缓存
let horoscopeCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

// 星座数据
const ZODIAC_SIGNS = [
  {
    name: '白羊座',
    englishName: 'Aries',
    dateRange: '3月21日 - 4月19日',
    dateStart: { month: 3, day: 21 },
    dateEnd: { month: 4, day: 19 },
    element: '火',
    quality: '主动',
    planet: '火星',
    color: '红色',
    luckyNumbers: [1, 9, 18, 27],
    compatibleSigns: ['狮子座', '射手座', '水瓶座'],
    description: '充满活力和冒险精神的先驱者',
    traits: {
      positive: ['勇敢', '热情', '直率', '乐观'],
      negative: ['冲动', '急躁', '自我中心', '缺乏耐心']
    }
  },
  {
    name: '金牛座',
    englishName: 'Taurus',
    dateRange: '4月20日 - 5月20日',
    dateStart: { month: 4, day: 20 },
    dateEnd: { month: 5, day: 20 },
    element: '土',
    quality: '固定',
    planet: '金星',
    color: '绿色',
    luckyNumbers: [2, 6, 9, 15],
    compatibleSigns: ['处女座', '摩羯座', '巨蟹座'],
    description: '稳重踏实的享受主义者',
    traits: {
      positive: ['可靠', '耐心', '实际', '忠诚'],
      negative: ['固执', '物质主义', '懒惰', '嫉妒']
    }
  },
  {
    name: '双子座',
    englishName: 'Gemini',
    dateRange: '5月21日 - 6月21日',
    dateStart: { month: 5, day: 21 },
    dateEnd: { month: 6, day: 21 },
    element: '风',
    quality: '变动',
    planet: '水星',
    color: '黄色',
    luckyNumbers: [3, 5, 7, 14],
    compatibleSigns: ['天秤座', '水瓶座', '狮子座'],
    description: '聪明好奇的信息传递者',
    traits: {
      positive: ['机智', '好奇', '灵活', '善于沟通'],
      negative: ['善变', '肤浅', '神经质', '不专一']
    }
  },
  {
    name: '巨蟹座',
    englishName: 'Cancer',
    dateRange: '6月22日 - 7月22日',
    dateStart: { month: 6, day: 22 },
    dateEnd: { month: 7, day: 22 },
    element: '水',
    quality: '主动',
    planet: '月亮',
    color: '银色',
    luckyNumbers: [2, 3, 15, 20],
    compatibleSigns: ['天蝎座', '双鱼座', '金牛座'],
    description: '敏感温柔的家庭守护者',
    traits: {
      positive: ['敏感', '体贴', '忠诚', '有同情心'],
      negative: ['情绪化', '依赖', '过度保护', '逃避']
    }
  },
  {
    name: '狮子座',
    englishName: 'Leo',
    dateRange: '7月23日 - 8月22日',
    dateStart: { month: 7, day: 23 },
    dateEnd: { month: 8, day: 22 },
    element: '火',
    quality: '固定',
    planet: '太阳',
    color: '金色',
    luckyNumbers: [1, 3, 10, 19],
    compatibleSigns: ['白羊座', '射手座', '双子座'],
    description: '自信慷慨的领导者',
    traits: {
      positive: ['自信', '慷慨', '热情', '有创造力'],
      negative: ['自大', '傲慢', '固执', '需要关注']
    }
  },
  {
    name: '处女座',
    englishName: 'Virgo',
    dateRange: '8月23日 - 9月22日',
    dateStart: { month: 8, day: 23 },
    dateEnd: { month: 9, day: 22 },
    element: '土',
    quality: '变动',
    planet: '水星',
    color: '灰色',
    luckyNumbers: [3, 5, 6, 9],
    compatibleSigns: ['金牛座', '摩羯座', '双鱼座'],
    description: '细致完美的分析师',
    traits: {
      positive: ['细致', '实际', '谦虚', '有组织'],
      negative: ['挑剔', '过度分析', '焦虑', '冷漠']
    }
  },
  {
    name: '天秤座',
    englishName: 'Libra',
    dateRange: '9月23日 - 10月23日',
    dateStart: { month: 9, day: 23 },
    dateEnd: { month: 10, day: 23 },
    element: '风',
    quality: '主动',
    planet: '金星',
    color: '蓝色',
    luckyNumbers: [2, 6, 7, 9],
    compatibleSigns: ['双子座', '天秤座', '水瓶座'],
    description: '优雅和谐的和平缔造者',
    traits: {
      positive: ['和蔼', '合作', '有外交手腕', '有魅力'],
      negative: ['优柔寡断', '逃避', '自怜', '依赖']
    }
  },
  {
    name: '天蝎座',
    englishName: 'Scorpio',
    dateRange: '10月24日 - 11月22日',
    dateStart: { month: 10, day: 24 },
    dateEnd: { month: 11, day: 22 },
    element: '水',
    quality: '固定',
    planet: '冥王星',
    color: '深红色',
    luckyNumbers: [1, 8, 11, 15],
    compatibleSigns: ['巨蟹座', '双鱼座', '处女座'],
    description: '深刻神秘的变革者',
    traits: {
      positive: ['有决心', '有激情', '有洞察力', '忠诚'],
      negative: ['嫉妒', '控制欲', '复仇心', '多疑']
    }
  },
  {
    name: '射手座',
    englishName: 'Sagittarius',
    dateRange: '11月23日 - 12月21日',
    dateStart: { month: 11, day: 23 },
    dateEnd: { month: 12, day: 21 },
    element: '火',
    quality: '变动',
    planet: '木星',
    color: '紫色',
    luckyNumbers: [3, 7, 9, 12],
    compatibleSigns: ['白羊座', '狮子座', '天秤座'],
    description: '自由奔放的冒险家',
    traits: {
      positive: ['乐观', '坦率', '有哲学头脑', '有幽默感'],
      negative: ['鲁莽', '不切实际', '不专一', '粗心']
    }
  },
  {
    name: '摩羯座',
    englishName: 'Capricorn',
    dateRange: '12月22日 - 1月19日',
    dateStart: { month: 12, day: 22 },
    dateEnd: { month: 1, day: 19 },
    element: '土',
    quality: '主动',
    planet: '土星',
    color: '棕色',
    luckyNumbers: [4, 8, 12, 22],
    compatibleSigns: ['金牛座', '处女座', '天蝎座'],
    description: '务实负责的成就者',
    traits: {
      positive: ['有责任感', '有耐心', '实际', '有纪律'],
      negative: ['悲观', '冷漠', '过于谨慎', '工作狂']
    }
  },
  {
    name: '水瓶座',
    englishName: 'Aquarius',
    dateRange: '1月20日 - 2月18日',
    dateStart: { month: 1, day: 20 },
    dateEnd: { month: 2, day: 18 },
    element: '风',
    quality: '固定',
    planet: '天王星',
    color: '蓝色',
    luckyNumbers: [1, 7, 9, 11],
    compatibleSigns: ['双子座', '天秤座', '射手座'],
    description: '独立创新的人道主义者',
    traits: {
      positive: ['独立', '人道', '聪明', '有原创性'],
      negative: ['叛逆', '冷漠', '不切实际', '固执']
    }
  },
  {
    name: '双鱼座',
    englishName: 'Pisces',
    dateRange: '2月19日 - 3月20日',
    dateStart: { month: 2, day: 19 },
    dateEnd: { month: 3, day: 20 },
    element: '水',
    quality: '变动',
    planet: '海王星',
    color: '海绿色',
    luckyNumbers: [2, 3, 6, 9],
    compatibleSigns: ['巨蟹座', '天蝎座', '双鱼座'],
    description: '敏感梦幻的梦想家',
    traits: {
      positive: ['有同情心', '温和', '有想象力', '有直觉'],
      negative: ['逃避', '软弱', '不切实际', '依赖']
    }
  }
];

/**
 * 调用star-mcp服务
 */
async function callStarMCP(method, params = {}) {
  try {
    const requestData = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: method,
      params: params
    };

    const response = await axios.post(MCP_CONFIG.serverUrl, requestData, {
      timeout: MCP_CONFIG.timeout,
      headers: MCP_CONFIG.headers
    });

    if (response.data.error) {
      throw new Error(`MCP Error: ${response.data.error.message}`);
    }

    return response.data.result;
  } catch (error) {
    console.error('调用star-mcp服务失败:', error.message);
    throw new Error(`MCP服务调用失败: ${error.message}`);
  }
}

/**
 * 获取星座数据服务
 */
const getHoroscopeData = {
  /**
   * 获取所有星座列表
   */
  getAllSigns() {
    return ZODIAC_SIGNS.map(sign => ({
      name: sign.name,
      englishName: sign.englishName,
      dateRange: sign.dateRange,
      element: sign.element,
      planet: sign.planet,
      color: sign.color,
      description: sign.description
    }));
  },

  /**
   * 根据名称获取星座信息
   */
  getSignInfo(signName) {
    return ZODIAC_SIGNS.find(sign => 
      sign.name === signName || sign.englishName.toLowerCase() === signName.toLowerCase()
    );
  },

  /**
   * 根据日期获取星座
   */
  getSignByDate(month, day) {
    for (const sign of ZODIAC_SIGNS) {
      if (month === sign.dateStart.month && day >= sign.dateStart.day) {
        return sign;
      }
      if (month === sign.dateEnd.month && day <= sign.dateEnd.day) {
        return sign;
      }
    }
    
    // 特殊处理摩羯座跨年情况
    if (month === 1 && day <= 19) {
      return ZODIAC_SIGNS.find(s => s.name === '摩羯座');
    }
    
    return null;
  }
};

/**
 * 获取每日运势
 */
async function getDailyHoroscope(sign, date = new Date()) {
  const cacheKey = `daily_${sign}_${date.toDateString()}`;
  
  if (horoscopeCache.has(cacheKey)) {
    const cached = horoscopeCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const result = await callStarMCP('getDailyHoroscope', {
      sign: sign,
      date: date.toISOString().split('T')[0]
    });

    const horoscope = {
      ...result,
      date: date.toISOString().split('T')[0],
      sign: sign,
      type: 'daily',
      generatedAt: new Date().toISOString()
    };

    horoscopeCache.set(cacheKey, {
      data: horoscope,
      timestamp: Date.now()
    });

    return horoscope;
  } catch (error) {
    console.error(`获取${sign}每日运势失败:`, error.message);
    throw error;
  }
}

/**
 * 获取每周运势
 */
async function getWeeklyHoroscope(sign, week, year) {
  const cacheKey = `weekly_${sign}_${year}_week_${week}`;
  
  if (horoscopeCache.has(cacheKey)) {
    const cached = horoscopeCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const result = await callStarMCP('getWeeklyHoroscope', {
      sign: sign,
      week: week,
      year: year
    });

    const horoscope = {
      ...result,
      week: week,
      year: year,
      sign: sign,
      type: 'weekly',
      generatedAt: new Date().toISOString()
    };

    horoscopeCache.set(cacheKey, {
      data: horoscope,
      timestamp: Date.now()
    });

    return horoscope;
  } catch (error) {
    console.error(`获取${sign}每周运势失败:`, error.message);
    throw error;
  }
}

/**
 * 获取每月运势
 */
async function getMonthlyHoroscope(sign, month, year) {
  const cacheKey = `monthly_${sign}_${year}_${month}`;
  
  if (horoscopeCache.has(cacheKey)) {
    const cached = horoscopeCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const result = await callStarMCP('getMonthlyHoroscope', {
      sign: sign,
      month: month,
      year: year
    });

    const horoscope = {
      ...result,
      month: month,
      year: year,
      sign: sign,
      type: 'monthly',
      generatedAt: new Date().toISOString()
    };

    horoscopeCache.set(cacheKey, {
      data: horoscope,
      timestamp: Date.now()
    });

    return horoscope;
  } catch (error) {
    console.error(`获取${sign}每月运势失败:`, error.message);
    throw error;
  }
}

/**
 * 获取年度运势
 */
async function getYearlyHoroscope(sign, year) {
  const cacheKey = `yearly_${sign}_${year}`;
  
  if (horoscopeCache.has(cacheKey)) {
    const cached = horoscopeCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const result = await callStarMCP('getYearlyHoroscope', {
      sign: sign,
      year: year
    });

    const horoscope = {
      ...result,
      year: year,
      sign: sign,
      type: 'yearly',
      generatedAt: new Date().toISOString()
    };

    horoscopeCache.set(cacheKey, {
      data: horoscope,
      timestamp: Date.now()
    });

    return horoscope;
  } catch (error) {
    console.error(`获取${sign}年度运势失败:`, error.message);
    throw error;
  }
}

/**
 * 获取星座AI深度分析
 */
async function getHoroscopeAnalysis(sign, options = {}) {
  try {
    const result = await callStarMCP('getHoroscopeAnalysis', {
      sign: sign,
      question: options.question,
      birthInfo: options.birthInfo
    });

    return {
      ...result,
      sign: sign,
      question: options.question || '通用分析',
      analysisAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`获取${sign} AI分析失败:`, error.message);
    throw error;
  }
}

/**
 * 清除缓存
 */
function clearCache() {
  horoscopeCache.clear();
}

/**
 * 获取缓存统计
 */
function getCacheStats() {
  return {
    size: horoscopeCache.size,
    keys: Array.from(horoscopeCache.keys())
  };
}

module.exports = {
  getHoroscopeData,
  getDailyHoroscope,
  getWeeklyHoroscope,
  getMonthlyHoroscope,
  getYearlyHoroscope,
  getHoroscopeAnalysis,
  clearCache,
  getCacheStats,
  callStarMCP
};