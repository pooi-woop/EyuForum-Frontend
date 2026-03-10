# bbsDemo 论坛前端项目

一个基于 Vue 3 + TypeScript + Element Plus 的现代化论坛前端应用。

## 项目简介

bbsDemo 是一个功能完善的论坛前端项目，实现了用户认证、帖子管理、评论互动、点赞收藏等核心功能。项目采用最新的前端技术栈，具有响应式设计，支持桌面端和移动端访问。

## 功能特性

- **用户认证**：支持邮箱注册、登录、验证码验证、密码重置、账号注销
- **帖子管理**：发布、编辑、删除帖子，支持分页浏览
- **评论系统**：发表评论、查看评论列表
- **点赞功能**：点赞/取消点赞帖子和评论
- **收藏功能**：创建收藏夹，收藏和管理帖子
- **拉黑功能**：屏蔽特定用户
- **响应式设计**：完美适配桌面端和移动端


## 技术栈

- **核心框架**: Vue 3.5+
- **开发语言**: TypeScript 5.9+
- **UI 组件库**: Element Plus 2.13+ (按需引入)
- **路由管理**: Vue Router 5.0+
- **状态管理**: Pinia 3.0+
- **HTTP 客户端**: Axios 1.13+
- **构建工具**: Vite 7.3+
- **代码规范**: TypeScript + ESLint

## 快速开始

### 环境要求

- Node.js: ^20.19.0 || >=22.12.0
- npm: >= 10.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后访问 http://localhost:5173/

### 构建生产版本

```bash
npm run build
```

构建后的文件位于 `dist/` 目录。

### 类型检查

```bash
npm run type-check
```

## 项目结构

```
bbsDemo-frontend/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 样式和资源文件
│   ├── components/        # 公共组件
│   │   └── icons/        # 图标组件
│   ├── router/           # 路由配置
│   │   └── index.ts
│   ├── services/         # API 服务
│   │   ├── api.ts       # Axios 配置
│   │   └── userApi.ts   # 业务 API
│   ├── stores/          # Pinia 状态管理
│   ├── utils/           # 工具函数
│   │   └── auth.ts      # Token 管理
│   ├── views/           # 页面组件
│   │   ├── HomeView.vue      # 首页（导航页）
│   │   ├── LoginView.vue     # 登录/注册
│   │   ├── ForumView.vue     # 论坛列表
│   │   ├── PostDetailView.vue # 帖子详情
│   │   ├── NewsView.vue      # 资讯页面
│   │   ├── CommunityView.vue # 社区页面
│   │   └── AboutView.vue     # 关于页面
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── 后端接口文档/         # 后端 API 文档
├── 前端接口文档.md       # 前端接口使用文档
├── components.d.ts      # Element Plus 组件类型声明
├── auto-imports.d.ts    # 自动导入类型声明
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 项目配置
```

## 页面说明

### 首页 (HomeView.vue)
- 响应式导航栏
- 论坛入口

### 登录/注册 (LoginView.vue)
- 邮箱登录
- 邮箱注册（含验证码）
- 找回密码（含验证码）
- 登录状态管理

### 论坛列表 (ForumView.vue)
- 帖子卡片展示
- 分页功能
- 发布帖子入口

### 帖子详情 (PostDetailView.vue)
- 帖子内容展示
- 评论列表
- 点赞功能
- 发表评论

## API 配置

项目默认连接后端接口 `http://localhost:8080`，可在 `src/services/api.ts` 中修改：

```typescript
const api = axios.create({
  baseURL: 'http://localhost:8080',  // 修改此处
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

## 核心功能实现

### Token 管理

自动处理 Token 的存储、获取和过期处理：

```typescript
import { tokenManager } from '@/utils/auth'

// 登录后自动保存 Token
// 请求时自动携带 Token
// 401 错误自动跳转登录页
```

### Element Plus 按需引入

使用 `unplugin-vue-components` 和 `unplugin-auto-import` 实现按需引入，无需手动导入组件：

```vue
<template>
  <el-button type="primary">按钮</el-button>
  <el-input v-model="input" />
</template>
```

### 响应式设计

使用 CSS Grid 和 Flexbox 实现响应式布局：

```css
.posts-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .posts-list {
    grid-template-columns: 1fr;
  }
}
```

## 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 组件使用 `<script setup lang="ts">` 语法
- 使用 Composition API
-  Props 和 Emits 显式类型定义

### 命名规范

- 组件名：PascalCase（如 `ForumView.vue`）
- 组合式函数：camelCase（如 `useAuth`）
- 常量：UPPER_SNAKE_CASE

### 文件组织

- 页面组件放在 `views/` 目录
- 可复用组件放在 `components/` 目录
- API 接口放在 `services/` 目录
- 工具函数放在 `utils/` 目录

## 常见问题

### 1. Element Plus 组件类型报错

确保 `components.d.ts` 文件包含所有使用的组件类型声明。如果添加新组件后出现类型错误，重启 TypeScript 服务或重新生成类型声明。

### 2. 跨域问题

开发时如遇跨域问题，可在 `vite.config.ts` 中配置代理：

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

### 3. 环境变量

创建 `.env` 文件配置环境变量：

```env
VITE_API_BASE_URL=http://localhost:8080
```

在代码中使用：

```typescript
const baseURL = import.meta.env.VITE_API_BASE_URL
```

## 浏览器支持

- Chrome >= 88
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 相关文档

- [前端接口文档](./前端接口文档.md) - 详细的 API 使用说明
- [后端接口文档](./后端接口文档/API.md) - 后端 API 文档

## 开源协议

[MIT License](LICENSE)

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 GitHub Issue
- 发送邮件至 [eyuforum@foxmail.com]

---

**Happy Coding! 🎉**
