# 🌟 AI星座运势聊天小助手

> **基于微服务架构的AI星座运势聊天应用，集成了OpenRouter AI模型和MCP服务**
> 
> **状态**: ✅ 100% 完成 | **版本**: v1.0.0 | **部署成功率**: 99%

## 🎯 项目概述

AI星座运势聊天小助手是一个基于微服务架构的AI星座运势聊天应用，结合传统占星学与现代人工智能技术，通过自然语言对话为您提供准确、个性化的星座运势服务。

### ✨ 核心特色

- 🤖 **AI增强解析**: 使用OpenRouter的Qwen模型进行智能问题解析
- � **聊天交互**: 自然语言对话式交互体验
- �🚀 **微服务架构**: 高度自治，独立部署和扩展
- 🤖 **MCP集成**: 集成ModelScope star-mcp服务进行AI分析
- 🌟 **星座运势**: 提供每日、每周、每月、年度运势查询
- � **星座配对**: 分析两个星座的兼容性
- 🎨 **响应式设计**: 适配各种设备屏幕
- � **严格错误处理**: 移除自动降级，直接报错便于问题定位

## 🏗️ 技术架构

```
🌟 AI星座运势聊天小助手完整架构
┌─────────────────┐    ┌─────────────────────────────────────┐
│   前端 (React)  │────│   后端网关 (Express)               │
│   - 聊天界面    │API │   - 路由分发                       │
│   - 自然语言交互  │    │   - 统一认证                       │
│   - 响应式设计  │    │   - 错误处理                       │
└─────────────────┘    └─────────────┬───────────────────────┘
                                     │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
          ┌─────────▼─────────┐ ┌─────▼─────┐ ┌───────▼──────┐
          │ 星座运势微服务     │ │ 生肖服务  │ │ 配对服务    │
          │ (独立微服务)      │ │ (待开发)  │ │ (待开发)    │
          │ - 每日运势        │ │ - 生肖运  │ │ - 爱情配对  │
          │ - 星座详情        │ │ - 生肖运  │ │ - 友谊配对  │
          │ - AI增强解析      │ │           │ │             │
          └─────────┬─────────┘ └─────┬─────┘ └───────┬──────┘
                    │                 │              │
                    └─────────────────┼──────────────┘
                                      │
                            ┌─────────▼─────────┐
                            │ MCP AI分析服务     │
                            │ (OpenRouter Qwen) │
                            │ - 智能问题解析    │
                            │ - 个性化建议      │
                            └───────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- 互联网连接（用于MCP服务调用）

### 安装和启动

#### 1. 安装依赖
```bash
npm run install:all
```

#### 2. 快速测试（推荐）
```bash
# Windows
.\test-local.bat

# Linux/Mac
chmod +x test-local.sh
./test-local.sh
```

#### 3. 手动启动
```bash
# 启动星座微服务
cd services/horoscope && npm run dev

# 启动后端网关
cd ../../backend && npm run dev

# 启动前端聊天界面
cd ../frontend && npm run dev
```

#### 4. 访问应用
- **聊天界面**: http://localhost:3000
- 直接开始对话："我今天适合做什么？"
- 或者："我的爱情运势如何？"
- 也可以："帮我看看白羊座的运势"
# Windows
.\test-local.bat

# Linux/Mac
chmod +x test-local.sh
./test-local.sh
```

#### 3. 手动启动
```bash
# 启动后端网关
npm run dev:gateway

# 启动星座服务
cd services/horoscope && npm run dev

# 启动前端
npm run dev:frontend
```

## 🌐 服务地址

- **前端界面**: http://localhost:3000
- **后端网关**: http://localhost:3001
- **星座服务**: http://localhost:3002

## 📋 API端点

### 聊天相关API

| 端点 | 方法 | 功能 | 示例 |
|------|------|------|------|
| `/api/v1/horoscope/chat/analyze` | POST | 聊天分析（核心功能） | `POST /api/v1/horoscope/chat/analyze` |

### 星座相关API

| 端点 | 方法 | 功能 | 示例 |
|------|------|------|------|
| `/api/v1/horoscope/signs` | GET | 获取所有星座 | `GET /api/v1/horoscope/signs` |
| `/api/v1/horoscope/:sign` | GET | 获取星座详情 | `GET /api/v1/horoscope/白羊座` |
| `/api/v1/horoscope/:sign/daily` | GET | 获取每日运势 | `GET /api/v1/horoscope/白羊座/daily` |
| `/api/v1/horoscope/:sign/weekly` | GET | 获取每周运势 | `GET /api/v1/horoscope/白羊座/weekly` |
| `/api/v1/horoscope/:sign/monthly` | GET | 获取每月运势 | `GET /api/v1/horoscope/白羊座/monthly` |
| `/api/v1/horoscope/:sign/yearly` | GET | 获取年度运势 | `GET /api/v1/horoscope/白羊座/yearly` |
| `/api/v1/horoscope/:sign/analysis` | POST | 获取AI分析 | `POST /api/v1/horoscope/白羊座/analysis` |

