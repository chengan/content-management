# 第一阶段 - 基础数据管理开发计划

## 📋 阶段概述

### 🎯 阶段目标
将当前基于模拟数据的前端界面切换到真实的Supabase数据库，建立完整的API体系，实现基础的素材管理功能。

### 🔍 现状分析
- ✅ 前端界面完整，包含素材管理页面
- ✅ TypeScript类型定义完善
- ✅ 模拟数据和API结构清晰
- ✅ Supabase集成完成 (第1、2组已完成)
- ❌ 缺少真实API接口 (第3组待完成)
- ✅ 环境变量配置完成

### ⚠️ 关键问题识别
1. ~~**缺少Supabase依赖**~~ - ✅ 已解决：package.json已包含@supabase/supabase-js
2. ~~**缺少UUID库**~~ - ✅ 已解决：已安装uuid生成器和类型定义
3. ~~**环境变量未配置**~~ - ✅ 已解决：已创建.env.local文件
4. **API路由不存在** - ❌ 待解决：app目录下没有api文件夹 (第3组任务)

## 📝 详细任务清单

### 第1组：环境准备 (预计4小时) ✅ 已完成

#### Task 1.1: 安装必要依赖 ✅ 已完成
- [x] 安装 @supabase/supabase-js
- [x] 安装 uuid 和 @types/uuid  
- [x] 安装 axios (HTTP请求库)
- [x] 验证依赖安装成功

**验收标准:**
- package.json包含所有必要依赖
- 项目能正常启动无错误

#### Task 1.2: 环境变量配置 ✅ 已完成
- [x] 创建 .env.local 文件
- [x] 配置 NEXT_PUBLIC_SUPABASE_URL
- [x] 配置 NEXT_PUBLIC_SUPABASE_ANON_KEY
- [x] 添加 .env.local 到 .gitignore
- [x] 验证环境变量读取

**验收标准:**
- 环境变量能正确读取
- 敏感信息不会提交到git

### 第2组：Supabase配置 (预计6小时) ✅ 已完成

#### Task 2.1: Supabase项目创建 ✅ 已完成
- [x] 注册/登录 Supabase 账号
- [x] 创建新项目 "wx-content-management"
- [x] 获取项目URL和API密钥
- [x] 测试基础连接

**验收标准:**
- Supabase项目创建成功
- 能通过客户端连接到数据库

#### Task 2.2: 数据库表创建 ✅ 已完成
- [x] 创建 articles 表结构
- [x] 设置主键和外键约束
- [x] 创建必要的索引(id, status, collectTime)
- [x] 插入测试数据验证

**Articles表结构:**
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  author TEXT,
  publish_time TIMESTAMPTZ,
  collect_time TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[],
  category TEXT,
  read_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'rewritten', 'published')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**验收标准:**
- 表结构符合TypeScript类型定义
- 索引创建成功，查询性能良好
- 能正常插入和查询数据

#### Task 2.3: Supabase客户端配置 ✅ 已完成
- [x] 创建 lib/supabase.ts 配置文件
- [x] 设置类型安全的客户端实例
- [x] 编写数据库操作封装方法
- [x] 测试基础CRUD操作

**验收标准:**
- 客户端配置正确
- TypeScript类型安全
- 基础操作测试通过

### 第3组：API接口开发 (预计8小时) ✅ 已完成

#### Task 3.1: 基础API结构 ✅ 已完成
- [x] 创建 app/api 目录结构
- [x] 设置统一的错误处理中间件
- [x] 创建标准响应格式
- [x] 实现请求验证和日志

