# 第一阶段：数据库设计与基础架构 - 操作指南

## 🎯 阶段目标
完成AI智能改写模块的数据库设计和基础架构准备工作，为后续开发打下坚实基础。

## 📁 文件结构
```
.docs/operate_docs/phase_3/part1/
├── README.md                 # 本文档 - 操作总览
├── rewrite_tables.sql        # 数据库建表SQL脚本
├── 01-prepare-supabase.md    # 步骤1：Supabase准备工作
├── 02-execute-sql.md         # 步骤2：执行SQL脚本
└── 03-verify-setup.md        # 步骤3：验证数据库设置
```

## 🚀 快速开始

### 你需要做的操作
按顺序完成以下3个步骤：

1. **[步骤1：准备Supabase](./01-prepare-supabase.md)**
   - ✅ 登录Supabase控制台
   - ✅ 进入SQL编辑器
   - ✅ 确认基础表存在

2. **[步骤2：执行SQL脚本](./02-execute-sql.md)**
   - ✅ 复制SQL脚本内容
   - ✅ 在Supabase中执行脚本
   - ✅ 确认执行成功

3. **[步骤3：验证设置](./03-verify-setup.md)**
   - ✅ 检查表结构
   - ✅ 验证索引和约束
   - ✅ 确认配置数据

### 预计完成时间
总计：**10-15分钟**

## 🎉 完成后的成果

### 新增数据库表（4个）
- `rewrite_records` - 改写记录主表
- `rewrite_segments` - 分段改写详情表
- `batch_rewrite_tasks` - 批量改写任务表
- `rewrite_configs` - 改写配置表

### 新增代码文件
- `src/types/rewrite.ts` - 改写相关TypeScript类型定义
- `lib/supabase.ts` - 扩展了改写相关的数据转换函数
- `src/contexts/AppContext.tsx` - 更新了状态管理，添加改写相关接口

### 系统配置
- 9项默认改写配置
- 12个数据库索引优化
- 完整的外键约束关系

## ✅ 验证清单

完成后请确认以下每一项：

### 数据库验证
- [ ] 4个改写表全部创建成功
- [ ] 所有外键关系正确建立
- [ ] 索引创建完成
- [ ] 默认配置数据插入成功

### 代码验证
- [ ] TypeScript类型文件无语法错误
- [ ] Supabase服务层扩展成功
- [ ] AppContext更新无编译错误

## 📋 第一阶段任务完成状态

根据 `.docs/plans/phase_3.md` 中的任务清单：

### Task 1.1 ✅ 数据库表结构设计
- [x] 创建`rewrite_records`表（改写记录主表）
- [x] 创建`rewrite_segments`表（分段改写详情表）
- [x] 创建`batch_rewrite_tasks`表（批量改写任务表）
- [x] 创建`rewrite_configs`表（改写配置表）
- [x] 所有表结构创建成功
- [x] 外键关系正确建立
- [x] 索引优化完成

### Task 1.2 ✅ 数据库迁移脚本
- [x] 编写表创建SQL脚本
- [x] 编写索引创建脚本
- [x] 插入默认配置数据
- [x] 编写验证查询脚本
- [x] 迁移脚本执行成功
- [x] 默认数据插入正确

## 🔄 下一步工作

第一阶段完成后，可以继续进行：

### 第二阶段：后端API开发（预计2天）
- 创建API路由基础结构
- 实现文章分段分析API
- 实现分段改写API
- 实现段落整合API
- 实现改写质量评估API
- 实现改写历史和配置API

## 🆘 常见问题

### Q1: SQL脚本执行失败怎么办？
**A:** 查看具体错误信息，常见原因：
- 权限不足：确认你是项目Owner
- 表已存在：可能之前已经创建过，检查验证步骤
- 外键约束：确认articles表存在

### Q2: TypeScript报错怎么办？
**A:** 运行类型检查命令：
```bash
npx tsc --noEmit
```
根据错误信息修复类型问题。

### Q3: 如何回滚这些更改？
**A:** 如果需要清理数据库：
```sql
-- 注意：这会删除所有相关数据！
DROP TABLE IF EXISTS rewrite_segments CASCADE;
DROP TABLE IF EXISTS rewrite_records CASCADE;
DROP TABLE IF EXISTS batch_rewrite_tasks CASCADE;
DROP TABLE IF EXISTS rewrite_configs CASCADE;
```

## 💡 开发提醒

1. **保留SQL脚本** - 其他环境部署时会用到
2. **备份数据库** - 开发阶段建议定期备份
3. **测试环境** - 建议先在测试环境验证
4. **团队同步** - 确保团队其他成员了解数据库变更

---

**🎊 恭喜！第一阶段基础架构搭建完成！**

现在你已经为AI智能改写模块搭建好了坚实的数据基础，可以开始后续的API开发工作了。