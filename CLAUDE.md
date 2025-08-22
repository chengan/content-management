# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

### 基本开发
```bash
# 安装依赖（使用pnpm）
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# TypeScript类型检查（需要手动运行）
npx tsc --noEmit
```

### 重要提醒
- 该项目的 next.config.mjs 配置了忽略构建错误和ESLint错误，这是不推荐的配置
- 建议在实际开发中移除 `ignoreDuringBuilds: true` 和 `ignoreBuildErrors: true` 配置
- 运行类型检查使用: `npx tsc --noEmit`

## 项目架构

### 技术栈
- **前端框架**: Next.js 15.2.4 with App Router
- **UI库**: React 19
- **样式**: Tailwind CSS 4 + shadcn/ui组件库
- **类型**: TypeScript
- **包管理**: pnpm

### 目录结构
- `/app/` - Next.js App Router页面和布局
- `/src/components/` - 业务组件
- `/src/contexts/` - React Context状态管理
- `/src/types/` - TypeScript类型定义
- `/src/data/` - 模拟数据和API
- `/components/ui/` - shadcn/ui基础组件
- `/lib/` - 工具函数

### 核心功能模块
1. **内容采集** (`/collect`) - 从各平台采集内容
2. **素材管理** (`/materials`) - 管理采集的内容素材
3. **AI改写** (`/rewrite`) - 使用AI重写内容
4. **智能配图** (`/images`) - 自动生成匹配图片
5. **发布管理** (`/publish`) - 发布到公众号
6. **系统设置** (`/settings`) - 配置管理

### 状态管理
- 使用React Context (`AppContext`) 进行全局状态管理
- 主要状态: 素材(materials)、改写记录(rewrites)、发布记录(publications)、账号(accounts)、配置(config)

### 组件规范
- 使用shadcn/ui组件系统，配置在components.json中
- UI组件别名配置: `@/components/ui`
- 业务组件路径: `@/src/components`
- 使用Lucide React图标库

### 数据类型
核心数据类型定义在 `src/types/index.ts`:
- `Article` - 文章素材
- `RewriteRecord` - 改写记录  
- `PublicationRecord` - 发布记录
- `WeChatAccount` - 微信公众号账号
- `AppConfig` - 应用配置

### 样式配置
- Tailwind CSS 4配置
- 使用CSS变量主题系统
- PostCSS配置支持@tailwindcss/postcss
- 响应式设计，支持移动端

### 路径别名
```typescript
"@/*": ["./*"]  // 项目根目录映射
```

### 开发注意事项
- 项目使用pnpm作为包管理器
- TypeScript严格模式已启用
- 图片优化在next.config.mjs中被禁用 (`unoptimized: true`)
- 使用Geist字体（San和Mono变体）