# Railway 环境变量配置指南

## 概述

本文档详细说明在 Railway 上部署 AI 星座网站所需的环境变量配置。

## 环境变量列表

### 1. 基础配置

```bash
NODE_ENV=production
PORT=8080
GATEWAY_PORT=3001
HOROSCOPE_SERVICE_PORT=8080
```

### 2. AI 服务配置

#### OpenRouter API (用于 AI 增强解析)
```bash
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=qwen/qwen3-235b-a22b-2507
AI_TIMEOUT=15000
```

#### ModelScope API (备用 AI 服务)
```bash
MODELSCOPE_API_KEY=your-api-key-here
MODELSCOPE_MODEL=Qwen/Qwen3-235B-Instruct-2507
MODELSCOPE_BASE_URL=https://api-inference.modelscope.cn/v1
```

### 3. MCP 服务配置

#### Star MCP 服务
```bash
STAR_MCP_URL=https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp
MCP_API_KEY=ms-bf1291c1-c1ed-464c-b8d8-162fdee96180
```

### 4. 服务间通信配置

```bash
HOROSCOPE_SERVICE_URL=http://localhost:8080
HOROSCOPE_MCP_URL=http://localhost:8080
HOROSCOPE_MCP_TIMEOUT=15000
HOROSCOPE_LANGUAGE=zh
HOROSCOPE_CACHE_ENABLED=true
HOROSCOPE_SESSION_TIMEOUT=3600000
HOROSCOPE_READING_TYPE=single
```

### 5. 翻译服务配置

```bash
TRANSLATION_API_ENABLED=true
LIBRE_TRANSLATE_URL=https://libretranslate.de/translate
GOOGLE_TRANSLATE_URL=https://translate.googleapis.com/translate_a/single
```

### 6. CORS 配置

```bash
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://ai-xingzuo-website-frontend-xqwz.vercel.app
```

## 在 Railway 中配置环境变量

### 方法 1: 通过 Railway 控制台

