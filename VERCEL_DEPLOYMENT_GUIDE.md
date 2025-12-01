# Vercel 部署指南

## 概述

本项目前端采用 React + TypeScript 架构，部署到 Vercel 平台。

## 部署架构

### Vercel 部署
- **部署类型**: 静态站点部署
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **配置文件**: `vercel.json`

### 前后端集成
- **前端**: Vercel (静态站点)
- **后端**: Railway (API 服务)
- **API 代理**: 通过 `vercel.json` 配置 API 路由

## 配置文件

### 1. vercel.json
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

### 2. 前端 package.json
已更新：
- 添加 `build:vercel` 脚本
- 配置环境变量

## 环境变量配置

### Vercel 环境变量
```bash
REACT_APP_API_BASE_URL=https://your-railway-project-id.railway.app/api
REACT_APP_VERSION=1.0.0
```

## 部署步骤

### 1. 提交代码到 GitHub
```bash
git add .
git commit -m "feat: 添加 Vercel 部署配置"
git push origin main
```

### 2. 连接 Vercel 项目
1. 访问 [Vercel.com](https://vercel.com)
2. 登录账号（支持 GitHub 登录）
3. 点击 "New Project"
4. 选择 GitHub 仓库 `ai-xingzuo-website`
5. 点击 "Import"

### 3. 配置项目设置
在 Vercel 控制台中：
1. **Framework Preset**: 选择 "Other"
2. **Build Command**: `cd frontend && npm run build:vercel`
3. **Output Directory**: `frontend/dist`
4. **Install Command**: `npm install`
5. **Root Directory**: `/`

### 4. 配置环境变量
在 Vercel 项目设置中：
1. 进入 "Settings" > "Environment Variables"
2. 添加以下环境变量：
   - `REACT_APP_API_BASE_URL`: Railway 后端服务地址
   - `REACT_APP_VERSION`: 1.0.0

### 5. 启动部署
1. Vercel 会自动检测到 `vercel.json`
2. 自动开始构建和部署
3. 构建完成后自动部署

## 路由配置

### API 代理
`vercel.json` 中的路由配置：
```json
{
  "src": "/api/(.*)",
  "dest": "https://your-railway-project-id.railway.app/api/$1"
}
```
这会将所有 `/api/*` 请求代理到 Railway 后端服务。

### SPA 路由
```json
{
  "src": "/(.*)",
  "dest": "/index.html"
}
```
确保 React Router 正常工作。

## 优势

1. **静态部署**: 前端文件直接部署到 CDN，访问速度快
2. **自动构建**: Vercel 自动检测和构建
3. **全球 CDN**: Vercel 全球 CDN 加速
4. **无缝集成**: 与 GitHub 无缝集成，自动部署

## 监控与维护

### 构建日志
- Vercel 提供详细的构建日志
- 可以查看构建过程和错误信息

### 访问日志
- Vercel 提供访问统计
- 可以查看用户访问情况

### 性能监控
- Vercel 提供性能分析
- 可以查看页面加载速度

## 故障排除

### 常见问题
1. **构建失败**: 检查依赖和构建脚本
2. **API 请求失败**: 检查环境变量配置
3. **路由问题**: 检查 `vercel.json` 配置
4. **环境变量缺失**: 确认 Vercel 环境变量配置

### 调试步骤
1. 查看 Vercel 构建日志
2. 检查环境变量配置
3. 测试 API 端点
4. 验证路由配置

## 下一步

1. ✅ 创建配置文件
2. 🔄 提交代码到 GitHub
3. 🔄 连接 Vercel 项目
4. 🔄 配置环境变量
5. 🔄 启动部署
6. 🔄 验证部署