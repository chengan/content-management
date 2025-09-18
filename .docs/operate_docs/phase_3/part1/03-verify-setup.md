# 步骤3：验证数据库设置

## 🎯 目标
验证改写模块的数据库表创建成功，确保所有表结构和数据都正确。

## ⏰ 预计时间
3-5分钟

## 📋 前置条件
- 已完成步骤2的SQL脚本执行
- 仍在Supabase的SQL编辑器页面

## 🔧 详细验证步骤

### 第1步：检查表结构
运行以下查询，查看每个表的详细结构：

```sql
-- 检查rewrite_records表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'rewrite_records' 
ORDER BY ordinal_position;
```

**预期结果：** 应该看到约16个字段，包括id、article_id、original_title等。

### 第2步：检查索引是否创建
```sql
-- 检查所有改写相关表的索引
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename IN (
  'rewrite_records', 
  'rewrite_segments', 
  'batch_rewrite_tasks', 
  'rewrite_configs'
)
ORDER BY tablename, indexname;
```

**预期结果：** 应该看到多个索引，每个表都有对应的索引。

### 第3步：检查外键约束
```sql
-- 检查外键关系是否正确建立
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN (
    'rewrite_records', 
    'rewrite_segments'
  );
```

**预期结果：** 应该看到外键关系：
- rewrite_records.article_id → articles.id
- rewrite_segments.rewrite_record_id → rewrite_records.id

### 第4步：验证配置数据
```sql
-- 检查所有配置项
SELECT 
  config_key,
  config_value,
  description,
  is_active
FROM rewrite_configs 
ORDER BY config_key;
```

**预期结果：** 应该看到9条配置记录：
- ai_model
- batch_size  
- max_retries
- max_segment_length
- min_segment_length
- quality_threshold
- request_timeout
- segment_strategy
- style_templates

### 第5步：测试数据插入
让我们测试一下是否可以向新表中插入数据：

```sql
-- 测试插入一条配置（不会真正插入，只是测试语法）
EXPLAIN (FORMAT TEXT) 
INSERT INTO rewrite_configs (config_key, config_value, description) 
VALUES ('test_key', '"test_value"', 'Test configuration');
```

**预期结果：** 应该显示执行计划，而不是错误信息。

### 第6步：最终完整性检查
```sql
-- 获取所有改写相关表的统计信息
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserted_rows,
  n_tup_upd as updated_rows,
  n_tup_del as deleted_rows
FROM pg_stat_user_tables 
WHERE tablename IN (
  'rewrite_records', 
  'rewrite_segments', 
  'batch_rewrite_tasks', 
  'rewrite_configs'
)
ORDER BY tablename;
```

**预期结果：** 
- rewrite_configs表应该显示inserted_rows = 9（默认配置数据）
- 其他表的inserted_rows应该为0

---

## ✅ 完整检查清单

请确认以下每一项都正确：

### 表创建检查
- [x] `rewrite_records` 表已创建，包含所有必需字段
- [x] `rewrite_segments` 表已创建，包含所有必需字段
- [x] `batch_rewrite_tasks` 表已创建，包含所有必需字段
- [x] `rewrite_configs` 表已创建，包含所有必需字段

### 索引检查
- [x] 每个表都有对应的索引
- [x] 外键字段都有索引
- [x] 常用查询字段都有索引

### 数据检查
- [x] rewrite_configs表包含9条默认配置
- [x] 所有配置值都是有效的JSON格式
- [x] is_active字段默认为true

### 关系检查
- [x] rewrite_records表正确引用articles表
- [x] rewrite_segments表正确引用rewrite_records表
- [x] 外键约束已正确建立

## 🎉 成功！

如果以上所有检查都通过了，恭喜你！第一阶段的数据库设置已经完成。

## 📊 设置总结

你已经成功创建了以下数据库资源：

**新增表（4个）：**
1. `rewrite_records` - 存储文章改写记录
2. `rewrite_segments` - 存储段落改写详情  
3. `batch_rewrite_tasks` - 管理批量改写任务
4. `rewrite_configs` - 系统配置管理

**新增索引（12个）：**
- 优化查询性能的各种索引

**默认配置（9项）：**
- 改写算法的各种配置参数

## 🔄 下一步工作

现在数据库设置完成，可以继续进行：
1. **第二阶段**：后端API开发
2. **第三阶段**：前端界面开发
3. **第四阶段**：状态管理和API集成

## 🆘 验证失败怎么办？

如果任何验证步骤失败：

1. **重新检查步骤2** - 确认SQL脚本完全执行成功
2. **查看错误信息** - 仔细阅读Supabase返回的错误消息
3. **分段执行** - 可以尝试分别执行每个CREATE TABLE语句
4. **寻求帮助** - 将错误信息和验证结果截图，向开发团队求助

## 💡 小贴士

- 保存好验证查询，以后可以用来检查数据库状态
- 如果以后需要清理数据，记住表之间的依赖关系
- 这些配置可以根据实际使用情况进行调整
- 建议定期备份数据库，特别是在开发阶段