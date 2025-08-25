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

### API测试
```bash
# 测试今日热榜API连接
curl -X GET "http://localhost:3000/api/test-tophub"
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
- **后端服务**: Supabase (数据存储和API)
- **字体系统**: Geist Sans & Geist Mono
- **第三方服务**: 今日热榜API (内容采集)、Axios (HTTP客户端)、Sonner (Toast通知)

### 目录结构
- `/app/` - Next.js App Router页面和布局
  - `/api/materials/` - 素材管理API路由
  - `/api/collect/` - 内容采集API路由
  - `/api/test-tophub/` - 今日热榜API测试路由
- `/src/components/` - 业务组件
- `/src/contexts/` - React Context状态管理
- `/src/types/` - TypeScript类型定义
- `/src/data/` - 模拟数据
- `/src/hooks/` - 自定义React Hooks
- `/src/utils/` - 工具函数
- `/components/ui/` - shadcn/ui基础组件
- `/lib/` - 核心库文件
  - `api.ts` - API客户端
  - `supabase.ts` - Supabase服务封装
  - `api-utils.ts` - API工具函数
  - `tophub.ts` - 今日热榜API封装
  - `api-types.ts` - API类型定义
  - `validation.ts` - 数据验证工具
- `/.docs/` - 项目文档和操作教程

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
- 集成API调用和本地状态同步，支持乐观更新和错误回滚
- 批量操作支持: 批量删除、批量状态更新

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

## 环境配置

### 必需的环境变量
创建 `.env.local` 文件并配置：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TOPHUB_ACCESS_KEY=your_tophub_access_key
```

### 数据库结构
项目依赖Supabase的`articles`表：
- 数据库字段使用snake_case（如：source_url, collect_time）
- 前端字段使用camelCase（如：sourceUrl, collectTime）
- 转换函数在`/lib/supabase.ts`中定义

## API架构

### 三层架构
1. **API路由层** (`/app/api/materials/`, `/app/api/collect/`) - 处理HTTP请求和参数验证
2. **API客户端层** (`/lib/api.ts`) - 封装fetch请求，统一错误处理
3. **Supabase服务层** (`/lib/supabase.ts`) - 数据库操作封装

### API调用规范
- 所有API调用通过`materialsApi`和`collectApi`对象
- 使用`handleApiResponse`处理响应
- 错误使用`ApiError`类抛出
- 支持批量操作和分页查询

### 今日热榜集成
- **TophubService类** (`/lib/tophub.ts`) - 封装今日热榜API调用
- 支持获取榜单列表、榜单详情、内容搜索
- 内置错误处理和连接测试功能
- 微信公众号热文榜快速访问方法

## UI/UX特性

### 响应式设计
- 移动端：底部导航栏
- 桌面端：侧边导航栏
- 支持列表视图和网格视图切换

### 批量操作
- 多选功能支持批量删除和状态更新
- 乐观更新：先更新UI，失败后自动回滚

### 开发注意事项
- 项目使用pnpm作为包管理器
- TypeScript严格模式已启用
- 图片优化在next.config.mjs中被禁用 (`unoptimized: true`)
- 使用Geist字体（San和Mono变体）
- Article的status字段只有三种状态：pending、rewritten、published
- 时间字段统一使用ISO字符串格式

### 采集功能开发要点
- 采集源配置支持多平台（微信、知乎、今日热榜等）
- 批量采集和实时进度跟踪
- 采集结果去重和筛选机制
- 支持关键词搜索和全量采集两种模式
- 采集数据自动同步到素材库

### 错误处理规范
- API层统一使用`ApiError`类抛出错误
- 前端使用Sonner进行错误提示
- 网络请求超时设置为10秒（今日热榜API）
- 支持乐观更新和错误回滚机制