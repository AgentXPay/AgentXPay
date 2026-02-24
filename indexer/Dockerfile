FROM node:20-slim

WORKDIR /app

# 复制依赖文件
COPY package.json ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 8090

# 启动应用
CMD ["pnpm", "start"]
