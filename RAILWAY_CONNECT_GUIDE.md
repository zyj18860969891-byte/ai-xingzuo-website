# Railway 连接指南

## 连接步骤

### 1. 访问 Railway
1. 打开浏览器访问 [https://railway.app](https://railway.app)
2. 点击 "Sign Up" 注册账号（或 "Sign In" 登录）
3. 选择 "Continue with GitHub" 使用 GitHub 账号登录

### 2. 授权 GitHub
1. Railway 会请求访问你的 GitHub 账号
2. 授权 Railway 访问 `ai-xingzuo-website` 仓库
3. 点击 "Authorize railway" 完成授权

### 3. 创建新项目
1. 登录后，点击 "New Project" 按钮
2. 选择 "Deploy from GitHub repo"
3. 选择你的 GitHub 组织（zyj18860969891-byte）
4. 选择仓库 `ai-xingzuo-website`
5. 点击 "Deploy"

### 4. Railway 自动检测
Railway 会自动检测到以下文件：
- `Dockerfile` - Docker 容器配置
- `railway.toml` - Railway 部署配置
- `package.json` - Node.js 项目配置

### 5. 等待构建
1. Railway 开始构建 Docker 镜像
2. 安装依赖
3. 构建过程通常需要 2-5 分钟
4. 构建完成后，服务会自动启动

### 6. 配置环境变量
在 Railway 控制台中：
1. 点击项目设置（Settings）
2. 找到 "Variables" 部分
3. 添加以下环境变量：

```
NODE_ENV=production
PORT=8080
GATEWAY_PORT=8080
HOROSCOPE_SERVICE_PORT=3002
MODELSCOPE_API_KEY=your-api-key-here
MODELSCOPE_MODEL=Qwen/Qwen3-235B-Instruct-2507
MODELSCOPE_BASE_URL=https://api-inference.modelscope.cn/v1
HOROSCOPE_MCP_URL=http://localhost:3002
HOROSCOPE_MCP_TIMEOUT=15000
HOROSCOPE_LANGUAGE=zh
HOROSCOPE_CACHE_ENABLED=true
HOROSCOPE_SESSION_TIMEOUT=3600000
HOROSCOPE_READING_TYPE=single
TRANSLATION_API_ENABLED=true
LIBRE_TRANSLATE_URL=https://libretranslate.de/translate
GOOGLE_TRANSLATE_URL=https://translate.googleapis.com/translate_a/single
```

### 7. 启动服务
1. Railway 会自动启动服务
2. 点击 "Deploy" 按钮手动启动（如果需要）
3. 等待服务启动完成

### 8. 验证部署
1. 在 Railway 控制台查看服务状态
2. 点击 "Open" 按钮访问应用
3. 测试 API 端点：
   - `https://your-project-id.railway.app/api/health`
   - `https://your-project-id.railway.app/api/horoscope/daily`

## 常见问题

### 1. 构建失败
- 检查 Dockerfile 是否正确
- 查看构建日志确认错误
- 确保所有依赖都正确安装

### 2. 环境变量缺失
- 确保所有必需的环境变量都已配置
- ModelScope API Key 是必需的

### 3. 端口冲突
- 确保 Gateway 使用 8080 端口
- 确保 Horoscope 服务使用 3002 端口

### 4. 服务启动失败
- 查看 Railway 日志
- 检查环境变量配置
- 确认依赖安装正确

## 下一步

1. ✅ 创建配置文件
2. ✅ 提交代码到 GitHub
3. 🔄 连接 Railway 项目
4. 🔄 配置环境变量
5. 🔄 启动服务
6. 🔄 验证部署
7. 🔄 部署前端到 Vercel