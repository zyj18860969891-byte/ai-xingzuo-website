# 🚀 部署验证指南

## 验证清单

### ✅ Railway 后端服务验证

#### 1. 服务健康检查
- **URL**: https://ai-xingzuo-website-production.up.railway.app/health
- **预期状态**: 200 OK
- **预期响应**: 
  ```json
  {
    "status": "healthy",
    "service": "ai-horoscope-gateway",
    "version": "1.0.0-alpha",
    "timestamp": "...",
    "uptime": "..."
  }
  ```

#### 2. 星座列表 API
- **URL**: https://ai-xingzuo-website-production.up.railway.app/api/v1/horoscope/signs
- **预期状态**: 200 OK
- **预期响应**: 包含 12 个星座的列表

#### 3. 星座详情 API
- **URL**: https://ai-xingzuo-website-production.up.railway.app/api/v1/horoscope/aries
- **预期状态**: 200 OK
- **预期响应**: 白羊座的详细信息

#### 4. 每日运势 API
- **URL**: https://ai-xingzuo-website-production.up.railway.app/api/v1/horoscope/aries/daily
- **预期状态**: 200 OK
- **预期响应**: 白羊座的每日运势数据

#### 5. 聊天会话 API
- **URL**: POST https://ai-xingzuo-website-production.up.railway.app/api/v1/horoscope/chat/session
- **预期状态**: 200 OK
- **预期响应**: 
  ```json
  {
    "sessionId": "uuid",
    "message": "会话创建成功",
    "timestamp": "..."
  }
  ```

### ✅ Vercel 前端服务验证

#### 1. 前端页面访问
- **URL**: https://ai-xingzuo-website-frontend.vercel.app
- **预期**: 页面正常加载，无 404 错误

#### 2. API 代理验证
- **测试方法**: 在前端页面中点击任意星座
- **预期**: 能够正常获取星座信息和运势数据
- **检查**: 浏览器开发者工具 Network 标签中，API 请求应该返回 200 状态码

#### 3. 聊天功能验证
- **测试方法**: 在聊天界面发送消息
- **预期**: 能够创建会话并发送消息
- **注意**: AI 分析功能可能需要额外配置，但基本的会话创建应该正常

## 验证步骤

### 步骤 1: 验证 Railway 服务
```bash
# 1. 检查健康状态
curl https://ai-xingzuo-website-production.up.railway.app/health

# 2. 检查星座列表
curl https://ai-xingzuo-website-production.up.railway.app/api/v1/horoscope/signs

# 3. 检查星座详情
curl https://ai-xingzuo-website-production.up.railway.app/api/v1/horoscope/aries

# 4. 检查每日运势
curl https://ai-xingzuo-website-production.up.railway.app/api/v1/horoscope/aries/daily

# 5. 测试聊天会话
curl -X POST https://ai-xingzuo-website-production.up.railway.app/api/v1/horoscope/chat/session
```

### 步骤 2: 验证 Vercel 前端
1. 打开浏览器访问 https://ai-xingzuo-website-frontend.vercel.app
2. 检查页面是否正常加载
3. 点击任意星座，检查是否能正常显示详情
4. 打开浏览器开发者工具，查看 Network 请求
5. 确认所有 API 请求都返回 200 状态码

### 步骤 3: 验证 API 代理
1. 在 Vercel 前端页面中
2. 打开浏览器开发者工具的 Network 标签
3. 进行以下操作并观察请求：
   - 加载主页
   - 点击星座
   - 查看运势
   - 使用聊天功能
4. 确认所有 `/api/*` 请求都被正确代理到 Railway 服务

## 常见问题排查

### 问题 1: Railway 服务无法访问
**症状**: 返回 502 或连接超时
**解决方案**:
- 检查 Railway 服务状态
- 查看服务日志
- 确认端口配置正确

### 问题 2: Vercel 前端无法加载
**症状**: 404 或白屏
**解决方案**:
- 检查 Vercel 构建日志
- 确认 `vercel.json` 配置正确
- 检查环境变量

### 问题 3: API 请求失败
**症状**: 404 或 CORS 错误
**解决方案**:
- 检查 `vercel.json` 中的路由配置
- 确认 Railway 服务正在运行
- 检查 CORS 配置

### 问题 4: 聊天功能异常
**症状**: 401 或 500 错误
**解决方案**:
- 这可能是 AI 服务认证问题
- 基本的会话创建功能应该正常
- 可以暂时忽略 AI 分析功能的错误

## 验证完成标准

- [ ] Railway 服务健康检查通过
- [ ] 所有星座 API 正常工作
- [ ] Vercel 前端页面正常加载
- [ ] API 代理正常工作
- [ ] 前后端集成测试通过
- [ ] 聊天会话功能正常

## 部署完成

如果以上所有验证都通过，恭喜！你的 AI 星座网站已经成功部署并正常运行。

## 联系支持

如果在验证过程中遇到问题，请：
1. 查看服务日志
2. 检查配置文件
3. 参考相关文档
4. 提交 GitHub Issues

---

**验证日期**: 2025-12-01  
**版本**: 1.0.0-alpha