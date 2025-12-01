// 测试 parseQuestionForMCP 函数
function parseQuestionForMCP(question) {
  const q = question.toLowerCase();
  
  // 检测配对问题
  const matchPatterns = [
    /(.+?)和(.+?)配对/,
    /(.+?)与(.+?)配对/,
    /(.+?)和(.+?)合适/,
    /(.+?)与(.+?)合适/,
    /(.+?)和(.+?)合适吗/,
    /(.+?)与(.+?)合适吗/,
    /(.+?)和(.+?)适合/,
    /(.+?)与(.+?)适合/,
    /(.+?)和(.+?)适合吗/,
    /(.+?)与(.+?)适合吗/,
    /(.+?)和(.+?)compatibility/,
    /(.+?)与(.+?)compatibility/,
    /(.+?)和(.+?)关系/,
    /(.+?)与(.+?)关系/
  ];
  
  let isMatchQuestion = false;
  let zodiac1 = null;
  let zodiac2 = null;
  
  for (const pattern of matchPatterns) {
    const match = question.match(pattern);
    if (match) {
      isMatchQuestion = true;
      zodiac1 = match[1].trim();
      zodiac2 = match[2].trim();
      break;
    }
  }
  
  // 检测日期格式 (YYYY.MM.DD, YYYY-MM-DD, YYYY/MM/DD, YYYY年MM月DD日)
  const datePatterns = [
    /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
    /(\d{4})年(\d{1,2})月(\d{1,2})日/
  ];
  
  let isDateQuestion = false;
  let year = null;
  let month = null;
  let day = null;
  
  for (const pattern of datePatterns) {
    const match = question.match(pattern);
    if (match) {
      isDateQuestion = true;
      year = parseInt(match[1]);
      month = parseInt(match[2]);
      day = parseInt(match[3]);
      break;
    }
  }
  
  // 星座列表
  const zodiacs = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
  
  // 如果是日期问题
  if (isDateQuestion && month && day) {
    return {
      name: 'get_zodiac_by_date',
      arguments: {
        month: month,
        day: day,
        question: question,
        context: []
      }
    };
  }
  
  // 如果是配对问题
  if (isMatchQuestion && zodiac1 && zodiac2) {
    // 验证星座是否存在
    const validZodiac1 = zodiacs.find(z => zodiac1.includes(z)) || null;
    const validZodiac2 = zodiacs.find(z => zodiac2.includes(z)) || null;
    
    if (validZodiac1 && validZodiac2) {
      return {
        name: 'get_compatibility',
        arguments: {
          zodiac1: validZodiac1,
          zodiac2: validZodiac2,
          question: question,
          context: []
        }
      };
    }
  }
  
  // 检测单个星座
  const zodiac = zodiacs.find(z => q.includes(z)) || '狮子座'; // 默认狮子座
  
  // 检测时间范围
  let toolName = 'get_daily_horoscope';
  let timeRange = 'daily';
  if (q.includes('本周') || q.includes('这周') || q.includes('weekly')) {
    toolName = 'get_weekly_horoscope';
    timeRange = 'weekly';
  } else if (q.includes('本月') || q.includes('这个月') || q.includes('monthly')) {
    toolName = 'get_monthly_horoscope';
    timeRange = 'monthly';
  } else if (q.includes('今年') || q.includes('年度') || q.includes('yearly')) {
    toolName = 'get_yearly_horoscope';
    timeRange = 'yearly';
  }
  
  // 检测运势类别
  let category = 'general';
  if (q.includes('爱情') || q.includes('感情') || q.includes('恋爱') || q.includes('love')) {
    category = 'love';
  } else if (q.includes('事业') || q.includes('工作') || q.includes('职场') || q.includes('career')) {
    category = 'career';
  } else if (q.includes('财运') || q.includes('金钱') || q.includes('财富') || q.includes('money')) {
    category = 'wealth';
  } else if (q.includes('健康') || q.includes('身体') || q.includes('health')) {
    category = 'health';
  } else if (q.includes('学习') || q.includes('学业') || q.includes('education')) {
    category = 'education';
  }
  
  // 检测是否询问"适合做什么"
  if (q.includes('适合') || q.includes('应该') || q.includes('可以') || q.includes('做什么')) {
    category = 'general'; // 使用支持的通用类别
  }
  
  return {
    name: toolName,
    arguments: {
      zodiac: zodiac,
      category: category,
      timeRange: timeRange,
      source: 'local',
      question: question,
      context: []
    }
  };
}

// 测试不同的问题
const testQuestions = [
  '1996.02.10是什么星座？',
  '狮子座和白羊座合适吗？？？',
  '帮我看看白羊座',
  '1995-03-15是什么星座？',
  '双子座和金牛座配对'
];

console.log('=== parseQuestionForMCP 测试 ===\n');

testQuestions.forEach((question, index) => {
  const result = parseQuestionForMCP(question);
  console.log(`问题 ${index + 1}: ${question}`);
  console.log('解析结果:', result);
  console.log('---\n');
});