**API响应格式标准:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
```

#### Task 3.2: 素材列表API (GET /api/materials) ✅ 已完成
- [x] 实现分页查询 (page, limit)
- [x] 添加状态筛选 (status filter)
- [x] 实现关键词搜索 (search)
- [x] 添加排序功能 (sort by collectTime, readCount等)

**请求参数:**
- page?: number (默认1)
- limit?: number (默认20)
- status?: 'pending' | 'rewritten' | 'published'
- search?: string
- sortBy?: 'collectTime' | 'readCount' | 'likeCount'
- order?: 'asc' | 'desc'

#### Task 3.3: 单个素材API (GET /api/materials/[id]) ✅ 已完成
- [x] 实现根据ID查询单个素材
- [x] 添加404错误处理
- [x] 返回完整素材信息
- [x] 记录访问日志

#### Task 3.4: 更新素材API (PUT /api/materials/[id]) ✅ 已完成
- [x] 实现部分字段更新
- [x] 添加数据验证 (使用zod)
- [x] 实现乐观锁机制
- [x] 自动更新updated_at时间戳

#### Task 3.5: 删除素材API (DELETE /api/materials/[id]) ✅ 已完成
- [x] 实现软删除机制
- [x] 检查关联数据(改写记录、发布记录)
- [x] 添加删除权限验证
- [x] 记录删除操作日志

#### Task 3.6: 批量操作API (POST /api/materials/batch) ✅ 已完成
- [x] 批量删除功能
- [x] 批量状态更新
- [x] 事务处理确保数据一致性
- [x] 返回详细操作结果

**批量操作格式:**
```typescript
interface BatchOperation {
  action: 'delete' | 'updateStatus';
  ids: string[];
  data?: { status?: string };
}
```

### 第4组：前端集成 (预计6小时) ✅ 已完成

#### Task 4.1: API客户端封装 ✅ 已完成
- [x] 创建 lib/api.ts 文件
- [x] 封装所有API请求方法
- [x] 实现统一错误处理
- [x] 添加TypeScript类型安全

#### Task 4.2: Context状态管理更新 ✅ 已完成
- [x] 修改 AppContext 使用真实API
- [x] 移除对mock-data的依赖
- [x] 实现loading状态管理
- [x] 添加错误状态处理

#### Task 4.3: 页面组件修改 ✅ 已完成
- [x] 更新素材列表页面 (/materials)
- [x] 修改素材详情页面
- [x] 调整编辑功能集成API
- [x] 更新删除功能使用真实API

#### Task 4.4: 用户体验优化 ✅ 已完成
- [x] 添加全局loading指示器
- [x] 实现乐观更新提升体验
- [x] 完善错误信息展示
- [x] 添加成功操作提示反馈

### 第5组：测试验证 (预计4小时)

#### Task 5.1: 功能测试
- [ ] 测试所有CRUD操作
- [ ] 验证数据一致性
- [ ] 测试边界条件和异常情况
- [ ] 验证错误处理机制

#### Task 5.2: 性能测试
- [ ] 测试列表查询性能
- [ ] 验证分页效果
- [ ] 测试并发操作
- [ ] 检查内存泄漏问题

#### Task 5.3: 用户体验测试
- [ ] 测试完整操作流程
- [ ] 验证页面响应速度
- [ ] 检查错误提示友好性
- [ ] 测试移动端适配

## ⏰ 时间规划建议

### 第1天 (8小时)
**上午 (4小时):**
- 环境准备：安装依赖、配置环境变量
- Supabase项目创建和基础配置

**下午 (4小时):**
- 数据库表创建和结构设计
- Supabase客户端配置和连接测试

### 第2天 (8小时)
**全天:**
- API接口开发 (Task 3.1-3.3)
- 基础API结构 + 列表API + 单个素材API

### 第3天 (8小时)
**上午 (4小时):**
- 完成剩余API (Task 3.4-3.6)
- 更新、删除、批量操作API

**下午 (4小时):**
- 前端集成开始 (Task 4.1-4.2)
- API客户端封装 + Context更新

### 第4天 (4小时)
- 完成前端集成 (Task 4.3-4.4)
- 测试验证 (Task 5.1-5.3)

## 🔥 风险评估与应对策略

### 高风险项目
1. **Supabase连接问题**
   - 风险：网络问题、配置错误导致连接失败
   - 应对：保留mock数据作为降级方案

2. **数据迁移复杂性**
   - 风险：现有mock数据结构与数据库不匹配
   - 应对：编写数据迁移脚本，逐步验证

3. **API性能问题**
   - 风险：查询慢、并发处理能力不足
   - 应对：添加索引、实现缓存机制

### 中风险项目
1. **前端状态管理重构**
   - 风险：状态逻辑复杂，容易出错
   - 应对：分步骤重构，保持功能可用

2. **错误处理完整性**
   - 风险：边界情况考虑不周
   - 应对：编写完整测试用例

## 📋 验收标准

### 功能验收
- [ ] 所有素材管理CRUD操作正常
- [ ] 分页、搜索、筛选功能完整
- [ ] 数据持久化到Supabase成功
- [ ] 前端界面与真实API完全集成

### 性能验收
- [ ] 列表查询响应时间 < 500ms
- [ ] 支持并发用户操作
- [ ] 内存使用稳定，无泄漏

### 用户体验验收
- [ ] 操作流程顺畅，无明显卡顿
- [ ] 错误提示清晰友好
- [ ] Loading状态反馈及时

## 🎯 成功标准

完成第一阶段后，你应该拥有：
1. **稳定的数据库基础** - Supabase配置完善，表结构合理
2. **完整的API体系** - 5个核心接口，支持所有基础操作
3. **可靠的前端集成** - 真实数据驱动，用户体验良好
4. **良好的代码质量** - 类型安全，错误处理完善

这将为后续阶段（内容采集、AI改写等）奠定坚实的基础。

---

**文档版本:** v1.0  
**创建时间:** 2025-08-22  
**预计完成时间:** 4个工作日  
**负责人:** AI助手 + 开发者