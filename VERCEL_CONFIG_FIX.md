# Vercel 配置修复指南

## 问题分析

从部署日志可以看出：
1. Railway 部署成功 ✅
2. Vercel 构建成功 ✅
3. Vercel 返回 500 错误 ❌

## 问题原因

Vercel 配置不正确，导致：
1. 构建命令不匹配
2. 输出目录不正确
3. 路由配置问题

## 修复方案

### 1. 更新 vercel.json
```json
{
  "version": 2,
  "name": "ai-horoscope-frontend",
  "builds": [
    {
      "src": "frontend/package.json",
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

### 2. Vercel 项目配置

在 Vercel 控制台中，需要正确配置：

#### 基本设置
- **Framework Preset**: `Other`
- **Root Directory**: `/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 环境变量
```
REACT_APP_API_BASE_URL=https://your-railway-project-id.railway.app/api
```

### 3. 前端 package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:vercel": "tsc && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "format": "prettier --write src/"
  }
}
```

## 部署步骤

### 1. 提交修复
```bash
git add vercel.json frontend/package.json
git commit -m "fix: 修复 Vercel 配置问题"
git push origin main
```

### 2. 更新 Vercel 项目
1. 进入 Vercel 控制台
2. 选择项目 `ai-horoscope-frontend`
3. 进入 "Settings" > "Build & Development"
4. 更新配置：
   - **Root Directory**: `/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 保存更改

### 3. 重新部署
1. 点击 "Redeploy" 按钮
2. 等待新的部署完成
3. 测试网站是否正常工作

## 验证步骤

部署完成后，测试：
1. 访问主页
2. 检查控制台是否有错误
3. 测试 API 请求
4. 验证路由是否正常

## 常见问题

### 1. 500 错误
- 检查 Vercel 项目配置
- 确认构建命令和输出目录
- 查看构建日志

### 2. API 请求失败
- 检查环境变量配置
- 确认 Railway 服务地址
- 验证 API 代理路由

### 3. 路由问题
- 检查 React Router 配置
- 确认 SPA 路由设置
- 验证 vercel.json 路由配置