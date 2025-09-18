# 步骤2：执行SQL脚本创建改写表

## 🎯 目标
执行改写模块的建表SQL脚本，创建4个新的数据库表。

## ⏰ 预计时间
3-5分钟

## 📋 前置条件
- 已完成步骤1的Supabase准备工作
- 已经在Supabase的SQL编辑器页面

## 🔧 操作步骤

### 第1步：打开SQL脚本文件
1. 在你的项目文件夹中，找到以下文件：
   ```
   .docs/operate_docs/phase_3/part1/rewrite_tables.sql
   ```

2. 用任意文本编辑器（记事本、VS Code等）打开这个文件

3. 全选文件内容（Ctrl+A），然后复制（Ctrl+C）

### 第2步：在Supabase中执行脚本
1. 回到Supabase的SQL编辑器页面

2. 确保编辑器是空白的（如果有内容，可以全选删除）

3. 将复制的SQL脚本粘贴到编辑器中（Ctrl+V）

4. 你应该能看到完整的建表脚本，包含：
   - 注释说明
   - 4个CREATE TABLE语句
   - 索引创建语句
   - 默认数据插入语句

### 第3步：运行脚本
1. 检查脚本内容没有被截断或损坏

2. 点击右下角的绿色 **RUN**（运行）按钮

3. 等待执行完成，通常需要几秒钟

### 第4步：检查执行结果
执行完成后，你会在页面下方看到结果：

**✅ 成功的情况：**
- 显示绿色的成功提示
- 可能会看到类似 "Success. No rows returned" 的消息
- 或者看到验证查询的结果表格

**❌ 失败的情况：**
- 显示红色的错误提示
- 会有具体的错误信息

### 第5步：验证表创建
为了确保表创建成功，再次运行以下验证查询：

```sql
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN (
  'rewrite_records', 
  'rewrite_segments', 
  'batch_rewrite_tasks', 
  'rewrite_configs'
) 
ORDER BY tablename;
```

你应该能看到4行结果，每行对应一个新创建的表。

### 第6步：检查默认配置数据
运行以下查询确认配置数据插入成功：

```sql
SELECT config_key, config_value, description 
FROM rewrite_configs 
ORDER BY config_key;
```

你应该能看到9条配置记录，包括分段策略、质量阈值等默认设置。

---

## ✅ 检查点
完成这一步后，你应该：
- [x] 成功执行了完整的建表脚本
- [x] 看到4个新表被创建
- [x] 确认了默认配置数据已插入
- [x] 没有收到任何错误信息

## 🔄 下一步
请继续执行 `03-verify-setup.md` 中的验证步骤。

## 🆘 遇到问题？

**问题1：执行时出现权限错误**
```
ERROR: permission denied for table articles
```
**解决方法：**
- 确认你登录的是项目的Owner账号
- 检查RLS（行级安全）设置是否影响了操作
- 尝试在Supabase的Table Editor中手动创建表

**问题2：表已存在错误**
```
ERROR: relation "rewrite_records" already exists
```
**解决方法：**
- 这说明表已经被创建过了
- 可以跳过这一步，直接进行验证
- 或者先删除现有表（谨慎操作）

**问题3：外键约束错误**
```
ERROR: relation "articles" does not exist
```
**解决方法：**
- 说明基础表还没有创建
- 需要先完成前面阶段的数据库设置
- 确认articles表确实存在

**问题4：脚本执行到一半停止**
**解决方法：**
- 检查网络连接是否稳定
- 刷新页面后重新执行
- 分段执行脚本（一次执行一个CREATE TABLE）

## 💡 小贴士
- 如果不确定是否执行成功，可以多次运行验证查询
- SQL脚本是幂等的，重复执行不会有问题（除了插入数据部分）
- 保存好这个SQL脚本，以后可能需要在其他环境中使用