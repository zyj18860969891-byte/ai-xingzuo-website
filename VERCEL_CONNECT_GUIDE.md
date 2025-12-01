# Vercel 连接指南

## 连接步骤

### 1. 访问 Vercel
1. 打开浏览器访问 [https://vercel.com](https://vercel.com)
2. 点击 "Sign Up" 注册账号（或 "Sign In" 登录）
3. 选择 "Continue with GitHub" 使用 GitHub 账号登录

### 2. 授权 GitHub
1. Vercel 会请求访问你的 GitHub 账号
2. 授权 Vercel 访问 `ai-xingzuo-website` 仓库
3. 点击 "Authorize vercel" 完成授权

### 3. 创建新项目
1. 登录后，点击 "New Project" 按钮
2. 选择 "Import Git Repository"
3. 选择你的 GitHub 组织（zyj18860969891-byte）
4. 选择仓库 `ai-xingzuo-website`
5. 点击 "Import"

### 4. 配置项目设置
在 Vercel 项目配置页面：

#### 基本设置
- **Project Name**: `ai-horoscope-frontend` (可选)
- **Framework Preset**: `Other`
- **Root Directory**: `/`
- **Build Command**: `cd frontend && npm run build:vercel`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install`

#### 环境变量
添加以下环境变量：
```
REACT_APP_API_BASE_URL=https://ai-xingzuo-website-production.up.railway.app/api
REACT_APP_VERSION=1.0.0
```

**注意**: 使用实际的 Railway 域名 `ai-xingzuo-website-production.up.railway.app`。

### 5. Vercel 自动检测
Vercel 会自动检测到以下文件：
- `vercel.json` - Vercel 部署配置
- `frontend/package.json` - 前端项目配置
- `frontend/tsconfig.json` - TypeScript 配置

### 6. 启动部署
1. 点击 "Create Project" 创建项目
2. Vercel 开始构建前端应用
3. 构建过程通常需要 1-3 分钟
4. 构建完成后，自动部署到 Vercel CDN

### 7. 配置自定义域名（可选）
1. 在 Vercel 控制台进入 "Settings" > "Domains"
2. 点击 "Add" 添加自定义域名
3. 按照提示配置 DNS 记录
4. 等待域名验证完成

### 8. 验证部署
1. 在 Vercel 控制台查看部署状态
2. 点击 "Visit" 按钮访问应用
3. 测试前端功能：
   - 访问主页
   - 测试星座运势功能
   - 验证 API 请求是否正确代理到 Railway

## 配置说明

### vercel.json 配置
```json
{
  "version": 2,
  "name": "ai-horoscope-frontend",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-railway-project-id.railway.app/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_BASE_URL": "https://your-railway-project-id.railway.app/api"
  }
}
```

### 路由说明
1. **API 代理**: 所有 `/api/*` 请求会被代理到 Railway 后端服务
2. **SPA 路由**: 所有其他请求返回 `index.html`，支持 React Router

## 常见问题

### 1. 构建失败
- 检查 `vercel.json` 配置是否正确
- 查看构建日志确认错误
- 确保 `frontend/package.json` 中有正确的构建脚本

### 2. API 请求失败
- 检查环境变量 `REACT_APP_API_BASE_URL` 是否正确
- 确认 Railway 后端服务已启动
- 测试 API 端点是否可访问

### 3. 路由问题
- 确认 `vercel.json` 中的路由配置
- 检查 React Router 配置
- 验证 SPA 路由是否正确

### 4. 环境变量缺失
- 确保在 Vercel 控制台正确配置环境变量
- 环境变量名必须以 `REACT_APP_` 开头

## 下一步

1. ✅ 创建配置文件
2. ✅ 提交代码到 GitHub
3. 🔄 连接 Vercel 项目
4. 🔄 配置环境变量
5. 🔄 启动部署
6. 🔄 验证部署
7. 🔄 测试前后端集成

## 部署完成后

部署完成后，你将获得：
- **前端地址**: `https://ai-horoscope-frontend.vercel.app`
- **后端地址**: `https://your-project-id.railway.app/api`

前端会自动代理 API 请求到后端服务，实现完整的前后端分离架构。