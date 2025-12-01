FROM node:18-alpine

WORKDIR /app

# 安装concurrently用于多服务启动
RUN npm install -g concurrently

# 复制所有文件
COPY . .

# 安装依赖（仅生产依赖）
RUN npm install --production --omit=dev

# 暴露端口
EXPOSE 8080

# 启动应用（使用多服务启动脚本）
CMD ["npm", "run", "start-services"]