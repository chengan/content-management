# 故障排除指南

## 🚨 常见问题快速解决

### 问题分类索引
- [🔌 API连接问题](#api连接问题)
- [🤖 AI改写问题](#ai改写问题) 
- [💾 数据库问题](#数据库问题)
- [⚡ 性能问题](#性能问题)
- [🎭 改写效果问题](#改写效果问题)
- [📊 质量评估问题](#质量评估问题)
- [⚙️ 配置问题](#配置问题)

---

## 🔌 API连接问题

### ❌ 问题1: API返回500内部错误

**症状表现**:
```json
{
  "success": false,
  "error": "服务器内部错误"
}
```

**可能原因**:
1. 数据库连接失败
2. 环境变量未正确配置
3. 数据库表不存在
4. Supabase服务异常

**解决步骤**:

**步骤1**: 检查数据库表
```bash
# 在Supabase SQL编辑器中执行
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('rewrite_records', 'rewrite_segments', 'batch_rewrite_tasks', 'rewrite_configs');
```
预期结果: 应返回4个表名

**步骤2**: 验证环境变量
```bash
# 检查.env.local文件
cat .env.local
```
确认包含:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**步骤3**: 重启开发服务器
```bash
# 停止服务器 (Ctrl+C)
# 重新启动
pnpm dev
```

**步骤4**: 查看服务器日志
检查控制台是否有详细错误信息

---

### ❌ 问题2: API返回404未找到

**症状表现**:
```
Cannot GET /api/rewrite/analyze-segments
```

**可能原因**:
1. API路径输入错误
2. 服务器未启动
3. 文件路径不正确

**解决方案**:

**检查API路径**:
正确的API端点:
- `POST /api/rewrite/analyze-segments`
- `POST /api/rewrite/rewrite-segments`
- `POST /api/rewrite/integrate-segments`
- `POST /api/rewrite/evaluate-quality`
- `GET/POST/DELETE /api/rewrite/history`
- `GET/PUT /api/rewrite/config`
- `GET/POST/PUT/DELETE /api/rewrite/batch`

**验证服务器状态**:
```bash
# 确保服务器在运行
curl http://localhost:3000/api/rewrite/config
```

---

### ❌ 问题3: CORS跨域错误

**症状表现**:
```
Access to fetch at 'http://localhost:3000/api/rewrite/...' from origin '...' has been blocked by CORS policy
```

**解决方案**:
所有API都已配置CORS头，如果仍出现问题：

1. **清除浏览器缓存**
2. **使用OPTIONS预检请求测试**:
   ```bash
   curl -X OPTIONS http://localhost:3000/api/rewrite/config
   ```

---

## 🤖 AI改写问题

### ❌ 问题4: 改写内容质量很差

**症状表现**:
- 改写后的内容缺乏李诞风格
- 内容重复或无意义
- 质量评分很低 (<0.3)

**原因分析**:
当前使用模拟改写模式，效果有限

**解决方案**:

**步骤1**: 配置OpenRouter API密钥
1. 访问 https://openrouter.ai/ 注册账号
2. 获取API密钥
3. 在 `.env.local` 中添加:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```
4. 重启服务器: `pnpm dev`

**步骤2**: 验证API配置
```bash
# 测试改写API，查看返回的apiMode字段
curl -X POST http://localhost:3000/api/rewrite/rewrite-segments \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "test-id",
    "segments": [{"id": "1", "content": "测试内容", "order": 1}],
    "style": "lidan"
  }'
```

预期响应中 `apiMode` 应为 `"real"` 而不是 `"mock"`

---

### ❌ 问题5: OpenRouter API调用失败

**症状表现**:
```json
{
  "error": "OpenRouter API 调用失败: 401 Unauthorized"
}
```

**可能原因**:
1. API密钥无效或过期
2. API密钥格式错误
3. 账户余额不足
4. 请求频率超限

**解决步骤**:

**验证API密钥格式**:
```bash
# 正确格式应该是
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**测试API密钥**:
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**检查账户状态**:
登录OpenRouter控制台查看:
- 账户余额
- API使用量
- 请求限制

---

### ❌ 问题6: 改写速度很慢

**症状表现**:
- 单个段落改写超过10秒
- 批量改写经常超时
- API响应时间过长

**解决方案**:

**调整批处理大小**:
```json
{
  "batchSize": 2,  // 从默认的3减少到2
  "segments": [...]
}
```

**检查网络连接**:
```bash
# 测试到OpenRouter的连接速度
curl -w "@curl-format.txt" -o /dev/null -s https://openrouter.ai/api/v1/models
```

**优化配置参数**:
```json
{
  "key": "request_timeout",
  "value": 30000,  // 增加超时时间到30秒
}
```

---

## 💾 数据库问题

### ❌ 问题7: 表不存在错误

**症状表现**:
```
relation "rewrite_records" does not exist
```

**原因**: 第一阶段数据库设置未完成

**解决方案**:
1. **执行数据库迁移脚本**:
   参考 `.docs/operate_docs/phase_3/part1/` 中的操作指南
   
2. **手动验证表存在**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE 'rewrite_%';
   ```

3. **重新执行建表脚本**:
   运行 `.docs/operate_docs/phase_3/part1/rewrite_tables.sql`

---

### ❌ 问题8: 权限拒绝错误

**症状表现**:
```
permission denied for table rewrite_records
```

**解决方案**:
1. **确认Supabase权限设置**
2. **检查RLS(行级安全)策略**
3. **使用项目Owner账号**

---

## ⚡ 性能问题

### ❌ 问题9: 分段处理速度慢

**症状表现**:
- 长文章分段超时
- 分段API响应时间>5秒

**优化方案**:

**调整分段参数**:
```json
{
  "maxSegmentLength": 1000,  // 减小段落长度
  "minSegmentLength": 400
}
```

**选择合适的分段策略**:
- 长文章使用 `length` 策略
- 结构化文章使用 `structure` 策略
- 一般文章使用 `semantic` 策略

---

### ❌ 问题10: 批量任务处理缓慢

**症状表现**:
- 批量任务长时间卡在 `running` 状态
- 进度更新不及时

**解决方案**:

**减少批量任务大小**:
```json
{
  "articleIds": ["id1", "id2"],  // 每次处理2-5篇文章
  "config": {
    "batchSize": 1  // 减小并行处理数量
  }
}
```

**监控任务状态**:
```bash
# 定期查询任务进度
curl "http://localhost:3000/api/rewrite/batch?status=running"
```

---

## 🎭 改写效果问题

### ❌ 问题11: 改写风格不够明显

**症状表现**:
- 改写后内容与原文差异不大
- 缺乏李诞风格特征
- 风格一致性评分低

**解决方案**:

**调整风格强度**:
```json
{
  "styleConfig": {
    "intensity": "strong",  // 使用强烈风格
    "focusAreas": ["humor", "philosophy", "self-reflection"]
  }
}
```

**使用自定义提示词**:
```json
{
  "customPrompt": "请用李诞的风格改写以下内容，要包含更多幽默和人生感悟"
}
```

**分段改写而不是整篇改写**:
先分段再改写能保证每段都有足够的风格特征

---

### ❌ 问题12: 改写内容连贯性差

**症状表现**:
- 段落间衔接不自然
- 整合后的文章逻辑混乱
- 重复使用相同的过渡词

**解决方案**:

**优化整合参数**:
```json
{
  "optimizeTransitions": true,
  "formatStyle": "standard"
}
```

**手动调整段落顺序**:
确保传入的段落 `order` 字段正确

**使用结构化分段策略**:
保持原文的逻辑结构

---

## 📊 质量评估问题

### ❌ 问题13: 质量评分异常

**症状表现**:
- 所有文章评分都很低
- 评分结果不合理
- 评估维度分数异常

**解决方案**:

**检查评估参数**:
```json
{
  "evaluationType": "comprehensive",  // 使用综合评估
  "weightConfig": {
    "originality": 0.3,
    "fluency": 0.25,
    "styleConsistency": 0.25,
    "readability": 0.2
  }
}
```

**验证输入内容**:
确保原文和改写内容都不为空且有意义

**调整评估类型**:
- 对于风格要求高的使用 `style-focused`
- 对于原创性要求高的使用 `quality-focused`

---

## ⚙️ 配置问题

### ❌ 问题14: 配置更新失败

**症状表现**:
```json
{
  "error": "配置 xxx 更新失败"
}
```

**解决方案**:

**验证配置键名**:
```bash
# 查看所有可用配置
curl "http://localhost:3000/api/rewrite/config"
```

**检查配置值格式**:
```json
{
  "key": "max_segment_length",
  "value": 1500,  // 数值类型
  "dataType": "number"
}
```

**批量更新配置**:
```json
{
  "configs": [
    {
      "key": "batch_size",
      "value": 3,
      "description": "批处理大小"
    }
  ]
}
```

---

### ❌ 问题15: 默认配置丢失

**症状表现**:
- 查询配置返回空结果
- 系统使用硬编码默认值

**解决方案**:

**重新插入默认配置**:
```sql
-- 在Supabase SQL编辑器中执行
INSERT INTO rewrite_configs (config_key, config_value, description) VALUES
('segment_strategy', '"semantic"', '默认分段策略'),
('max_segment_length', '1500', '段落最大长度'),
('min_segment_length', '500', '段落最小长度'),
-- ... 其他配置项
ON CONFLICT (config_key) DO NOTHING;
```

---

## 🔧 调试工具和技巧

### 开发调试

**启用详细日志**:
```bash
# 设置开发环境
NODE_ENV=development pnpm dev
```

**API响应调试**:
```javascript
// 在浏览器控制台中
fetch('/api/rewrite/config')
  .then(r => r.json())
  .then(console.log)
```

**数据库查询调试**:
```sql
-- 查看改写记录统计
SELECT status, COUNT(*) FROM rewrite_records GROUP BY status;

-- 查看配置状态
SELECT config_key, is_active FROM rewrite_configs;
```

### 性能监控

**API响应时间**:
```bash
curl -w "Time: %{time_total}s\n" -o /dev/null -s \
  "http://localhost:3000/api/rewrite/config"
```

**数据库连接测试**:
```javascript
// 在页面控制台执行
console.time('api-test');
fetch('/api/rewrite/config')
  .then(() => console.timeEnd('api-test'));
```

## 📞 获取帮助

### 自助排查清单
1. ✅ 检查开发服务器是否运行
2. ✅ 验证数据库表是否存在
3. ✅ 确认环境变量配置正确
4. ✅ 查看控制台错误日志
5. ✅ 测试API连接状态
6. ✅ 检查网络连接

### 日志收集
遇到问题时，请收集以下信息：
- 错误信息截图
- 浏览器控制台日志
- 服务器终端输出
- 具体的请求参数
- 操作步骤复现

### 常用调试命令
```bash
# 检查端口占用
netstat -an | grep 3000

# 测试API连通性
curl -I http://localhost:3000/api/rewrite/config

# 查看进程状态
ps aux | grep node

# 检查环境变量
echo $NODE_ENV
```

---

## ✅ 问题解决验证

### 验证清单
解决问题后，请验证：
- ✅ API返回正确状态码 (200/201)
- ✅ 改写功能正常工作
- ✅ 质量评估合理
- ✅ 数据库操作正常
- ✅ 配置生效
- ✅ 性能满足要求

### 回归测试
运行基本功能测试确保问题已解决：
```bash
# 测试配置API
curl "http://localhost:3000/api/rewrite/config"

# 测试分段API
curl -X POST "http://localhost:3000/api/rewrite/analyze-segments" \
  -H "Content-Type: application/json" \
  -d '{"articleId":"test","content":"测试内容","segmentStrategy":"semantic"}'
```

---

**🎯 记住：大部分问题都可以通过检查数据库配置、环境变量和API密钥来解决！**

如果问题仍然存在，请仔细检查错误日志中的具体错误信息，通常会有明确的解决提示。