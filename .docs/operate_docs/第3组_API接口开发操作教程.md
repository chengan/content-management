# 第3组：API接口开发操作教程

## 📚 小白入门：什么是API？

想象一下，API就像餐厅的服务员：
- 你（前端页面）想要食物（数据）
- 厨房（数据库）有食物
- 服务员（API）负责把你的订单传给厨房，再把食物端给你

我们刚刚创建的API就是这样的"服务员"，它们帮助网页和数据库之间传递信息。

## 🎯 我们完成了什么？

### 1. 创建了基础的API工具箱 📦

我们创建了3个工具文件，就像给API服务员配备了工具：

**📁 `lib/api-types.ts`** - 定义了数据的"说话方式"
- 就像制定了菜单格式，确保服务员和厨房说同样的"语言"

**📁 `lib/api-utils.ts`** - 提供了常用的"服务技能"  
- 包含成功回复客人、错误处理、记录日志等技能

**📁 `lib/validation.ts`** - 数据检查员
- 确保客人的订单格式正确，防止错误订单进入厨房

### 2. 创建了5个API服务员 👨‍💼

每个API都有自己的专门工作：

#### 🔍 **素材列表API** (`GET /api/materials`)
**工作内容：** 获取素材清单，支持筛选和搜索

**就像：** 你问服务员"今天有什么菜？能按价格排序吗？"

**支持的功能：**
- 📄 分页浏览（每页显示多少条）
- 🔎 关键词搜索（在标题、内容、作者中搜索）
- 📊 状态筛选（pending/rewritten/published）
- 📈 排序功能（按收集时间、阅读数、点赞数排序）

**使用示例：**
```
GET /api/materials?page=1&limit=10&search=科技&status=pending&sortBy=readCount&order=desc
```

#### 👁️ **单个素材API** (`GET /api/materials/[id]`)
**工作内容：** 获取特定素材的详细信息

**就像：** 你问服务员"能详细介绍一下这道菜吗？"

**使用示例：**
```
GET /api/materials/12345678-1234-1234-1234-123456789012
```

#### ✏️ **更新素材API** (`PUT /api/materials/[id]`)
**工作内容：** 修改素材信息

**就像：** 你告诉服务员"我要把这道菜改成不要辣的"

**支持修改的字段：**
- 标题、内容、来源、作者
- 标签、分类、状态
- 阅读数、点赞数等

**使用示例：**
```json
PUT /api/materials/12345678-1234-1234-1234-123456789012
{
  "title": "新标题",
  "status": "published"
}
```

#### 🗑️ **删除素材API** (`DELETE /api/materials/[id]`)
**工作内容：** 删除不需要的素材

**就像：** 你告诉服务员"这道菜我不要了"

**使用示例：**
```
DELETE /api/materials/12345678-1234-1234-1234-123456789012
```

#### 📦 **批量操作API** (`POST /api/materials/batch`)
**工作内容：** 一次处理多个素材

**就像：** 你告诉服务员"把这些菜都换成不辣的" 或 "这些菜我都不要了"

**支持的操作：**
- `delete`: 批量删除
- `updateStatus`: 批量更新状态

**使用示例：**
```json
POST /api/materials/batch
{
  "action": "updateStatus",
  "ids": ["id1", "id2", "id3"],
  "data": {
    "status": "published"
  }
}
```

## 🏗️ 技术特点说明（给好奇的小白）

### 🛡️ 数据验证
- 使用`zod`库检查数据格式
- 就像餐厅检查食材是否新鲜一样

### 📝 详细日志
- 每个操作都会记录日志
- 方便问题排查和监控

### 🔒 错误处理
- 优雅处理各种错误情况
- 给用户友好的错误提示

### ⚡ 性能优化
- 支持分页，避免一次加载太多数据
- 支持条件查询，提高查询效率

## 🧪 如何测试API？

### 方法1：使用浏览器（只适合GET请求）
```
http://localhost:3000/api/materials
http://localhost:3000/api/materials/你的素材ID
```

### 方法2：使用开发者工具
1. 按F12打开开发者工具
2. 进入Console（控制台）标签
3. 输入测试代码：

```javascript
// 测试获取素材列表
fetch('/api/materials')
  .then(res => res.json())
  .then(data => console.log(data));

// 测试获取单个素材
fetch('/api/materials/你的素材ID')
  .then(res => res.json())
  .then(data => console.log(data));
```

### 方法3：使用Postman或类似工具
1. 下载Postman（免费）
2. 创建新请求
3. 输入URL和参数进行测试

## 📂 文件结构总览

```
app/
  api/
    materials/
      route.ts           # 素材列表API
      [id]/
        route.ts         # 单个素材的增删改查API
      batch/
        route.ts         # 批量操作API

lib/
  api-types.ts          # API响应类型定义
  api-utils.ts          # API工具函数
  validation.ts         # 数据验证规则
  supabase.ts          # 数据库连接（已存在）
```

## 🚨 注意事项

### 安全提醒
1. ✅ 所有输入都会被验证
2. ✅ 使用了UUID格式验证
3. ✅ 实现了错误边界处理
4. ✅ 记录了操作日志

### 数据库字段映射
- API使用驼峰命名：`sourceUrl`, `readCount`
- 数据库使用下划线：`source_url`, `read_count`
- API自动处理转换，你不需要担心

### 删除机制
- 目前是真删除（物理删除）
- 未来可以改为软删除（只标记删除状态）

## 🎉 恭喜完成！

你现在拥有了完整的素材管理API系统！

**下一步：** 需要修改前端代码，让页面使用这些真实的API接口，而不是模拟数据。

**如果遇到问题：**
1. 检查终端是否有错误信息
2. 查看浏览器开发者工具的Network标签
3. 确认Supabase数据库连接正常

记住：编程就像学自行车，刚开始可能会摔跤，但掌握后就很容易了！加油！ 💪