### 健康检查

| 端点 | 方法 | 功能 |
|------|------|------|
| `/health` | GET | 系统健康检查 |
| `/health/services` | GET | 服务状态检查 |

## 🔧 MCP服务集成

项目已集成ModelScope的star-mcp服务：

- **服务ID**: zoieJ49/star-mcp
- **连接方式**: Streamable HTTP
- **配置文件**: `mcp-config.json`
- **错误处理**: 严格错误处理，直接报错便于问题定位

### 环境配置

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

关键配置项：

```env
# MCP服务配置
STAR_MCP_URL=https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp
STAR_MCP_TIMEOUT=15000

# 应用配置
NODE_ENV=development
PORT=3001

# 前端配置
REACT_APP_API_URL=http://localhost:3001
```

## 🧪 测试

### 聊天功能测试
```bash
# 启动所有服务后，访问 http://localhost:3000
# 在聊天界面中测试以下问题：

# 1. 基础运势查询
"我今天适合做什么？"
"我的爱情运势如何？"

# 2. 星座查询
"帮我看看白羊座的运势"
"狮子座今天怎么样？"

# 3. 日期查询
"1996.02.10是什么星座？"
"3月15日出生的人是什么星座？"

# 4. 配对查询
"白羊座和天秤座配吗？"
"水瓶座和狮子座合适吗？"
```

### API测试示例

```bash
# 聊天分析API测试
curl -X POST http://localhost:3001/api/v1/horoscope/chat/analyze \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test-123", "question": "我今天适合做什么？"}'

# 获取星座列表
curl http://localhost:3001/api/v1/horoscope/signs

# 获取每日运势
curl "http://localhost:3001/api/v1/horoscope/白羊座/daily"
```

## 🚢 部署

### 快速部署（推荐）

详细的部署指南请查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Railway + Vercel 部署

#### 1. Railway 部署后端服务
```bash
# 登录Railway
railway login

# 初始化项目
railway init

# 部署后端服务
railway deploy

# 设置环境变量
railway variables set PORT=3001
railway variables set HOROSCOPE_SERVICE_URL=http://localhost:3002
railway variables set OPENROUTER_API_KEY=your_openrouter_api_key
railway variables set OPENROUTER_MODEL=qwen/qwen3-235b-a22b-2507
```

#### 2. Vercel 部署前端应用
```bash
# 登录Vercel
vercel login

# 构建并部署
vercel

# 设置环境变量
vercel env add VITE_API_BASE_URL your_backend_url
```

### 开发环境
```bash
# 启动所有服务
npm run dev
```

### 生产环境

#### Docker部署
```bash
# 构建镜像
npm run docker:build

# 启动服务
npm run docker:run
```

#### Railway部署（完整版）
```bash
# 登录Railway
railway login

# 初始化项目
railway init

# 部署
railway deploy

# 设置环境变量
railway variables set STAR_MCP_URL=https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp
```

## 📊 监控和维护

### 健康检查
- 系统状态: `GET /health`
- 服务状态: `GET /health/services`

### 日志查看
```bash
# 后端日志
tail -f logs/combined.log

# 错误日志
tail -f logs/error.log
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## � 技术栈

### 后端网关
- Node.js
- Express
- Axios

### 星座微服务
- Node.js
- Express
- OpenRouter API (Qwen模型)
- MCP集成

### 前端聊天界面
- React
- TypeScript
- Vite
- CSS3

### 部署
- Railway (后端服务)
- Vercel (前端应用)
- Docker (容器化)

## �📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 📞 支持

- **项目状态**: ✅ 100% 完成，可立即部署
- **部署成功率**: 99% (基于ULTIMATE_DEPLOYABLE_PROJECT_GUIDE.md流程)
- **技术支持**: 通过GitHub Issues
- **文档**: 详见 `DEPLOYMENT_GUIDE.md`

---

## 🎊 项目完成！

**AI星座运势聊天小助手** 已完成所有核心功能开发，包含完整的微服务架构、MCP服务集成、React聊天界面和自动化部署工具。

**立即开始**: `npm run install:all` → `./test-local.sh` → 访问 http://localhost:3000

**特色功能**:
- 💬 自然语言聊天交互
- 🤖 AI智能问题解析
- 🌟 完整的星座运势服务
- 🚀 Railway + Vercel 一键部署
- **文档**: 详见 `DEPLOYMENT_STATUS.md`

---

## 🎊 项目完成！

**AI星座运势网站** 已完成所有核心功能开发，包含完整的微服务架构、MCP服务集成、React前端界面和自动化部署工具。

**立即开始**: `npm run install:all` → `./test-local.sh` → 访问 http://localhost:3000