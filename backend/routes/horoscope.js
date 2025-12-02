/**
 * 🌟 星座运势路由
 * 处理星座相关的API请求，代理到星座微服务
 * 
 * @author: GitHub Copilot
 * @version: 1.0.0-alpha
 */

const express = require('express');
const axios = require('axios');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

// 服务配置
const HOROSCOPE_SERVICE_URL = process.env.HOROSCOPE_SERVICE_URL || 
  `http://localhost:${process.env.HOROSCOPE_SERVICE_PORT || 8080}`;

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
router.get('/signs', async (req, res) => {
  try {
    const response = await axios.get(`${SERVICE_URL}/api/v1/horoscope/signs`, {
      timeout: 10000,
      headers: {
        'X-Request-ID': req.id || 'unknown'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('获取星座列表失败:', error.message);
    res.status(error.response?.status || 500).json({
      error: '获取星座列表失败',
      message: error.message
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
  async (req, res) => {
    try {
      const { sign } = req.params;
      
      const response = await axios.get(`${SERVICE_URL}/api/v1/horoscope/${sign}`, {
        timeout: 10000,
        headers: {
          'X-Request-ID': req.id || 'unknown'
        }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} 信息失败:`, error.message);
      res.status(error.response?.status || 500).json({
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
  async (req, res) => {
    try {
      const { sign } = req.params;
      const { date } = req.query;
      
      const params = {};
      if (date) params.date = date;
      
      const response = await axios.get(`${SERVICE_URL}/api/v1/horoscope/${sign}/daily`, {
        timeout: 15000,
        params,
        headers: {
          'X-Request-ID': req.id || 'unknown'
        }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} 每日运势失败:`, error.message);
      res.status(error.response?.status || 500).json({
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
  validateRequest,
  async (req, res) => {
    try {
      const { sign } = req.params;
      const { week } = req.query;
      
      const params = {};
      if (week) params.week = week;
      
      const response = await axios.get(`${SERVICE_URL}/api/v1/horoscope/${sign}/weekly`, {
        timeout: 15000,
        params,
        headers: {
          'X-Request-ID': req.id || 'unknown'
        }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} 每周运势失败:`, error.message);
      res.status(error.response?.status || 500).json({
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
  async (req, res) => {
    try {
      const { sign } = req.params;
      const { month, year } = req.query;
      
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      
      const response = await axios.get(`${SERVICE_URL}/api/v1/horoscope/${sign}/monthly`, {
        timeout: 15000,
        params,
        headers: {
          'X-Request-ID': req.id || 'unknown'
        }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} 每月运势失败:`, error.message);
      res.status(error.response?.status || 500).json({
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
  async (req, res) => {
    try {
      const { sign } = req.params;
      const { year } = req.query;
      
      const params = {};
      if (year) params.year = year;
      
      const response = await axios.get(`${SERVICE_URL}/api/v1/horoscope/${sign}/yearly`, {
        timeout: 20000,
        params,
        headers: {
          'X-Request-ID': req.id || 'unknown'
        }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} 年度运势失败:`, error.message);
      res.status(error.response?.status || 500).json({
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
  async (req, res) => {
    try {
      const { sign } = req.params;
      const { question, birthInfo } = req.body;
      
      const requestData = {};
      if (question) requestData.question = question;
      if (birthInfo) requestData.birthInfo = birthInfo;
      
      const response = await axios.post(`${SERVICE_URL}/api/v1/horoscope/${sign}/analysis`, requestData, {
        timeout: 30000,
        headers: {
          'X-Request-ID': req.id || 'unknown',
          'Content-Type': 'application/json'
        }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error(`获取星座 ${req.params.sign} AI分析失败:`, error.message);
      res.status(error.response?.status || 500).json({
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
  async (req, res) => {
    try {
      const { sign1, sign2 } = req.params;
      
      const response = await axios.get(`${SERVICE_URL}/api/v1/horoscope/compatibility/${sign1}/${sign2}`, {
        timeout: 20000,
        headers: {
          'X-Request-ID': req.id || 'unknown'
        }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error(`获取星座 ${sign1} 和 ${sign2} 兼容性分析失败:`, error.message);
      res.status(error.response?.status || 500).json({
        error: '获取星座兼容性分析失败',
        sign1: req.params.sign1,
        sign2: req.params.sign2,
        message: error.message
      });
    }
  }
);

/**
 * POST /api/v1/horoscope/chat/analyze
 * 处理聊天分析请求，代理到星座微服务
 */
router.post('/chat/analyze', [
  body('sessionId').isUUID().withMessage('无效的会话ID'),
  body('question').isLength({ min: 1, max: 500 }).withMessage('问题长度应在1-500字符之间'),
  body('timestamp').optional().isISO8601().withMessage('无效的时间格式')
], validateRequest, async (req, res) => {
  try {
    const { sessionId, question, timestamp } = req.body;
    
    console.log('🔄 网关转发聊天分析请求:', {
      sessionId: sessionId.substring(0, 8) + '...',
      question: question.substring(0, 50) + '...',
      timestamp
    });
    
    const response = await axios.post(`${SERVICE_URL}/api/v1/horoscope/chat/analyze`, {
      sessionId,
      question,
      timestamp
    }, {
      timeout: 30000,
      headers: {
        'X-Request-ID': req.id || 'unknown',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 网关收到星座服务响应:', {
      status: response.status,
      hasAnswer: !!response.data.answer,
      hasType: !!response.data.type,
      dataType: response.data.type || 'unknown'
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ 网关转发聊天分析请求失败:', error.message);
    
    const status = error.response?.status || 500;
    const responseData = {
      error: '聊天分析服务暂时不可用',
      answer: '抱歉，我现在无法处理你的星座问题。请稍后再试或尝试其他问题。',
      metadata: {
        type: 'error',
        suggestion: '你可以尝试问：我今天适合做什么？或者直接告诉我你的星座'
      }
    };
    
    res.status(status).json(responseData);
  }
});

module.exports = router;