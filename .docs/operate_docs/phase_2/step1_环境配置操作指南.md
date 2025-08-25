# 第二阶段 Step 1：环境变量配置操作指南

## 🎯 这一步要做什么？
配置今日热榜API的访问密钥，让我们的程序能够获取微信公众号的热门文章数据。

## 📝 操作步骤（超级简单版）

### 第1步：找到环境变量文件
1. 在你的项目文件夹里找到 `.env.local` 文件
   - 如果找不到这个文件，就在项目根目录（和package.json同一级）创建一个新文件
   - 文件名必须是：`.env.local`（注意前面有个点）

### 第2步：打开.env.local文件
1. 用任何文本编辑器打开（记事本、VS Code都可以）
2. 你会看到类似这样的内容：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 第3步：添加今日热榜API配置
在文件的最后面，添加这两行：

```env
# 今日热榜API配置（第二阶段新增）
TOPHUB_ACCESS_KEY=你的今日热榜API密钥
```

### 第4步：获取今日热榜API密钥
**重要提醒：** 你需要：
1. 访问今日热榜官网或联系服务提供商获取API密钥
2. 将获取到的密钥替换 `你的今日热榜API密钥` 这个文字

**完整的.env.local文件应该像这样：**
```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 今日热榜API配置（第二阶段新增）
TOPHUB_ACCESS_KEY=你的真实API密钥
```

### 第5步：保存文件
1. 按 `Ctrl + S` 保存文件
2. 关闭编辑器

## ⚠️ 重要注意事项

### 安全提醒：
- **绝对不要**把.env.local文件上传到Github等代码仓库
- 这个文件包含敏感信息，只能在你的本地电脑使用
- 如果别人需要运行你的项目，他们需要创建自己的.env.local文件

### 文件位置确认：
```
你的项目文件夹/
├── package.json          ← 如果你能看到这个文件
├── .env.local            ← 那么.env.local应该和它在同一级
├── app/
├── lib/
└── ...
```

## 🔧 如何验证配置成功？

### 方法1：重启开发服务器
1. 如果你的开发服务器正在运行（`pnpm dev`）
2. 按 `Ctrl + C` 停止服务器
3. 重新运行 `pnpm dev`
4. 服务器能正常启动就说明配置没有语法错误

### 方法2：检查环境变量是否加载
稍后我会创建一个测试API来验证密钥是否正确配置。

## 🚨 常见问题解决

### Q1：找不到.env.local文件？
**答：** 这是正常的，很多项目最开始没有这个文件。你需要：
1. 在项目根目录（和package.json同一级）
2. 右键 → 新建 → 文本文档
3. 将文件名改为 `.env.local`（包括前面的点）
4. Windows可能会提示"确定要更改文件扩展名吗？"，点击"是"

### Q2：.env.local文件打开后是乱码？
**答：** 用VS Code或其他代码编辑器打开，不要用Word

### Q3：保存后程序还是报错？
**答：** 
1. 检查文件名是否正确（前面必须有点）
2. 检查是否有多余的空格或特殊字符
3. 重启开发服务器（先Ctrl+C停止，再pnpm dev启动）

## ✅ 完成标志
当你完成这一步后，你的.env.local文件应该包含TOPHUB_ACCESS_KEY配置，且开发服务器能够正常启动。

---

**下一步：** 我会帮你创建今日热榜API客户端代码，测试API连接是否正常。