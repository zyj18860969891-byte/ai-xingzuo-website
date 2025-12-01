/**
 * 🌟 星座运势微服务
 * 独立的星座数据和运势计算服务
 * 
 * 功能:
 * - 星座基本信息管理
 * - 每日/每周/每月/每年运势计算
 * - 星座特征分析
 * - 运势数据缓存
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
const dotenv = require('dotenv');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

// 加载环境变量
dotenv.config();

// 导入路由
const horoscopeRoutes = require('./routes/horoscope_stdio');

// 注释掉不存在的路由
// const healthRoutes = require('./routes/health');

// 配置日志
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'horoscope-service' },
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
const PORT = process.env.PORT || process.env.HOROSCOPE_SERVICE_PORT || 3002;

// 中间件配置
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors());
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

// 路由配置
app.use('/api/v1/horoscope', horoscopeRoutes);

// 注释掉不存在的路由
// app.use('/health', healthRoutes);

// 根路径重定向到API文档
app.get('/', (req, res) => {
  res.redirect('/api/v1/horoscope/signs');
});

// 404处理
app.use('*', (req, res) => {
  logger.warn(`404 - 路径未找到: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: '路径未找到',
    service: 'horoscope-service',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  logger.error('未处理的错误:', error);
  
  res.status(error.status || 500).json({
    error: error.message || '服务器内部错误',
    service: 'horoscope-service',
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  logger.info(`🌟 星座运势微服务启动成功 🚀`);
  logger.info(`📡 服务地址: http://localhost:${PORT}`);
  logger.info(`💚 健康检查: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM信号接收，正在关闭星座服务...');
  server.close(() => {
    logger.info('星座服务已安全关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT信号接收，正在关闭星座服务...');
  server.close(() => {
    logger.info('星座服务已安全关闭');
    process.exit(0);
  });
});

module.exports = app;