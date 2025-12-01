/**
 * 🌟 星座聊天路由
 * 基于ULTIMATE_DEPLOYABLE_PROJECT_GUIDE.md的对话式交互方式
 * 
 * 功能:
 * - 创建聊天会话
 * - 处理用户问题
 * - 返回AI分析结果
 * 
 * @author: GitHub Copilot
 * @version: 1.0.0-alpha
 */

const express = require('express');
const axios = require('axios');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();

// 服务配置
const HOROSCOPE_SERVICE_URL = process.env.HOROSCOPE_SERVICE_URL || 
  `http://localhost:${process.env.HOROSCOPE_SERVICE_PORT || 3002}`;

// 会话存储 (简单内存存储，生产环境建议使用Redis)
const sessions = new Map();

/**
 * POST /api/v1/horoscope/chat/session
 * 创建新的聊天会话
 */
router.post('/session', async (req, res) => {
  try {
    const sessionId = require('crypto').randomUUID();
    const timestamp = new Date().toISOString();
    
    // 初始化会话
    sessions.set(sessionId, {
      createdAt: timestamp,
      lastActivity: timestamp,
      messages: [],
      userContext: {}
    });

    // 设置过期时间 (1小时)
    setTimeout(() => {
      sessions.delete(sessionId);
    }, 60 * 60 * 1000);

    res.json({
      sessionId,
      message: '会话创建成功',
      timestamp
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({
      error: '创建会话失败',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/horoscope/chat/analyze
 * 处理用户问题并返回AI分析
 */
router.post('/analyze', [
  body('sessionId').isUUID().withMessage('无效的会话ID'),
  body('question').isLength({ min: 1, max: 500 }).withMessage('问题长度应在1-500字符之间'),
  body('timestamp').optional().isISO8601().withMessage('无效的时间格式')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '请求参数验证失败',
        details: errors.array()
      });
    }

    const { sessionId, question, timestamp } = req.body;
    
    // 检查会话是否存在
    if (!sessions.has(sessionId)) {
      return res.status(404).json({
        error: '会话不存在或已过期'
      });
    }

    const session = sessions.get(sessionId);
    session.lastActivity = timestamp || new Date().toISOString();
    
    // 添加用户消息到会话
    session.messages.push({
      role: 'user',
      content: question,
      timestamp: session.lastActivity
    });

    // 构建AI提示词
    const prompt = buildChatPrompt(question, session.messages);
    
    // 调用星座服务获取AI分析
    const response = await axios.post(`${HOROSCOPE_SERVICE_URL}/api/v1/horoscope/chat/analyze`, {
      question,
      sessionId: sessionId
    }, {
      timeout: 15000
    });

    const answer = response.data.answer || response.data.analysis;
    const metadata = response.data.metadata || {};
    
    // 添加AI回复到会话
    session.messages.push({
      role: 'assistant',
      content: answer,
      timestamp: new Date().toISOString(),
      metadata
    });

    res.json({
      answer,
      metadata,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('处理聊天请求失败:', error);
    
    // 返回友好的错误消息
    const errorMessage = "抱歉，我现在无法处理你的星座问题。请稍后再试或尝试其他问题。";
    
    res.status(error.response?.status || 500).json({
      error: '聊天服务暂时不可用',
      answer: errorMessage,
      metadata: {
        type: 'error',
        suggestion: '你可以尝试问：我今天适合做什么？或者直接告诉我你的星座'
      }
    });
  }
});

/**
 * GET /api/v1/horoscope/chat/session/:sessionId
 * 获取会话信息
 */
router.get('/session/:sessionId', [
  param('sessionId').isUUID().withMessage('无效的会话ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '请求参数验证失败',
        details: errors.array()
      });
    }

    const { sessionId } = req.params;
    
    if (!sessions.has(sessionId)) {
      return res.status(404).json({
        error: '会话不存在或已过期'
      });
    }

    const session = sessions.get(sessionId);
    
    res.json({
      sessionId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      messageCount: session.messages.length,
      messages: session.messages
    });

  } catch (error) {
    console.error('获取会话信息失败:', error);
    res.status(500).json({
      error: '获取会话信息失败',
      message: error.message
    });
  }
});



module.exports = router;