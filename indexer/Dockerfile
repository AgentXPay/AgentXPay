# FROM node:20-slim
FROM --platform=linux/amd64 node:20-slim

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 8099

# 启动应用
CMD ["pnpm", "start"]