1. 登录 [Railway.app](https://railway.app)
2. 选择你的项目
3. 点击 "Settings" > "Environment Variables"
4. 点击 "Add Variable" 添加环境变量

### 方法 2: 通过 railway.toml

在 `railway.toml` 文件中添加环境变量：

```toml
[env]
NODE_ENV = { default = "production" }
PORT = { default = "8080" }
GATEWAY_PORT = { default = "3001" }
HOROSCOPE_SERVICE_PORT = { default = "8080" }
OPENROUTER_API_KEY = { fromSecret = "OPENROUTER_API_KEY" }
OPENROUTER_MODEL = { default = "qwen/qwen3-235b-a22b-2507" }
STAR_MCP_URL = { default = "https://mcp.api-inference.modelscope.net/7dbabf61999f4e/mcp" }
MCP_API_KEY = { fromSecret = "MCP_API_KEY" }
```

### 方法 3: 通过 Secrets

在 Railway 中，敏感信息（如 API 密钥）应该存储为 Secrets：

1. 在 Railway 控制台中，点击 "Settings" > "Secrets"
2. 点击 "Add Secret"
3. 添加以下 Secrets：
   - `OPENROUTER_API_KEY`
   - `MCP_API_KEY`

## 必需的环境变量

以下环境变量是必需的，缺少会导致服务启动失败：

### 必需变量
- `NODE_ENV` - 运行环境
- `PORT` - 服务端口
- `GATEWAY_PORT` - Gateway 服务端口
- `HOROSCOPE_SERVICE_PORT` - Horoscope 服务端口

### 推荐配置的变量
- `OPENROUTER_API_KEY` - AI 解析服务密钥
- `STAR_MCP_URL` - MCP 服务 URL
- `MCP_API_KEY` - MCP 服务密钥

## API 密钥获取指南

### OpenRouter API 密钥

1. 访问 [OpenRouter.ai](https://openrouter.ai/)
2. 注册账号
3. 在 Dashboard 中获取 API 密钥
4. 将密钥添加到 Railway Secrets 中

### MCP API 密钥

MCP API 密钥通常由 MCP 服务提供商提供。如果使用自托管的 MCP 服务，密钥可能在服务配置中定义。

## 验证环境变量

### 1. 检查服务日志

在 Railway 控制台中查看服务日志，确认环境变量是否正确加载：

```bash
# 查看 Gateway 服务日志
railway logs --service=ai-horoscope-gateway

# 查看 Horoscope 服务日志
railway logs --service=ai-horoscope-horoscope
```

### 2. 健康检查

访问健康检查端点，确认服务正常运行：

```bash
# Gateway 健康检查
curl https://your-project.up.railway.app/health

# Horoscope 健康检查
curl https://your-project.up.railway.app/api/v1/horoscope/signs
```

### 3. 测试 API

```bash
# 测试聊天会话
curl -X POST https://your-project.up.railway.app/api/v1/horoscope/chat/session

# 测试聊天分析
curl -X POST https://your-project.up.railway.app/api/v1/horoscope/chat/analyze \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test", "question": "我今天适合做什么？"}'
```

## 故障排除

### 常见问题

1. **API 密钥无效**
   - 检查密钥是否正确
   - 确认密钥没有过期
   - 验证密钥权限

2. **环境变量未加载**
   - 重启服务
   - 检查变量名称是否正确
   - 确认变量在正确的环境中

3. **服务启动失败**
   - 查看服务日志
   - 检查必需的环境变量
   - 验证端口配置

### 调试步骤

1. **检查环境变量是否加载**
   ```javascript
   console.log('NODE_ENV:', process.env.NODE_ENV);
   console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '已设置' : '未设置');
   console.log('STAR_MCP_URL:', process.env.STAR_MCP_URL);
   ```

2. **测试 API 连接**
   ```javascript
   const response = await fetch('https://openrouter.ai/api/v1/models', {
     headers: {
       'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
     }
   });
   console.log('OpenRouter API 响应:', response.status);
   ```

3. **检查 MCP 服务连接**
   ```javascript
   const { spawn } = require('child_process');
   const mcpProcess = spawn('npx', ['star-mcp'], {
     stdio: ['pipe', 'pipe', 'pipe']
   });
   mcpProcess.on('error', (error) => {
     console.error('MCP 进程启动失败:', error);
   });
   ```

## 安全注意事项

1. **不要在代码中硬编码密钥**
   - 使用环境变量
   - 不要将密钥提交到版本控制

2. **定期轮换密钥**
   - 定期更新 API 密钥
   - 废弃不再使用的密钥

3. **限制密钥权限**
   - 只授予必要的权限
   - 监控密钥使用情况

## 更新环境变量

### 1. 通过控制台更新

1. 在 Railway 控制台中修改环境变量
2. 重启服务使更改生效

### 2. 通过 CLI 更新

```bash
# 设置环境变量
railway variables set KEY=VALUE

# 设置 Secret
railway variables set KEY=VALUE --secret

# 删除环境变量
railway variables unset KEY
```

### 3. 通过 GitHub 更新

修改 `railway.toml` 文件，然后推送到 GitHub：

```bash
git add railway.toml
git commit -m "update: 更新环境变量配置"
git push origin main
```

Railway 会自动检测到更改并重新部署。

## 参考资源

- [Railway 环境变量文档](https://docs.railway.app/deploy/environments)
- [OpenRouter API 文档](https://openrouter.ai/docs)
- [MCP 服务文档](https://github.com/jlankellii/star-mcp)
- [Node.js 环境变量最佳实践](https://nodejs.org/en/knowledge/getting-started/environment-variables/)

## 联系支持

如果遇到问题，请：
1. 查看服务日志
2. 检查环境变量配置
3. 参考本文档
4. 提交 GitHub Issues

---

**最后更新**: 2025-12-02
**版本**: 1.0.0-alpha