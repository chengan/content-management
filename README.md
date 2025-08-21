# 内容管理系统原型项目

一个基于 Next.js 构建的现代化内容管理系统原型，提供内容收集、图片管理、素材库、发布和重写等功能。

## 项目概述

这是一个功能完整的内容管理系统原型，采用最新的前端技术栈构建：

- **前端框架**: Next.js 15.2.4 + React 19
- **开发语言**: TypeScript
- **样式框架**: Tailwind CSS 4
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **包管理器**: pnpm
- **构建工具**: Next.js 内置构建系统

## 环境要求

在开始之前，请确保你的开发环境满足以下要求：

- **Node.js**: 版本 18.17 或更高版本
- **包管理器**: pnpm (推荐) 或 npm
- **操作系统**: Windows、macOS 或 Linux

### 检查环境版本

```bash
# 检查 Node.js 版本
node --version

# 检查 pnpm 版本（如果未安装，请先安装 pnpm）
pnpm --version

# 如果没有 pnpm，可以安装：
npm install -g pnpm
```

## 快速开始

### 1. 克隆项目

```bash
git clone <项目地址>
cd content-management
```

### 2. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 3. 启动开发服务器

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev
```

### 4. 访问应用

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可查看应用。

## 详细操作流程

### 第一步：环境准备

1. **安装 Node.js**
   - 访问 [Node.js 官网](https://nodejs.org/) 下载并安装最新的 LTS 版本
   - 验证安装：打开终端运行 `node --version`

2. **安装 pnpm**（推荐）
   ```bash
   npm install -g pnpm
   ```

3. **验证 Git 安装**
   ```bash
   git --version
   ```

### 第二步：获取项目代码

1. **克隆仓库**
   ```bash
   git clone <你的项目仓库地址>
   cd content-management
   ```

2. **查看项目结构**
   ```bash
   # Windows PowerShell
   tree /f

   # macOS/Linux
   ls -la
   ```

### 第三步：安装项目依赖

1. **安装所有依赖**
   ```bash
   pnpm install
   ```

2. **验证依赖安装**
   ```bash
   # 检查 node_modules 是否创建
   ls node_modules

   # 查看已安装的包
   pnpm list
   ```

### 第四步：启动开发环境

1. **启动开发服务器**
   ```bash
   pnpm dev
   ```

2. **验证启动成功**
   - 终端应显示类似信息：
     ```
     ▲ Next.js 15.2.4
     - Local:        http://localhost:3000
     - Environments: .env.local
     
     ✓ Ready in 2.3s
     ```

3. **访问应用**
   - 打开浏览器访问 `http://localhost:3000`
   - 你应该能看到内容管理系统的主界面

### 第五步：验证功能模块

应用包含以下主要功能模块，你可以逐一验证：

1. **内容收集** (`/collect`) - 内容采集和管理
2. **图片管理** (`/images`) - 图片资源管理
3. **素材库** (`/materials`) - 素材存储和组织
4. **内容发布** (`/publish`) - 内容发布管理
5. **内容重写** (`/rewrite`) - 内容编辑和重写
6. **系统设置** (`/settings`) - 系统配置管理

## 可用脚本

项目提供了以下npm脚本：

```bash
# 启动开发服务器（热重载）
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器（需要先构建）
pnpm start

# 运行代码检查
pnpm lint

# 类型检查
npx tsc --noEmit
```

## 开发指南

### 开发模式

1. **实时预览**: 开发服务器支持热重载，修改代码后会自动刷新浏览器
2. **错误提示**: 开发模式下会显示详细的错误信息和调试信息
3. **类型检查**: TypeScript 提供实时类型检查

### 构建生产版本

```bash
# 构建应用
pnpm build

# 启动生产服务器
pnpm start
```

### 项目结构

```
content-management/
├── app/                    # Next.js App Router 页面
│   ├── collect/           # 内容收集页面
│   ├── images/            # 图片管理页面
│   ├── materials/         # 素材库页面
│   ├── publish/           # 内容发布页面
│   ├── rewrite/           # 内容重写页面
│   ├── settings/          # 设置页面
│   ├── layout.tsx         # 根布局组件
│   └── page.tsx           # 首页
├── components/            # 可复用组件
│   ├── ui/               # UI 基础组件
│   └── theme-provider.tsx # 主题提供者
├── src/                   # 源代码目录
│   ├── components/       # 业务组件
│   ├── contexts/         # React Context
│   ├── data/            # 模拟数据
│   ├── hooks/           # 自定义 Hooks
│   ├── types/           # TypeScript 类型定义
│   └── utils/           # 工具函数
├── public/               # 静态资源
├── styles/               # 全局样式
└── 配置文件...
```

## 故障排除

### 常见问题

1. **端口占用**
   ```bash
   # 如果 3000 端口被占用，Next.js 会自动使用下一个可用端口
   # 或者手动指定端口
   pnpm dev -p 3001
   ```

2. **依赖安装失败**
   ```bash
   # 清除缓存后重新安装
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

3. **类型错误**
   ```bash
   # 运行类型检查
   npx tsc --noEmit
   ```

4. **构建失败**
   ```bash
   # 先检查代码是否有错误
   pnpm lint
   pnpm build
   ```

### 获取帮助

如果遇到问题，可以：

1. 查看终端输出的错误信息
2. 检查浏览器开发者工具的控制台
3. 参考 [Next.js 官方文档](https://nextjs.org/docs)
4. 查看项目的 issue 或创建新的 issue

## 开发规范

本项目遵循以下开发规范：

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 规则进行代码规范检查
- 使用 Prettier 进行代码格式化
- 采用 Git Flow 分支管理策略
- 所有代码变更需要经过代码审查

## 技术栈详情

- **Next.js 15**: React 全栈框架
- **React 19**: 前端UI库
- **TypeScript**: 类型安全的JavaScript
- **Tailwind CSS**: 原子化CSS框架
- **Radix UI**: 无样式、可访问的UI组件
- **Lucide React**: 现代图标库
- **React Hook Form**: 表单处理库
- **Zod**: 运行时类型验证

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/新功能`)
3. 提交更改 (`git commit -am '添加新功能'`)
4. 推送到分支 (`git push origin feature/新功能`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证，详情请查看 [LICENSE](LICENSE) 文件。