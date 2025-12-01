# Railway 部署指南

## 概述

本项目采用单容器部署架构，将所有微服务一起部署到 Railway 平台上。

## 部署架构

### 单容器部署
- **容器类型**: Docker 容器
- **基础镜像**: node:18-alpine
- **启动命令**: `npm run start-services`
- **端口**: 8080 (Railway统一端口)

### 服务组成
```
Railway Container
├── Gateway Service (backend)
│   ├── 端口: 8080 (对外)
│   ├── 启动: npm start
│   └── 功能: API 网关、路由、负载均衡
└── Horoscope Service (services/horoscope)
    ├── 端口: 3002 (容器内)
    ├── 启动: npm run start-mcp
    └── 功能: 星座运势服务
```

### 服务启动流程
```bash
npm run start-services
```
这会同时运行：
- `npm start` - 启动 Gateway 服务
- `npm run start-mcp` - 启动 Horoscope 服务

## 配置文件

### 1. railway.toml
已创建，包含：
- 构建配置
- 部署配置
- 环境变量
- 健康检查

### 2. Dockerfile
已创建，包含：
- Node.js 18 Alpine 基础镜像
- 安装 concurrently
- 复制代码和依赖
- 暴露端口 8080
- 启动命令

### 3. package.json
已更新：
- 添加 `start-services` 脚本
- 添加 `start-mcp` 脚本
- 安装 `concurrently` 依赖

## 服务详情

### 1. Gateway 服务 (backend/server.js)
```javascript
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.js';
import chatRoutes from './routes/chat.js';
import horoscopeRoutes from './routes/horoscope.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 路由
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/horoscope', horoscopeRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Gateway 服务启动在端口 ${PORT}`);
});
```

### 2. Horoscope 服务 (services/horoscope/server.js)
```javascript
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import horoscopeRoutes from './routes/horoscope.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.HOROSCOPE_SERVICE_PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 路由
app.use('/api/horoscope', horoscopeRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Horoscope 服务启动在端口 ${PORT}`);
});
```

## 环境变量配置

### 生产环境变量
```bash
NODE_ENV=production
PORT=8080
GATEWAY_PORT=8080
HOROSCOPE_SERVICE_PORT=3002
ZODIAC_SERVICE_PORT=3003
COMPATIBILITY_SERVICE_PORT=3004
AI_SERVICE_PORT=3005
MODELSCOPE_API_KEY=your-api-key-here
MODELSCOPE_MODEL=Qwen/Qwen3-235B-Instruct-2507
MODELSCOPE_BASE_URL=https://api-inference.modelscope.cn/v1
HOROSCOPE_MCP_URL=http://localhost:3002
ZODIAC_MCP_URL=http://localhost:3003
COMPATIBILITY_MCP_URL=http://localhost:3004
AI_MCP_URL=http://localhost:3005
HOROSCOPE_MCP_TIMEOUT=15000
ZODIAC_MCP_TIMEOUT=15000
COMPATIBILITY_MCP_TIMEOUT=15000
AI_MCP_TIMEOUT=15000
HOROSCOPE_LANGUAGE=zh
HOROSCOPE_CACHE_ENABLED=true
HOROSCOPE_SESSION_TIMEOUT=3600000
HOROSCOPE_READING_TYPE=single
TRANSLATION_API_ENABLED=true
LIBRE_TRANSLATE_URL=https://libretranslate.de/translate
GOOGLE_TRANSLATE_URL=https://translate.googleapis.com/translate_a/single
```

## 优势

1. **简化部署**：只需要部署一个容器
2. **服务发现**：服务在同一容器内，通过 localhost 通信
3. **资源优化**：共享容器资源
4. **快速启动**：使用 concurrently 同时启动多个服务

## 部署步骤

### 1. 提交代码到 GitHub
```bash
git add .
git commit -m "feat: 添加 Railway 部署配置"
git push origin main
```

### 2. 连接 Railway 项目
1. 访问 [Railway.app](https://railway.app)
2. 点击 "Deploy from GitHub"
3. 选择 `ai-xingzuo-website` 仓库
4. Railway 会自动检测到 `Dockerfile` 和 `railway.toml`

### 3. 配置环境变量
在 Railway 控制台中：
1. 进入项目设置
2. 添加环境变量
3. 配置 ModelScope API Key 等

### 4. 启动服务
Railway 会自动：
1. 构建 Docker 镜像
2. 部署容器
3. 启动服务

## 监控与维护

### 健康检查
- **路径**: `/health`
- **超时**: 60 秒
- **间隔**: 15 秒
- **不健康阈值**: 2 次

### 日志查看
- Railway 控制台提供实时日志
- 可以查看 Gateway 和 Horoscope 服务的日志

### 重启策略
- **类型**: ON_FAILURE
- **最大重试次数**: 3 次

## 未来优化建议

1. **分离部署**：将MCP和后端服务分别部署
2. **负载均衡**：为高流量服务添加负载均衡
3. **监控告警**：添加Prometheus监控和Grafana仪表板
4. **日志聚合**：使用ELK或类似方案进行日志管理
5. **容器编排**：考虑使用Kubernetes进行更复杂的编排

## 故障排除

### 常见问题
1. **服务启动失败**：检查日志确认错误
2. **端口冲突**：确保服务使用不同端口
3. **环境变量缺失**：检查 Railway 环境变量配置
4. **依赖问题**：确保所有依赖正确安装

### 调试步骤
1. 查看 Railway 控制台日志
2. 检查容器启动状态
3. 验证环境变量配置
4. 测试服务间通信