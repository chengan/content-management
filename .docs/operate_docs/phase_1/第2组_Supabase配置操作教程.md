# 第2组：Supabase配置操作教程

## 📖 教程说明

这是一个面向初中生都能看懂的Supabase数据库配置教程，手把手教你创建数据库项目和表结构。

## 🎯 本组目标

完成这个教程后，你将拥有：
- ✅ 一个完整的Supabase数据库项目
- ✅ 配置好的articles表（用来存储文章素材）
- ✅ 可以正常工作的数据库连接

## 📝 详细操作步骤

### 第一部分：创建Supabase项目 (Task 2.1)

#### 步骤1：注册并登录Supabase

1. **打开浏览器**，访问：https://supabase.com
2. **注册账号**（如果还没有的话）：
   - 点击右上角"Start your project"
   - 建议使用GitHub账号登录，比较方便
   - 如果用邮箱注册，记得验证邮箱

#### 步骤2：创建新项目

1. **进入控制台**：
   - 登录后会看到项目控制台
   - 点击"New Project"按钮

2. **填写项目信息**：
   ```
   Organization: 选择你的个人账号
   Name: wx-content-management
   Database Password: 设置一个强密码（至少8位，包含数字和字母）
   Region: Southeast Asia (Singapore) - 选这个速度比较快
   Pricing Plan: Free（免费版本足够用）
   ```

3. **创建项目**：
   - 点击"Create new project"
   - 等待2-3分钟，直到看到"Your project is ready"

#### 步骤3：获取项目配置信息

1. **进入项目设置**：
   - 在左侧导航栏，点击最下面的齿轮图标 ⚙️ "Settings"
   - 然后点击"API"

2. **复制重要信息**：
   - **Project URL**：找到"Project URL"，点击复制按钮
   - **anon public key**：找到"anon public key"，点击复制按钮

3. **保存配置到项目**：
   - 打开你的项目文件夹
   - 找到并编辑 `.env.local` 文件
   - 将复制的信息填入：
   ```
   NEXT_PUBLIC_SUPABASE_URL=你复制的Project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你复制的anon public key
   ```

### 第二部分：创建数据库表 (Task 2.2)

#### 步骤1：进入SQL编辑器

1. **打开SQL编辑器**：
   - 在Supabase项目控制台
   - 左侧导航栏点击"SQL Editor"
   - 点击"New query"

#### 步骤2：创建articles表

1. **复制SQL代码**：
   将下面的代码完整复制到SQL编辑器中：

```sql
-- 创建articles表（文章素材表）
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

-- 创建索引以提高查询性能
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_collect_time ON articles(collect_time DESC);
CREATE INDEX idx_articles_category ON articles(category);

-- 插入一些测试数据
INSERT INTO articles (title, content, source, author, category, tags) VALUES
('测试文章1', '这是第一篇测试文章的内容，用来验证数据库是否正常工作。', '微信公众号', '张三', '科技', ARRAY['测试', '技术']),
('测试文章2', '这是第二篇测试文章的内容，包含更多的示例数据。', '知乎', '李四', '生活', ARRAY['生活', '日常']),
('测试文章3', '这是第三篇测试文章，用于测试不同状态的数据。', '微博', '王五', '娱乐', ARRAY['娱乐', '明星']);

-- 更新第二篇文章状态为已改写
UPDATE articles SET status = 'rewritten' WHERE title = '测试文章2';

-- 更新第三篇文章状态为已发布
UPDATE articles SET status = 'published' WHERE title = '测试文章3';
```

2. **执行SQL代码**：
   - 点击右下角"Run"按钮
   - 如果成功，会看到"Success. No rows returned"
   - 如果出现错误，检查代码是否完整复制

#### 步骤3：验证表创建成功

1. **查看表结构**：
   - 在左侧导航栏点击"Table Editor"
   - 应该能看到"articles"表
   - 点击表名查看结构和数据

2. **测试查询数据**：
   - 回到"SQL Editor"
   - 输入：`SELECT * FROM articles;`
   - 点击"Run"，应该能看到3条测试数据

### 第三部分：技术配置（我来帮你完成）

这部分比较技术化，我会直接帮你创建配置文件，你不需要手动操作。

## 🚨 常见问题解决

### 问题1：项目创建失败
- **现象**：一直显示"Creating project..."
- **解决**：
  1. 刷新页面重试
  2. 检查网络连接
  3. 尝试换个浏览器

### 问题2：找不到API设置
- **现象**：Settings页面找不到API选项
- **解决**：
  1. 确认项目已创建完成
  2. 左侧导航栏拉到最下面找齿轮图标
  3. 点击Settings → API

### 问题3：SQL执行失败
- **现象**：点击Run后出现红色错误
- **解决**：
  1. 检查SQL代码是否完整复制
  2. 确认没有多余的字符
  3. 重新复制代码再试一次

### 问题4：看不到测试数据
- **现象**：Table Editor中表是空的
- **解决**：
  1. 刷新页面
  2. 重新执行INSERT语句
  3. 检查SQL执行是否真的成功

## ✅ 验证你的配置是否正确

完成所有步骤后，请确认：

### 项目配置检查
- [ ] Supabase项目状态显示"Active"
- [ ] .env.local文件包含正确的URL和KEY
- [ ] URL格式类似：`https://xxxxx.supabase.co`
- [ ] KEY格式以`eyJ`开头

### 数据库表检查
- [ ] articles表存在且结构完整
- [ ] 表中有3条测试数据
- [ ] 数据的status字段有不同值（pending, rewritten, published）
- [ ] 索引创建成功（在Table Editor的Indexes标签可以看到）

### 数据验证查询
在SQL Editor中运行这些查询来验证：

```sql
-- 1. 检查表结构
\d articles;

-- 2. 统计数据总数
SELECT COUNT(*) FROM articles;

-- 3. 按状态统计
SELECT status, COUNT(*) FROM articles GROUP BY status;

-- 4. 查看最新的文章
SELECT title, status, created_at FROM articles ORDER BY created_at DESC;
```

预期结果：
- 数据总数应该是3
- pending状态1条，rewritten状态1条，published状态1条

## 🎉 完成标志

如果你看到以下内容，说明第2组任务成功完成：

1. **Supabase控制台**：
   - 项目状态显示绿色"Active"
   - Table Editor中能看到articles表和数据

2. **本地配置**：
   - .env.local文件配置正确
   - 项目能正常启动（运行`pnpm dev`）

3. **数据验证**：
   - 能查询到测试数据
   - 索引创建成功
   - 各种状态的数据都存在

## 📞 需要帮助？

如果遇到问题：
1. 仔细检查每个步骤是否按教程执行
2. 确认网络连接稳定
3. 截图错误信息，便于排查问题
4. 大部分问题都是复制粘贴时的格式问题

---

**文档创建时间**：2025-08-22  
**适用版本**：项目第一阶段第2组  
**难度等级**：⭐⭐⭐ (需要仔细操作)