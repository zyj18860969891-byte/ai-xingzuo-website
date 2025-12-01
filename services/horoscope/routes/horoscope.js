/**
 * 🌟 星座运势数据路由
 * 提供星座信息和运势数据
 * 
 * @author: GitHub Copilot
 * @version: 1.0.0-alpha
 */

const express = require('express');
const axios = require('axios');
const { param, query, body, validationResult } = require('express-validator');
const router = express.Router();

// 导入星座数据和运势计算逻辑
const { getHoroscopeData, getDailyHoroscope, getWeeklyHoroscope, 
        getMonthlyHoroscope, getYearlyHoroscope, getHoroscopeAnalysis } = require('../services/horoscope');

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
 * 处理聊天分析请求 - 直接调用MCP服务
 */
router.post('/chat/analyze', [
  body('prompt').notEmpty().withMessage('提示词不能为空'),
  body('question').notEmpty().withMessage('问题不能为空'),
  body('session').isArray().withMessage('会话必须是数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '请求参数验证失败',
        details: errors.array()
      });
    }

    const { prompt, question, session } = req.body;
    
    // 直接调用MCP服务
    // 确保session有id，如果没有则创建一个
    if (!session.id) {
      session.id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const mcpResponse = await callStarMCPServer(question, session);
    
    // 直接返回MCP响应（成功或失败），前端处理
    res.json({
      ...mcpResponse,
      question: question,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP聊天分析失败:', error);
    res.json({
      success: false,
      error: '服务异常',
      details: error.message,
      question: req.body.question || '未知问题',
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
 * MCP会话管理器 - 根据DEPLOYMENT_COMPLETE_GUIDE.md实现
 */
class MCPSessionManager {
  constructor() {
    this.sessions = new Map(); // 内存存储会话
    this.defaultTimeout = 15000;
    // 从环境变量获取API密钥
    this.apiKey = process.env.MODELSCOPE_API_KEY || process.env.MCP_API_KEY || 'ms-bf1291c1-c1ed-464c-b8d8-162fdee96180';
    console.log('MCP会话管理器初始化:', { 
      apiKeyPresent: !!this.apiKey && this.apiKey !== 'your-api-token-here',
      defaultTimeout: this.defaultTimeout
    });
  }

  /**
   * 创建新的MCP会话
   */
  createSession() {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mcpSessionId = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session = {
      id: sessionId,
      mcpSessionId: mcpSessionId,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      context: [],
      isActive: false
    };
    
    this.sessions.set(sessionId, session);
    console.log('创建新的MCP会话:', { sessionId, mcpSessionId });
    return session;
  }

  /**
   * 获取会话
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastUsed = new Date().toISOString();
    }
    return session;
  }

  /**
   * 初始化MCP会话
   */
  async initializeMCPSession(session) {
    try {
      console.log('初始化MCP会话:', { 
        sessionId: session.id, 
        mcpSessionId: session.mcpSessionId 
      });

      // 首先尝试不带会话ID的初始化（根据错误提示，可能需要先建立连接）
      const initResponse = await axios.post(process.env.STAR_MCP_URL || 'https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp', 
        {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'ai-xingzuo', version: '1.0' }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'User-Agent': 'Mozilla/5.0 (compatible; StarMCPClient/1.0)',
            'Authorization': 'Bearer ' + this.apiKey
          },
          timeout: this.defaultTimeout,
          validateStatus: function (status) {
            return status < 500;
          }
        }
      );

      console.log('MCP会话初始化响应:', {
        status: initResponse.status,
        data: initResponse.data,
        headers: initResponse.headers
      });

      if (initResponse.status === 200 || initResponse.status === 201) {
        // 初始化成功，从响应头中获取服务器返回的会话ID
        const serverSessionId = initResponse.headers['mcp-session-id'];
        if (serverSessionId) {
          session.mcpSessionId = serverSessionId;
          console.log('✅ 从响应头获取到服务器会话ID:', serverSessionId);
        } else {
          // 如果没有从响应头获取到，则尝试从响应体获取
          const returnedSessionId = initResponse.data.sessionId || initResponse.data.mcpSessionId;
          if (returnedSessionId) {
            session.mcpSessionId = returnedSessionId;
          }
        }
        
        session.isActive = true;
        session.initializedAt = new Date().toISOString();
        session.capabilities = initResponse.data.capabilities || ['analyze'];
        
        console.log('MCP会话初始化成功:', {
          sessionId: session.id,
          mcpSessionId: session.mcpSessionId,
          capabilities: session.capabilities
        });
        
        return {
          success: true,
          mcpSessionId: session.mcpSessionId,
          capabilities: session.capabilities,
          message: 'MCP会话初始化成功'
        };
      } else {
        throw new Error('初始化失败: ' + initResponse.status + ' - ' + (initResponse.data.error || initResponse.data.message));
      }

    } catch (error) {
      console.error('MCP会话初始化失败:', error);
      session.isActive = false;
      
      return {
        success: false,
        error: 'MCP会话初始化失败',
        details: error.message
      };
    }
  }

  /**
   * 调用MCP分析服务
   */
  async callMCPServer(session, question, context) {
    try {
      console.log('调用MCP分析服务:', {
        sessionId: session.id,
        mcpSessionId: session.mcpSessionId,
        question: question.substring(0, 50) + '...',
        contextLength: context.length,
        timestamp: new Date().toISOString()
      });

      // 确保会话已初始化
      if (!session.isActive) {
        const initResult = await this.initializeMCPSession(session);
        if (!initResult.success) {
          throw new Error(initResult.details);
        }
      }

      // 构建请求上下文
      const requestContext = {
        question: question,
        conversation: context.slice(-5), // 最多保留5轮对话
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        mcpSessionId: session.mcpSessionId,
        capabilities: session.capabilities || ['analyze']
      };

      // 根据AI_FORTUNE_MCP_INTEGRATION_GUIDE.md的成功配置，使用JSON-RPC 2.0协议
      const mcpUrl = process.env.STAR_MCP_URL || process.env.BAZI_MCP_URL || 'https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp';
      
      // 生成唯一的请求ID
      const requestId = Date.now();
      
      // 直接调用星座行分析工具，使用JSON-RPC 2.0协议
      const response = await axios.post(mcpUrl, 
        {
          jsonrpc: '2.0',
          id: requestId,
          method: 'tools/call',
          params: {
            name: 'get_daily_horoscope',
            arguments: {
              zodiac: '狮子座',
              category: 'love',
              source: 'local'
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'User-Agent': 'Mozilla/5.0 (compatible; StarMCPClient/1.0)',
            'Authorization': 'Bearer ' + this.apiKey,
            'mcp-session-id': session.mcpSessionId
          },
          timeout: this.defaultTimeout,
          validateStatus: function (status) {
            return status < 500;
          }
        }
      );

      console.log('MCP分析响应:', {
        status: response.status,
        dataLength: response.data ? JSON.stringify(response.data).length : 0
      });

      // 处理JSON-RPC响应
      if (response.status === 200 || response.status === 201) {
        const result = response.data;
        
        // 检查JSON-RPC错误
        if (result.error) {
          throw new Error('MCP服务错误: ' + result.error.code + ' - ' + result.error.message);
        }
        
        // 处理成功响应
        const analysisResult = result.result || result;
        
        // 更新会话上下文
        session.context.push({
          role: 'user',
          content: question,
          timestamp: new Date().toISOString()
        });
        
        const answer = analysisResult.content || analysisResult.text || analysisResult.message || analysisResult.answer || JSON.stringify(analysisResult);
        
        session.context.push({
          role: 'assistant',
          content: answer,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          answer: answer,
          metadata: {
            analysisType: 'mcp',
            confidence: analysisResult.confidence || 0.85,
            timestamp: new Date().toISOString(),
            source: 'zoieJ49/star-mcp',
            status: response.status,
            mcpSessionId: session.mcpSessionId,
            sessionId: session.id,
            contextLength: session.context.length
          }
        };
      } else {
        throw new Error('MCP分析失败: ' + response.status + ' - ' + (response.data.error || response.data.message));
      }

    } catch (error) {
      console.error('MCP分析调用失败:', error);
      
      // 网络错误处理
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('MCP星座行服务连接失败');
      }
      
      // HTTP错误处理
      if (error.response) {
        throw new Error('MCP服务错误: ' + error.response.status + ' ' + error.response.statusText + ' - ' + (error.response.data.error || error.response.data.message));
      }
      
      // 其他错误
      throw error;
    }
  }
}

// 创建全局会话管理器实例
const mcpSessionManager = new MCPSessionManager();

/**
 * 调用MCP星座分析服务 - 真实MCP连接，无fallback
 */
async function callStarMCPServer(question, session) {
  try {
    console.log('🚀 MCP星座分析服务 (真实连接):', {
      question: question.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });

    // 使用真实的MCP会话管理器
    let mcpSession = mcpSessionManager.getSession(session.id);
    if (!mcpSession) {
      console.log('创建新的MCP会话:', session.id);
      mcpSession = mcpSessionManager.createSession();
      // 更新传入的session对象
      session.id = mcpSession.id;
      session.mcpSessionId = mcpSession.mcpSessionId;
    }

    // 调用真实的MCP分析服务
    const mcpResponse = await mcpSessionManager.callMCPServer(mcpSession, question, session.context || []);
    
    if (!mcpResponse.success) {
      throw new Error(mcpResponse.error || 'MCP分析失败');
    }

    return {
      success: true,
      answer: mcpResponse.answer,
      metadata: {
        analysisType: 'mcp_real',
        confidence: mcpResponse.metadata?.confidence || 0.85,
        timestamp: new Date().toISOString(),
        source: 'zoieJ49/star-mcp',
        mcpSessionId: mcpResponse.metadata?.mcpSessionId,
        sessionId: session.id
      }
    };

  } catch (error) {
    console.error('❌ MCP真实连接失败:', error.message);
    throw error; // 直接抛出错误，不使用fallback
  }
}

module.exports = router;