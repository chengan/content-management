# 第二阶段第4步：后端API开发教程 📚

> **适合人群**: 编程零基础的初中生也能看懂
> **完成时间**: 已经全部完成，这是说明文档
> **难度等级**: ⭐⭐⭐（中等）

## 🎯 这一步我们完成了什么？

我们创建了4个新的API接口，让前端可以：
1. 📋 获取微信平台的采集源列表
2. 🔥 获取微信热文榜的实时内容 
3. 📥 把文章采集保存到素材库
4. 📊 查看采集历史和统计数据

## 📁 新创建的文件

所有新文件都在 `app/api/collect/` 目录下：

```
app/api/collect/
├── sources/route.ts      # 获取采集源接口
├── hotlist/route.ts      # 获取热榜内容接口  
├── articles/route.ts     # 文章采集接口
└── history/route.ts      # 采集历史接口
```

## 🔍 每个接口详细说明

### 1. 📋 采集源接口 (`/api/collect/sources`)

**作用**: 告诉前端有哪些微信榜单可以采集

**访问方式**: GET请求
```
GET /api/collect/sources
```

**返回内容**: 
```json
{
  "success": true,
  "data": [
    {
      "hashid": "WnBe01o371",
      "name": "微信热文总榜", 
      "description": "微信公众号热门文章排行榜",
      "platform": "wechat"
    }
  ]
}
```

**特殊功能**:
- ⚡ **缓存机制**: 5分钟内重复请求会直接返回缓存，不会重复调用外部API
- 🛡️ **容错机制**: 如果外部API失败，会返回默认的微信源

### 2. 🔥 热榜内容接口 (`/api/collect/hotlist`)

**作用**: 获取微信热文榜的具体文章列表

**访问方式**: GET请求
```
GET /api/collect/hotlist?page=1&limit=20&quality=true
```

**参数说明**:
- `page`: 第几页（从1开始）
- `limit`: 每页多少篇文章（最多100篇）
- `quality`: 是否过滤低质量内容（true/false）
- `hashid`: 榜单ID（默认是微信热文总榜）

**返回内容**:
```json
{
  "success": true,
  "data": [
    {
      "title": "文章标题",
      "content": "文章内容预览",
      "source": "微信热文总榜",
      "sourceUrl": "https://...",
      "author": "作者名",
      "hotScore": 1000
    }
  ],
  "meta": {
    "total": 50,
    "hasMore": true
  }
}
```

**智能功能**:
- 🔍 **内容质量筛选**: 自动过滤标题太短、广告等低质量内容
- 📄 **分页支持**: 支持分页获取，避免一次加载太多数据
- 🔄 **数据转换**: 把外部API的数据格式转换成我们系统需要的格式

### 3. 📥 文章采集接口 (`/api/collect/articles`)

**作用**: 把选中的文章保存到我们的素材库

**访问方式**: POST请求
```javascript
POST /api/collect/articles
Content-Type: application/json

{
  "articles": [
    {
      "title": "文章标题",
      "content": "文章内容", 
      "sourceUrl": "https://...",
      "author": "作者"
    }
  ],
  "skipDuplicates": true,
  "platform": "wechat"
}
```

**参数说明**:
- `articles`: 要采集的文章数组（最多50篇）
- `skipDuplicates`: 是否跳过重复文章（推荐true）
- `platform`: 平台名称（微信就填"wechat"）

**返回内容**:
```json
{
  "success": true,
  "data": {
    "total": 10,
    "collected": 8,
    "duplicated": 1,
    "failed": 1,
    "articles": [/* 成功采集的文章 */],
    "errors": ["失败原因1", "失败原因2"]
  }
}
```

**智能功能**:
- 🔄 **去重检查**: 根据标题+链接自动检查是否已存在
- 📦 **批量处理**: 一次可以采集多篇文章
- 📈 **详细统计**: 告诉你成功了几篇、重复了几篇、失败了几篇
- 💾 **自动记录**: 自动记录采集历史到数据库

### 4. 📊 采集历史接口 (`/api/collect/history`)

**作用**: 查看之前的采集记录和统计数据

**访问方式**: GET请求
```
GET /api/collect/history?page=1&range=week&includeStats=true
```

**参数说明**:
- `page`: 第几页
- `range`: 时间范围（today/week/month）
- `platform`: 平台筛选（wechat）
- `includeStats`: 是否包含统计数据

**返回内容**:
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "articlesCount": 20,
        "successCount": 18,
        "collectedAt": "2024-01-15T10:30:00Z",
        "source": {
          "name": "微信热文总榜"
        }
      }
    ],
    "summary": {
      "totalArticles": 100,
      "totalSuccess": 92,
      "averageSuccessRate": 92.00
    },
    "stats": {
      "totalCollects": 15,
      "todayCollects": 3,
      "successRate": 90.5
    }
  }
}
```

## 🔧 API客户端使用方法

我们还更新了 `lib/api.ts` 文件，添加了 `collectApi` 对象，让前端调用更简单：

```javascript
// 引入API客户端
import { collectApi } from '@/lib/api';

// 1. 获取采集源
const sources = await collectApi.getSources();

// 2. 获取热榜内容
const hotlist = await collectApi.getHotlist({ 
  page: 1, 
  limit: 20,
  quality: true 
});

// 3. 采集文章
const result = await collectApi.collectArticles(selectedArticles, {
  skipDuplicates: true,
  platform: 'wechat'
});

// 4. 获取采集历史
const history = await collectApi.getHistory({ 
  range: 'week',
  includeStats: true 
});
```

## 🛡️ 错误处理机制

每个接口都有完善的错误处理：

### 常见错误类型：
1. **401** - API密钥无效
2. **429** - 请求频率过高
3. **408** - 网络超时
4. **409** - 全部都是重复文章
5. **422** - 部分文章处理失败
6. **500** - 服务器内部错误

### 错误响应格式：
```json
{
  "success": false,
  "error": "具体的错误信息",
  "details": "详细的错误说明"
}
```

## 🔍 如何测试这些接口？

### 方法1：使用浏览器测试GET接口
```
http://localhost:3000/api/collect/sources
http://localhost:3000/api/collect/hotlist
http://localhost:3000/api/collect/history
```

### 方法2：使用开发者工具
1. 打开浏览器的开发者工具（F12）
2. 在Console中输入：
```javascript
// 测试获取采集源
fetch('/api/collect/sources')
  .then(r => r.json())
  .then(console.log);

// 测试获取热榜内容  
fetch('/api/collect/hotlist?limit=5')
  .then(r => r.json())
  .then(console.log);
```

## 📝 重要提醒

1. **环境变量**: 确保 `.env.local` 文件中配置了 `TOPHUB_ACCESS_KEY`
2. **数据库**: 确保数据库中已创建相关表（之前步骤已完成）
3. **权限**: 确保Supabase数据库有正确的访问权限
4. **限流**: 今日热榜API有调用频率限制，不要频繁测试

## 🎉 完成检查

如果以下测试都通过，说明API开发成功：

- ✅ GET `/api/collect/sources` 能返回微信采集源
- ✅ GET `/api/collect/hotlist` 能返回热榜文章
- ✅ POST `/api/collect/articles` 能成功采集文章  
- ✅ GET `/api/collect/history` 能返回历史记录
- ✅ 前端可以通过 `collectApi` 调用所有功能

---

**🏆 恭喜你！第二阶段的后端API开发已经全部完成！**

接下来可以开始第4项任务：改造前端页面来使用这些新API。