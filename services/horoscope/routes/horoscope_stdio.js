/**
 * 🌟 星座运势数据路由 (stdio版本)
 * 使用stdio协议与MCP服务通信
 * 
 * @author: GitHub Copilot
 * @version: 1.0.0-alpha
 */

const express = require('express');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { param, query, body, validationResult } = require('express-validator');
const router = express.Router();

// 导入星座数据和运势计算逻辑
const { getHoroscopeData, getDailyHoroscope, getWeeklyHoroscope, 
        getMonthlyHoroscope, getYearlyHoroscope, getHoroscopeAnalysis } = require('../services/horoscope');

// 导入AI增强解析服务
const aiParser = require('../services/ai-enhanced-parser');

// 请求验证中间件
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: '请求参数验证失败',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/v1/horoscope/signs
 * 获取所有星座列表
 */
router.get('/signs', (req, res) => {
  try {
    const signs = getHoroscopeData.getAllSigns();
    res.json({
      success: true,
      data: signs,
      count: signs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取星座列表失败:', error.message);
    res.status(500).json({
      error: '获取星座列表失败',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/horoscope/chat/analyze
 * 处理聊天分析请求 - 使用stdio协议连接MCP服务
 */
router.post('/chat/analyze', [
  body('question').notEmpty().withMessage('问题不能为空'),
  body('sessionId').optional().isString().withMessage('会话ID必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '请求参数验证失败',
        details: errors.array()
      });
    }

    const { prompt, question, sessionId } = req.body;
    
    // 使用AI增强解析
    const sessionUuid = sessionId || uuidv4();
    console.log('🤖 使用AI增强解析:', {
      question: question.substring(0, 50) + '...',
      sessionId: sessionUuid,
      aiEnabled: aiParser.getStatus().aiEnabled
    });
    
    // AI解析问题
    const aiResult = await aiParser.parseQuestion(question, sessionUuid);
    console.log('✅ AI解析结果:', {
      tool: aiResult.tool,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning
    });
    
    // 使用AI解析结果调用MCP服务
    let mcpResponse;
    
    // 如果是星座询问，检查是否有日期信息
    if (aiResult.tool === 'ask_zodiac') {
      console.log('🔍 检测到星座询问，返回询问消息');
      
      // 检查是否有日期信息可以推断星座
      const dateInfo = aiResult.arguments.dateInfo;
      if (dateInfo && dateInfo.zodiac) {
        // 保存推断的星座到上下文
        aiParser.updateUserZodiac(sessionUuid, dateInfo.zodiac, dateInfo.date);
        console.log(`🌟 已保存推断的星座信息: ${dateInfo.zodiac} (来自日期: ${dateInfo.date})`);
      }
      
      mcpResponse = {
        success: true,
        type: 'zodiac_question',
        question: aiResult.arguments.question,
        followUpQuestions: aiResult.arguments.followUpQuestions,
        aiConfidence: aiResult.confidence,
        aiReasoning: aiResult.reasoning,
        metadata: {
          analysisType: 'ai_enhanced_zodiac_question',
          source: 'ai_enhanced_parser',
          tool: 'ask_zodiac',
          sessionId: sessionUuid,
          question: question,
          dateInfo: dateInfo
        }
      };
    } else {
      // 使用AI解析结果调用MCP服务
      mcpResponse = await callStarMCPStdioWithAI(question, [{ id: sessionUuid, context: [] }], aiResult);
      
      // 如果是get_zodiac_by_date工具调用成功，保存星座信息到上下文
      if (mcpResponse.success && aiResult.tool === 'get_zodiac_by_date') {
        // 这里需要从MCP响应中提取星座信息
        // 由于MCP返回的是星座名称，我们需要解析响应内容
        const responseContent = mcpResponse.answer;
        const zodiacMatch = responseContent.match(/(?:星座是|属于)(.+?)(?:[，。！？]|$)/);
        if (zodiacMatch) {
          const zodiac = zodiacMatch[1].trim();
          aiParser.updateUserZodiac(sessionUuid, zodiac);
          console.log(`🌟 已保存用户星座信息: ${zodiac} (从日期查询结果)`);
        }
      }
      // 如果是运势查询且成功，保存星座信息到上下文
      else if (mcpResponse.success && aiResult.tool && aiResult.tool.includes('horoscope')) {
        const zodiac = aiResult.arguments.zodiac;
        if (zodiac && zodiac !== 'unknown') {
          aiParser.updateUserZodiac(sessionUuid, zodiac);
          console.log(`🌟 已保存用户星座信息: ${zodiac} (会话: ${sessionUuid})`);
        }
      }
    }
    
    // 直接返回MCP响应（成功或失败），前端处理
    res.json({
      ...mcpResponse,
      question: question,
      aiEnhanced: true,
      aiConfidence: aiResult.confidence,
      aiReasoning: aiResult.reasoning,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI增强解析失败:', error);
    
    // 降级到原始方法
    console.log('🔄 降级到原始stdio方法...');
    try {
      const sessionUuid = sessionId || uuidv4();
      const mcpResponse = await callStarMCPStdio(question, [{ id: sessionUuid, context: [] }]);
      
      res.json({
        ...mcpResponse,
        question: question,
        aiEnhanced: false,
        timestamp: new Date().toISOString()
      });
    } catch (fallbackError) {
      console.error('降级方法也失败:', fallbackError);
      res.json({
        success: false,
        error: '服务异常',
        details: error.message,
        question: req.body.question || '未知问题',
        aiEnhanced: false,
        timestamp: new Date().toISOString()
      });
    }
  }
});

/**
 * POST /api/v1/horoscope/chat/set-zodiac
 * 设置用户的星座信息
 */
router.post('/set-zodiac', [
  body('sessionId').notEmpty().withMessage('会话ID不能为空'),
  body('zodiac').isLength({ min: 2, max: 10 }).withMessage('星座名称格式无效'),
  body('date').optional().isISO8601().withMessage('日期格式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '请求参数验证失败',
        details: errors.array()
      });
    }

    const { sessionId, zodiac, date } = req.body;
    
    // 验证星座是否存在
    const zodiacs = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
    if (!zodiacs.includes(zodiac)) {
      return res.status(400).json({
        error: '星座不存在',
        zodiac: zodiac
      });
    }
    
    // 保存星座信息到上下文
    aiParser.updateUserZodiac(sessionId, zodiac, date);
    
    console.log(`🌟 用户设置星座信息: ${zodiac} (会话: ${sessionId}, 日期: ${date || '未知'})`);
    
    res.json({
      success: true,
      message: '星座信息已保存',
      zodiac: zodiac,
      date: date,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('设置星座信息失败:', error.message);
    res.status(500).json({
      error: '设置星座信息失败',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/horoscope/:sign
 * 获取指定星座的基本信息
 */
router.get('/:sign', 
  param('sign').isLength({ min: 2, max: 10 }).withMessage('星座名称格式无效'),
  validateRequest,
  (req, res) => {
    try {
      const { sign } = req.params;
      const horoscope = getHoroscopeData.getSignInfo(sign);
      
      if (!horoscope) {
        return res.status(404).json({
          error: '星座不存在',
          sign: sign
        });
      }
      
      res.json({
        success: true,
        data: horoscope,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} 信息失败:`, error.message);
      res.status(500).json({
        error: '获取星座信息失败',
        sign: req.params.sign,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/horoscope/:sign/daily
 * 获取指定星座的每日运势
 */
router.get('/:sign/daily', 
  param('sign').isLength({ min: 2, max: 10 }).withMessage('星座名称格式无效'),
  query('date').optional().isISO8601().withMessage('日期格式无效'),
  validateRequest,
  (req, res) => {
    try {
      const { sign } = req.params;
      const { date } = req.query;
      
      // 验证星座是否存在
      const signInfo = getHoroscopeData.getSignInfo(sign);
      if (!signInfo) {
        return res.status(404).json({
          error: '星座不存在',
          sign: sign
        });
      }
      
      const targetDate = date ? new Date(date) : new Date();
      const dailyHoroscope = getDailyHoroscope(sign, targetDate);
      
      res.json({
        success: true,
        data: dailyHoroscope,
        sign: sign,
        date: targetDate.toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} 每日运势失败:`, error.message);
      res.status(500).json({
        error: '获取每日运势失败',
        sign: req.params.sign,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/horoscope/:sign/weekly
 * 获取指定星座的每周运势
 */
router.get('/:sign/weekly', 
  param('sign').isLength({ min: 2, max: 10 }).withMessage('星座名称格式无效'),
  query('week').optional().isInt({ min: 1, max: 53 }).withMessage('周数格式无效'),
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('年份格式无效'),
  validateRequest,
  (req, res) => {
    try {
      const { sign } = req.params;
      const { week, year } = req.query;
      
      // 验证星座是否存在
      const signInfo = getHoroscopeData.getSignInfo(sign);
      if (!signInfo) {
        return res.status(404).json({
          error: '星座不存在',
          sign: sign
        });
      }
      
      const targetWeek = week ? parseInt(week) : new Date().getWeek();
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      
      const weeklyHoroscope = getWeeklyHoroscope(sign, targetWeek, targetYear);
      
      res.json({
        success: true,
        data: weeklyHoroscope,
        sign: sign,
        week: targetWeek,
        year: targetYear,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} 每周运势失败:`, error.message);
      res.status(500).json({
        error: '获取每周运势失败',
        sign: req.params.sign,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/horoscope/:sign/monthly
 * 获取指定星座的每月运势
 */
router.get('/:sign/monthly', 
  param('sign').isLength({ min: 2, max: 10 }).withMessage('星座名称格式无效'),
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('月份格式无效'),
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('年份格式无效'),
  validateRequest,
  (req, res) => {
    try {
      const { sign } = req.params;
      const { month, year } = req.query;
      
      // 验证星座是否存在
      const signInfo = getHoroscopeData.getSignInfo(sign);
      if (!signInfo) {
        return res.status(404).json({
          error: '星座不存在',
          sign: sign
        });
      }
      
      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      
      const monthlyHoroscope = getMonthlyHoroscope(sign, targetMonth, targetYear);
      
      res.json({
        success: true,
        data: monthlyHoroscope,
        sign: sign,
        month: targetMonth,
        year: targetYear,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} 每月运势失败:`, error.message);
      res.status(500).json({
        error: '获取每月运势失败',
        sign: req.params.sign,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/horoscope/:sign/yearly
 * 获取指定星座的年度运势
 */
router.get('/:sign/yearly', 
  param('sign').isLength({ min: 2, max: 10 }).withMessage('星座名称格式无效'),
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('年份格式无效'),
  validateRequest,
  (req, res) => {
    try {
      const { sign } = req.params;
      const { year } = req.query;
      
      // 验证星座是否存在
      const signInfo = getHoroscopeData.getSignInfo(sign);
      if (!signInfo) {
        return res.status(404).json({
          error: '星座不存在',
          sign: sign
        });
      }
      
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      
      const yearlyHoroscope = getYearlyHoroscope(sign, targetYear);
      
      res.json({
        success: true,
        data: yearlyHoroscope,
        sign: sign,
        year: targetYear,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} 年度运势失败:`, error.message);
      res.status(500).json({
        error: '获取年度运势失败',
        sign: req.params.sign,
        message: error.message
      });
    }
  }
);

/**
 * POST /api/v1/horoscope/:sign/analysis
 * 获取指定星座的AI深度分析
 */
router.post('/:sign/analysis', 
  param('sign').isLength({ min: 2, max: 10 }).withMessage('星座名称格式无效'),
  body('question').optional().isLength({ max: 500 }).withMessage('问题长度不能超过500字符'),
  body('birthInfo').optional(),
  validateRequest,
  (req, res) => {
    try {
      const { sign } = req.params;
      const { question, birthInfo } = req.body;
      
      // 验证星座是否存在
      const signInfo = getHoroscopeData.getSignInfo(sign);
      if (!signInfo) {
        return res.status(404).json({
          error: '星座不存在',
          sign: sign
        });
      }
      
      const analysis = getHoroscopeAnalysis(sign, {
        question,
        birthInfo,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: analysis,
        sign: sign,
        question: question || '通用分析',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} AI分析失败:`, error.message);
      res.status(500).json({
        error: '获取AI分析失败',
        sign: req.params.sign,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/horoscope/compatibility/:sign1/:sign2
 * 获取两个星座的兼容性分析
 */
router.get('/compatibility/:sign1/:sign2', 
  param('sign1').isLength({ min: 2, max: 10 }).withMessage('第一个星座名称格式无效'),
  param('sign2').isLength({ min: 2, max: 10 }).withMessage('第二个星座名称格式无效'),
  validateRequest,
  (req, res) => {
    try {
      const { sign1, sign2 } = req.params;
      
      // 验证星座是否存在
      const sign1Info = getHoroscopeData.getSignInfo(sign1);
      const sign2Info = getHoroscopeData.getSignInfo(sign2);
      
      if (!sign1Info || !sign2Info) {
        return res.status(404).json({
          error: '星座不存在',
          signs: { sign1, sign2 }
        });
      }
      
      // 这里应该调用配对服务，但为了演示，暂时返回模拟数据
      const compatibility = {
        score: Math.floor(Math.random() * 100) + 1,
        level: getCompatibilityLevel(Math.floor(Math.random() * 100) + 1),
        aspects: {
          love: Math.floor(Math.random() * 100) + 1,
          friendship: Math.floor(Math.random() * 100) + 1,
          career: Math.floor(Math.random() * 100) + 1,
          family: Math.floor(Math.random() * 100) + 1
        },
        description: `${sign1}和${sign2}的组合具有独特的化学反应。在爱情方面，你们能够相互理解和支持。`,
        advice: '保持沟通，尊重彼此的差异，共同成长。'
      };
      
      res.json({
        success: true,
        data: compatibility,
        signs: { sign1, sign2 },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`获取星座 ${sign1} 和 ${sign2} 兼容性分析失败:`, error.message);
      res.status(500).json({
        error: '获取星座兼容性分析失败',
        signs: { sign1: req.params.sign1, sign2: req.params.sign2 },
        message: error.message
      });
    }
  }
);

// 辅助函数
function getCompatibilityLevel(score) {
  if (score >= 90) return '极佳';
  if (score >= 80) return '很好';
  if (score >= 70) return '良好';
  if (score >= 60) return '一般';
  if (score >= 50) return '较差';
  return '不适合';
}

/**
 * 根据用户问题解析MCP工具调用参数
 */
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

/**
 * 使用stdio协议调用MCP星座分析服务
 * 正确的架构：AI理解问题 → 生成MCP参数 → 调用MCP服务
 */
async function callStarMCPStdio(question, session) {
  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 MCP星座分析服务 (stdio协议):', {
        question: question.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });

      // 检查MCP服务是否可用
      const mcpUrl = process.env.STAR_MCP_URL || 'https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp';
      console.log('🔍 MCP服务URL:', mcpUrl);
      
      // 如果没有配置MCP服务，返回友好的错误消息
      if (!process.env.STAR_MCP_URL && !process.env.OPENROUTER_API_KEY) {
        resolve({
          success: false,
          error: 'MCP服务未配置',
          answer: '抱歉，我现在无法处理你的星座问题。请稍后再试或尝试其他问题。',
          metadata: {
            type: 'error',
            suggestion: '你可以尝试问：我今天适合做什么？或者直接告诉我你的星座'
          },
          question: question,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 启动MCP服务进程
      const mcpProcess = spawn('npx', ['star-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, 
          'Accept': 'application/json, text/event-stream',
          'Content-Type': 'application/json' 
        },
        shell: true
      });

      let responseData = '';
      let resultFound = false;
      let sessionId = null;

      // 处理子进程输出
      mcpProcess.stdout.on('data', (data) => {
        const output = data.toString();
        responseData += output;
        
        // 解析stdio输出
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              console.log('📄 stdio解析:', parsed);
              
              // 处理初始化响应
              if (parsed.result && parsed.result.capabilities) {
                sessionId = `session_${Date.now()}`;
                console.log('✅ MCP会话初始化成功:', sessionId);
                
                // 发送工具调用请求
                setTimeout(() => {
                  const mcpParams = parseQuestionForMCP(question);
                  console.log('🔍 问题解析结果:', mcpParams);
                  
                  let aiRequest;
                  
                  // 根据不同的工具类型构建不同的请求
                  if (mcpParams.name === 'get_compatibility') {
                    aiRequest = {
                      jsonrpc: '2.0',
                      id: 2,
                      method: 'tools/call',
                      params: {
                        name: 'get_compatibility',
                        arguments: {
                          zodiac1: mcpParams.arguments.zodiac1,
                          zodiac2: mcpParams.arguments.zodiac2
                        }
                      }
                    };
                  } else if (mcpParams.name === 'get_zodiac_by_date') {
                    aiRequest = {
                      jsonrpc: '2.0',
                      id: 2,
                      method: 'tools/call',
                      params: {
                        name: 'get_zodiac_by_date',
                        arguments: {
                          month: mcpParams.arguments.month,
                          day: mcpParams.arguments.day
                        }
                      }
                    };
                  } else {
                    aiRequest = {
                      jsonrpc: '2.0',
                      id: 2,
                      method: 'tools/call',
                      params: {
                        name: 'get_daily_horoscope',
                        arguments: {
                          zodiac: mcpParams.arguments.zodiac,
                          category: mcpParams.arguments.category,
                          timeRange: mcpParams.arguments.timeRange,
                          source: 'local',
                          question: question,
                          context: session.context || [],
                          date: new Date().toISOString().split('T')[0]
                        }
                      }
                    };
                  }
                  
                  console.log('🧠 发送AI分析请求:', {
                    question: question.substring(0, 50) + '...',
                    tool: mcpParams.name,
                    ...(mcpParams.name === 'get_compatibility_analysis' 
                      ? { zodiac1: mcpParams.arguments.zodiac1, zodiac2: mcpParams.arguments.zodiac2 }
                      : { zodiac: mcpParams.arguments.zodiac }),
                    category: mcpParams.arguments.category,
                    contextLength: (session.context || []).length
                  });
                  
                  mcpProcess.stdin.write(JSON.stringify(aiRequest) + '\n');
                }, 1000);
                
              } else if (parsed.result && parsed.result.content) {
                resultFound = true;
                resolve({
                  success: true,
                  answer: parsed.result.content[0].text,
                  metadata: {
                    analysisType: 'mcp_stdio',
                    source: 'jlankellii/star-mcp',
                    tool: 'get_daily_horoscope',
                    protocol: 'stdio',
                    sessionId: sessionId || 'unknown',
                    parsedFrom: 'stdio_output',
                    question: question
                  }
                });
                mcpProcess.kill();
                return;
              } else if (parsed.error) {
                resolve({
                  success: false,
                  error: 'MCP服务错误',
                  details: parsed.error.message,
                  metadata: {
                    analysisType: 'mcp_stdio_error',
                    source: 'jlankellii/star-mcp',
                    protocol: 'stdio',
                    question: question
                  }
                });
                mcpProcess.kill();
                return;
              }
            } catch (e) {
              console.log('⚠️ stdio JSON解析失败:', e.message);
            }
          }
        }
      });

      mcpProcess.stderr.on('data', (data) => {
        console.error('❌ MCP stderr:', data.toString());
      });

      mcpProcess.on('close', (code) => {
        if (!resultFound) {
          resolve({
            success: false,
            error: 'MCP服务关闭',
            details: `进程退出码: ${code}`,
            metadata: {
              analysisType: 'mcp_stdio_close',
              source: 'jlankellii/star-mcp',
              protocol: 'stdio',
              exitCode: code,
              question: question
            }
          });
        }
      });

      mcpProcess.on('error', (error) => {
        console.error('❌ MCP stdio连接失败:', error.message);
        resolve({
          success: false,
          error: 'MCP服务连接失败',
          answer: '抱歉，我现在无法处理你的星座问题。请稍后再试或尝试其他问题。',
          metadata: {
            type: 'error',
            suggestion: '你可以尝试问：我今天适合做什么？或者直接告诉我你的星座'
          },
          question: question,
          timestamp: new Date().toISOString()
        });
      });

      // 1. 初始化请求
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'ai-xingzuo', version: '1.0' }
        }
      };
      
      console.log('🔄 发送初始化请求:', initRequest);
      mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

      // 超时处理
      setTimeout(() => {
        if (!resultFound) {
          mcpProcess.kill();
          resolve({
            success: false,
            error: 'MCP请求超时',
            details: '15秒内未收到有效响应',
            metadata: {
              analysisType: 'mcp_stdio_timeout',
              source: 'jlankellii/star-mcp',
              protocol: 'stdio',
              timeout: 15000,
              question: question
            }
          });
        }
      }, 15000);

    } catch (error) {
      console.error('❌ MCP stdio连接失败:', error.message);
      resolve({
        success: false,
        error: 'MCP服务连接失败',
        answer: '抱歉，我现在无法处理你的星座问题。请稍后再试或尝试其他问题。',
        metadata: {
          type: 'error',
          suggestion: '你可以尝试问：我今天适合做什么？或者直接告诉我你的星座'
        },
        question: question,
        timestamp: new Date().toISOString()
      });
    }
  });
}

/**
 * 使用AI增强解析调用MCP星座分析服务
 * 架构：AI理解问题 → 生成MCP参数 → 调用MCP服务
 */
async function callStarMCPStdioWithAI(question, session, aiResult) {
  return new Promise((resolve, reject) => {
    try {
      const sessionUuid = session[0]?.id || `session_${Date.now()}`;
      console.log('🚀 AI增强MCP星座分析服务:', {
        question: question.substring(0, 50) + '...',
        tool: aiResult.tool,
        confidence: aiResult.confidence,
        sessionId: sessionUuid,
        timestamp: new Date().toISOString()
      });

      // 启动MCP服务进程
      const mcpProcess = spawn('npx', ['star-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, 
          'Accept': 'application/json, text/event-stream',
          'Content-Type': 'application/json' 
        },
        shell: true
      });

      let responseData = '';
      let resultFound = false;
      let sessionId = sessionUuid;

      // 处理子进程输出
      mcpProcess.stdout.on('data', (data) => {
        const output = data.toString();
        responseData += output;
        
        // 解析stdio输出
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              console.log('📄 stdio解析:', parsed);
              
              // 处理初始化响应
              if (parsed.result && parsed.result.capabilities) {
                sessionId = `session_${Date.now()}`;
                console.log('✅ MCP会话初始化成功:', sessionId);
                
                // 发送工具调用请求
                setTimeout(() => {
                  const mcpParams = aiResult.arguments; // 使用AI解析的参数
                  console.log('🧠 AI解析参数:', mcpParams);
                  
                  let aiRequest;
                  
                  // 根据AI解析的工具类型构建请求
                  if (aiResult.tool === 'get_compatibility') {
                    aiRequest = {
                      jsonrpc: '2.0',
                      id: 2,
                      method: 'tools/call',
                      params: {
                        name: 'get_compatibility',
                        arguments: {
                          zodiac1: mcpParams.zodiac1,
                          zodiac2: mcpParams.zodiac2,
                          sessionId: sessionUuid
                        }
                      }
                    };
                  } else if (aiResult.tool === 'get_zodiac_by_date') {
                    aiRequest = {
                      jsonrpc: '2.0',
                      id: 2,
                      method: 'tools/call',
                      params: {
                        name: 'get_zodiac_by_date',
                        arguments: {
                          month: mcpParams.month,
                          day: mcpParams.day,
                          sessionId: sessionUuid
                        }
                      }
                    };
                  } else {
                    aiRequest = {
                      jsonrpc: '2.0',
                      id: 2,
                      method: 'tools/call',
                      params: {
                        name: 'get_daily_horoscope',
                        arguments: {
                          zodiac: mcpParams.zodiac,
                          category: mcpParams.category,
                          timeRange: mcpParams.timeRange,
                          source: 'ai_enhanced',
                          question: question,
                          context: session[0]?.context || [],
                          sessionId: sessionUuid,
                          date: new Date().toISOString().split('T')[0]
                        }
                      }
                    };
                  }
                  
                  console.log('🚀 发送AI增强请求:', {
                    question: question.substring(0, 50) + '...',
                    tool: aiResult.tool,
                    confidence: aiResult.confidence,
                    reasoning: aiResult.reasoning,
                    ...(aiResult.tool === 'get_compatibility' 
                      ? { zodiac1: mcpParams.zodiac1, zodiac2: mcpParams.zodiac2 }
                      : { zodiac: mcpParams.zodiac }),
                    category: mcpParams.category,
                    contextLength: (session[0]?.context || []).length
                  });
                  
                  mcpProcess.stdin.write(JSON.stringify(aiRequest) + '\n');
                }, 1000);
                
              } else if (parsed.result && parsed.result.content) {
                resultFound = true;
                
                // 提取星座信息并保存到上下文
                if (aiResult.extractedZodiac) {
                  aiParser.updateUserZodiac(sessionId, aiResult.extractedZodiac);
                  console.log(`🌟 已保存从MCP响应提取的星座: ${aiResult.extractedZodiac}`);
                }
                
                // 调试：查看MCP返回的完整内容
                console.log('🔍 MCP返回的完整内容:', JSON.stringify(parsed.result, null, 2));
                console.log('🔍 MCP content数组长度:', parsed.result.content ? parsed.result.content.length : 0);
                
                // 确保完整返回所有内容，不进行截断
                let fullAnswer = '';
                if (parsed.result.content && parsed.result.content.length > 0) {
                  // 如果有多个content元素，合并它们
                  fullAnswer = parsed.result.content.map(item => item.text || '').join('\n\n');
                } else {
                  // 如果没有content，尝试其他可能的字段
                  fullAnswer = parsed.result.text || parsed.result.message || JSON.stringify(parsed.result);
                }
                
                console.log('🔍 最终返回的答案长度:', fullAnswer.length);
                
                resolve({
                  success: true,
                  answer: fullAnswer,
                  metadata: {
                    analysisType: 'ai_enhanced_mcp_stdio',
                    source: 'jlankellii/star-mcp',
                    tool: aiResult.tool,
                    protocol: 'stdio',
                    sessionId: sessionId || 'unknown',
                    aiConfidence: aiResult.confidence,
                    aiReasoning: aiResult.reasoning,
                    parsedFrom: 'ai_enhanced_output',
                    question: question,
                    mcpContentLength: parsed.result.content ? parsed.result.content.length : 0,
                    mcpAnswerLength: fullAnswer.length
                  }
                });
                mcpProcess.kill();
                return;
              } else if (parsed.error) {
                resolve({
                  success: false,
                  error: 'MCP服务错误',
                  details: parsed.error.message,
                  metadata: {
                    analysisType: 'ai_enhanced_mcp_stdio_error',
                    source: 'jlankellii/star-mcp',
                    protocol: 'stdio',
                    aiConfidence: aiResult.confidence,
                    aiReasoning: aiResult.reasoning,
                    question: question
                  }
                });
                mcpProcess.kill();
                return;
              }
            } catch (e) {
              console.log('⚠️ stdio JSON解析失败:', e.message);
            }
          }
        }
      });

      mcpProcess.stderr.on('data', (data) => {
        console.error('❌ MCP stderr:', data.toString());
      });

      mcpProcess.on('close', (code) => {
        if (!resultFound) {
          resolve({
            success: false,
            error: 'MCP服务关闭',
            details: `进程退出码: ${code}`,
            metadata: {
              analysisType: 'ai_enhanced_mcp_stdio_close',
              source: 'jlankellii/star-mcp',
              protocol: 'stdio',
              exitCode: code,
              aiConfidence: aiResult.confidence,
              aiReasoning: aiResult.reasoning,
              question: question
            }
          });
        }
      });

      mcpProcess.on('error', (error) => {
        reject(error);
      });

      // 1. 初始化请求
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'ai-xingzuo', version: '1.0' }
        }
      };
      
      console.log('🔄 发送初始化请求:', initRequest);
      mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

      // 超时处理
      setTimeout(() => {
        if (!resultFound) {
          mcpProcess.kill();
          resolve({
            success: false,
            error: 'MCP请求超时',
            details: '15秒内未收到有效响应',
            metadata: {
              analysisType: 'ai_enhanced_mcp_stdio_timeout',
              source: 'jlankellii/star-mcp',
              protocol: 'stdio',
              timeout: 15000,
              aiConfidence: aiResult.confidence,
              aiReasoning: aiResult.reasoning,
              question: question
            }
          });
        }
      }, 15000);

    } catch (error) {
      console.error('❌ AI增强MCP stdio连接失败:', error.message);
      reject(error);
    }
  });
}

module.exports = router;