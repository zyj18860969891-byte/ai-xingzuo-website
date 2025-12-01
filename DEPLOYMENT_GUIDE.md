# 🚀 AI星座运势聊天小助手部署指南

## 项目结构

```
ai-xingzuo-website/
├── backend/           # 后端服务 (Node.js + Express)
├── frontend/          # 前端应用 (React + TypeScript + Vite)
├── services/          # 微服务
│   └── horoscope/     # 星座运势微服务
└── README.md
```

## 部署步骤

### 1. Railway 部署 (后端服务)

#### 准备工作
1. 注册 [Railway](https://railway.app) 账号
2. 安装 Railway CLI: `npm install -g @railway/cli`

#### 部署步骤
1. **创建项目**
   ```bash
   railway login
   railway init
   ```

2. **配置环境变量**
   在 Railway 仪表板中配置以下环境变量：
   ```
   PORT=3001
   HOROSCOPE_SERVICE_URL=http://localhost:3002
   HOROSCOPE_SERVICE_PORT=3002
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_MODEL=qwen/qwen3-235b-a22b-2507
   AI_TIMEOUT=15000
   STAR_MCP_URL=https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp
   STAR_MCP_TIMEOUT=15000
   ```

3. **部署后端服务**
   ```bash
   railway deploy
   ```

4. **获取后端URL**
   部署完成后，在 Railway 仪表板中获取后端服务的URL

### 2. Vercel 部署 (前端应用)

#### 准备工作
1. 注册 [Vercel](https://vercel.com) 账号
2. 安装 Vercel CLI: `npm install -g vercel`

#### 部署步骤
1. **构建前端**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **配置环境变量**
   在 Vercel 仪表板中配置：
   ```
   VITE_API_BASE_URL=your_backend_url
   ```

3. **部署前端**
   ```bash
   vercel
   ```

4. **获取前端URL**
   部署完成后，在 Vercel 仪表板中获取前端应用的URL

### 3. 服务配置

#### 后端服务配置
- **端口**: 3001
- **健康检查**: `/health`
- **API路径**: `/api/v1/horoscope/*`

#### 前端服务配置
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **环境变量**: `VITE_API_BASE_URL`

#### 微服务配置
- **端口**: 3002
- **健康检查**: `/health`
- **API路径**: `/api/v1/horoscope/*`

## 环境变量说明

### 后端服务
- `PORT`: 后端服务端口
- `HOROSCOPE_SERVICE_URL`: 星座微服务URL
- `HOROSCOPE_SERVICE_PORT`: 星座微服务端口

### 星座微服务
- `OPENROUTER_API_KEY`: OpenRouter API密钥
- `OPENROUTER_MODEL`: 使用的AI模型
- `AI_TIMEOUT`: AI请求超时时间
- `STAR_MCP_URL`: MCP服务URL
- `STAR_MCP_TIMEOUT`: MCP请求超时时间

### 前端应用
- `VITE_API_BASE_URL`: 后端API基础URL

## 健康检查

### 后端服务
```
GET /health
```

### 星座微服务
```
GET /api/v1/horoscope/health
```

## 常见问题

1. **CORS错误**: 确保前端和后端的域名都已添加到允许列表
2. **环境变量**: 确保所有必需的环境变量都已正确配置
3. **端口冲突**: 确保各服务使用不同的端口

## 项目特点

- ✅ 微服务架构
- ✅ AI增强解析
- ✅ MCP集成
- ✅ 聊天式交互
- ✅ 响应式设计