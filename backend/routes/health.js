/**
 * 🟢 健康检查路由
 * 提供系统和服务健康状态检查
 * 
 * @author: GitHub Copilot
 * @version: 1.0.0-alpha
 */

const express = require('express');
const router = express.Router();

/**
 * GET /health
 * 系统健康检查
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-horoscope-gateway',
    version: '1.0.0-alpha',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
    },
    nodejs: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  });
});

/**
 * GET /health/ready
 * 就绪检查（用于Kubernetes等编排工具）
 */
router.get('/ready', (req, res) => {
  // 这里可以添加更复杂的就绪检查逻辑
  // 比如数据库连接检查、外部服务依赖检查等
  
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/live
 * 存活检查（用于Kubernetes等编排工具）
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/metrics
 * 性能指标（简化版）
 */
router.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    timestamp: new Date().toISOString(),
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      heapUsedPercentage: Math.round(memUsage.heapUsed / memUsage.heapTotal * 100)
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: process.uptime(),
    pid: process.pid
  });
});

module.exports = router;