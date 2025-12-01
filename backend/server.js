/**
 * 🌟 AI星座网站后端网关
 * 微服务API网关和路由分发中心
 * 
 * 功能:
 * - 统一API入口
 * - 路由分发到各微服务
 * - 统一认证和授权
 * - 错误处理和日志
 * - 服务健康检查
 * - 请求限流
 * 
 * @author: GitHub Copilot
 * @version: 1.0.0-alpha
 * @lastUpdate: 2025-11-28
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// 加载环境变量
dotenv.config();

// 导入路由
const healthRoutes = require('./routes/health');
const horoscopeRoutes = require('./routes/horoscope');
const chatRoutes = require('./routes/chat');

// 注释掉不存在的路由
// const zodiacRoutes = require('./routes/zodiac');
// const compatibilityRoutes = require('./routes/compatibility');
// const aiRoutes = require('./routes/ai');

// 配置日志
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'gateway' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// 应用配置
const app = express();
const PORT = process.env.GATEWAY_PORT || process.env.PORT || 3001;

// 服务配置
const SERVICES = {
  horoscope: process.env.HOROSCOPE_SERVICE_URL || `http://localhost:${process.env.HOROSCOPE_SERVICE_PORT || 3002}`,
  
  // 注释掉不存在的服务
  // zodiac: process.env.ZODIAC_SERVICE_URL || `http://localhost:${process.env.ZODIAC_SERVICE_PORT || 3003}`,
  // compatibility: process.env.COMPATIBILITY_SERVICE_URL || `http://localhost:${process.env.COMPATIBILITY_SERVICE_PORT || 3004}`,
  // ai: process.env.AI_SERVICE_URL || `http://localhost:${process.env.AI_SERVICE_PORT || 3005}`,
};

// 中间件配置
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求ID中间件
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 健康检查中间件
app.use('/health', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 服务健康检查端点
app.get('/health/services', async (req, res) => {
  try {
    const healthChecks = {};
    
    for (const [serviceName, serviceUrl] of Object.entries(SERVICES)) {
      try {
        const response = await fetch(`${serviceUrl}/health`);
        healthChecks[serviceName] = {
          status: response.ok ? 'healthy' : 'unhealthy',
          url: serviceUrl,
          responseTime: response.headers.get('x-response-time') || 'unknown'
        };
      } catch (error) {
        healthChecks[serviceName] = {
          status: 'error',
          url: serviceUrl,
          error: error.message
        };
      }
    }
    
    const overallStatus = Object.values(healthChecks).every(check => 
      check.status === 'healthy'
    ) ? 'all_services_healthy' : 'some_services_unhealthy';
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      overallStatus,
      services: healthChecks
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: '健康检查失败',
      error: error.message
    });
  }
});

// API版本控制中间件
app.use('/api/v1', (req, res, next) => {
  res.setHeader('X-API-Version', '1.0.0');
  next();
});

// 路由配置
app.use('/health', healthRoutes);
app.use('/api/v1/horoscope', horoscopeRoutes);

// 添加聊天API路由
app.use('/api/v1/horoscope/chat', chatRoutes);

// 根路径重定向到健康检查
app.get('/', (req, res) => {
  res.redirect('/health');
});

// 404处理
app.use('*', (req, res) => {
  logger.warn(`404 - 路径未找到: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: '路径未找到',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  logger.error('未处理的错误:', error);
  
  // 不要在生产环境中暴露内部错误详情
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: error.message || '服务器内部错误',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  logger.info(`🌟 AI星座网站网关启动成功 🚀`);
  logger.info(`📡 服务地址: http://localhost:${PORT}`);
  logger.info(`📚 API文档: http://localhost:${PORT}/api/v1/docs`);
  logger.info(`💚 健康检查: http://localhost:${PORT}/health`);
  logger.info(`🔗 服务配置:`, SERVICES);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM信号接收，正在关闭服务器...');
  server.close(() => {
    logger.info('服务器已安全关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT信号接收，正在关闭服务器...');
  server.close(() => {
    logger.info('服务器已安全关闭');
    process.exit(0);
  });
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

module.exports = app;