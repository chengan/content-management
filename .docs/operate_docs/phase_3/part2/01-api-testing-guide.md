# API测试指南 - 改写模块接口测试

## 🎯 测试目标

验证改写模块的7个API接口功能是否正常，确保所有核心功能可用。

## ⚡ 快速开始

### 前置条件
1. 确保开发服务器运行：`pnpm dev`
2. 确保第一阶段的数据库已设置完成
3. 建议配置OpenRouter API密钥以获得最佳效果

### 测试工具推荐
- **Postman** (推荐)
- **Thunder Client** (VS Code插件)
- **curl命令** (命令行)
- **浏览器开发者工具**

## 📝 API测试清单

### 1. 配置管理API测试

#### 1.1 获取所有配置
```bash
GET http://localhost:3000/api/rewrite/config
```

**预期结果**:
- ✅ 返回9项默认配置
- ✅ 配置按类别分组显示
- ✅ 包含AI设置、分段、质量、性能等配置

#### 1.2 获取单个配置
```bash
GET http://localhost:3000/api/rewrite/config?key=segment_strategy
```

**预期结果**:
- ✅ 返回指定配置项详细信息
- ✅ 包含key、value、description、isActive等字段

#### 1.3 更新配置
```bash
PUT http://localhost:3000/api/rewrite/config
Content-Type: application/json

{
  "key": "max_segment_length",
  "value": 1200,
  "description": "每个段落的最大字符数（已调整）"
}
```

**预期结果**:
- ✅ 配置更新成功
- ✅ 返回更新后的配置信息

### 2. 文章分段分析API测试

#### 2.1 语义分段测试
```bash
POST http://localhost:3000/api/rewrite/analyze-segments
Content-Type: application/json

{
  "articleId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "人工智能技术正在快速发展。它在各个领域都有着广泛的应用。从医疗保健到金融服务，从教育到娱乐，AI正在改变我们的生活方式。\n\n然而，AI技术的发展也带来了一些挑战。比如就业问题、隐私问题和伦理问题。我们需要在享受AI带来便利的同时，也要考虑这些潜在的风险。\n\n总的来说，AI是一把双刃剑。正确使用它可以造福人类，但如果使用不当，也可能带来负面影响。因此，我们需要建立相应的法律法规和伦理规范。",
  "segmentStrategy": "semantic",
  "maxSegmentLength": 800,
  "minSegmentLength": 200
}
```

**预期结果**:
- ✅ 成功分段，返回2-4个段落
- ✅ 每个段落包含id、order、originalContent、wordCount
- ✅ 段落长度在指定范围内
- ✅ 保持语义完整性

#### 2.2 长度分段测试
```bash
POST http://localhost:3000/api/rewrite/analyze-segments
Content-Type: application/json

{
  "articleId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "这是一个很长的文章内容，用于测试长度分段功能...",
  "segmentStrategy": "length",
  "maxSegmentLength": 500,
  "minSegmentLength": 300
}
```

**预期结果**:
- ✅ 按长度均匀分段
- ✅ 尽量在句子结尾处分割
- ✅ 段落数量合理

#### 2.3 结构分段测试
```bash
POST http://localhost:3000/api/rewrite/analyze-segments
Content-Type: application/json

{
  "articleId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "一、引言\n人工智能是未来的趋势...\n\n二、主要应用\n1. 医疗领域\nAI在医疗方面...\n2. 教育领域\n教育AI的发展...\n\n三、总结\n综合来看...",
  "segmentStrategy": "structure"
}
```

**预期结果**:
- ✅ 按标题和结构分段
- ✅ 保持文章逻辑结构
- ✅ 每个部分成为独立段落

### 3. 分段改写API测试

#### 3.1 基础改写测试
```bash
POST http://localhost:3000/api/rewrite/rewrite-segments
Content-Type: application/json

{
  "articleId": "550e8400-e29b-41d4-a716-446655440000",
  "segments": [
    {
      "id": "segment_001",
      "content": "人工智能技术正在快速发展，它在各个领域都有着广泛的应用。",
      "order": 1
    },
    {
      "id": "segment_002", 
      "content": "然而，AI技术的发展也带来了一些挑战，比如就业问题和隐私问题。",
      "order": 2
    }
  ],
  "style": "lidan"
}
```

**预期结果**:
- ✅ 成功改写所有段落
- ✅ 改写内容体现李诞风格
- ✅ 包含质量评分
- ✅ 显示API模式（mock或real）

#### 3.2 自定义风格配置测试
```bash
POST http://localhost:3000/api/rewrite/rewrite-segments
Content-Type: application/json

{
  "articleId": "550e8400-e29b-41d4-a716-446655440000",
  "segments": [
    {
      "id": "segment_001",
      "content": "工作是生活的一部分，我们需要在工作中找到意义和价值。",
      "order": 1
    }
  ],
  "style": "lidan",
  "styleConfig": {
    "intensity": "strong",
    "focusAreas": ["humor", "philosophy", "self-reflection"]
  }
}
```

**预期结果**:
- ✅ 强烈的李诞风格特征
- ✅ 更多哲学思考和自我反思
- ✅ 幽默元素明显

### 4. 段落整合API测试

#### 4.1 基础整合测试
```bash
POST http://localhost:3000/api/rewrite/integrate-segments
Content-Type: application/json

{
  "articleId": "550e8400-e29b-41d4-a716-446655440000",
  "rewrittenSegments": [
    {
      "id": "segment_001",
      "rewrittenContent": "说起来，人工智能这事儿吧，发展得确实挺快。各个领域都能看到它的身影，不过这也就那么回事。",
      "order": 1
    },
    {
      "id": "segment_002",
      "rewrittenContent": "朋友们，AI发展是好事，但也带来了麻烦。就业问题、隐私问题，这些都挺让人头疼的。人生就是这样，有好有坏。",
      "order": 2
    }
  ]
}
```

**预期结果**:
- ✅ 段落按顺序整合
- ✅ 添加适当的过渡词
- ✅ 生成完整文章
- ✅ 提供统计信息

#### 4.2 格式控制测试
```bash
POST http://localhost:3000/api/rewrite/integrate-segments
Content-Type: application/json

{
  "articleId": "550e8400-e29b-41d4-a716-446655440000",
  "rewrittenSegments": [...],
  "formatStyle": "compact",
  "optimizeTransitions": true
}
```

**预期结果**:
- ✅ 紧凑格式（单换行符）
- ✅ 优化了段落衔接
- ✅ 自然的文章流畅度

### 5. 质量评估API测试

#### 5.1 基础质量评估
```bash
POST http://localhost:3000/api/rewrite/evaluate-quality
Content-Type: application/json

{
  "originalContent": "人工智能技术正在快速发展，它在各个领域都有着广泛的应用。",
  "rewrittenContent": "说起来，人工智能这事儿吧，发展得确实挺快。各个领域都能看到它的身影，不过这也就那么回事。"
}
```

**预期结果**:
- ✅ 综合评分（0-1）
- ✅ 四维度详细评分：原创度、流畅度、风格一致性、可读性
- ✅ 等级评价（A+到D）
- ✅ 具体改进建议
- ✅ 详细分析数据

#### 5.2 不同评估类型测试
```bash
POST http://localhost:3000/api/rewrite/evaluate-quality
Content-Type: application/json

{
  "originalContent": "...",
  "rewrittenContent": "...",
  "evaluationType": "style-focused",
  "weightConfig": {
    "originality": 0.2,
    "fluency": 0.3,
    "styleConsistency": 0.4,
    "readability": 0.1
  }
}
```

**预期结果**:
- ✅ 按自定义权重计算评分
- ✅ 风格导向的评估结果
- ✅ 相应的建议内容

### 6. 改写历史API测试

#### 6.1 查询历史记录
```bash
GET http://localhost:3000/api/rewrite/history?page=1&limit=10
```

**预期结果**:
- ✅ 返回改写历史列表
- ✅ 支持分页
- ✅ 包含文章信息和改写详情

#### 6.2 创建历史记录
```bash
POST http://localhost:3000/api/rewrite/history
Content-Type: application/json

{
  "articleId": "550e8400-e29b-41d4-a716-446655440000",
  "originalTitle": "人工智能的发展趋势",
  "rewrittenTitle": "说起来，人工智能这事儿确实挺有意思",
  "originalContent": "人工智能技术正在快速发展...",
  "rewrittenContent": "说起来，人工智能这事儿吧...",
  "style": "lidan",
  "qualityScore": 0.85,
  "segmentCount": 3
}
```

**预期结果**:
- ✅ 成功创建历史记录
- ✅ 返回记录ID和基本信息

#### 6.3 筛选和搜索测试
```bash
GET http://localhost:3000/api/rewrite/history?status=completed&search=人工智能&sortBy=quality_score&order=desc
```

**预期结果**:
- ✅ 按条件筛选结果
- ✅ 搜索功能正常
- ✅ 排序功能正常

### 7. 批量任务API测试

#### 7.1 创建批量任务
```bash
POST http://localhost:3000/api/rewrite/batch
Content-Type: application/json

{
  "taskName": "测试批量改写任务",
  "description": "测试批量改写功能",
  "articleIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ],
  "style": "lidan",
  "config": {
    "batchSize": 2,
    "maxRetries": 3
  }
}
```

**预期结果**:
- ✅ 成功创建批量任务
- ✅ 验证文章ID存在
- ✅ 返回任务ID和详情

#### 7.2 查询任务列表
```bash
GET http://localhost:3000/api/rewrite/batch?page=1&limit=5
```

**预期结果**:
- ✅ 返回任务列表
- ✅ 显示任务状态和进度

#### 7.3 更新任务状态
```bash
PUT http://localhost:3000/api/rewrite/batch
Content-Type: application/json

{
  "taskId": "task_id_here",
  "status": "running",
  "processedArticles": 1,
  "successfulArticles": 1,
  "progress": 50
}
```

**预期结果**:
- ✅ 任务状态更新成功
- ✅ 进度信息正确

#### 7.4 取消任务
```bash
DELETE http://localhost:3000/api/rewrite/batch?taskId=task_id_here&action=cancel
```

**预期结果**:
- ✅ 任务状态变为cancelled
- ✅ 设置完成时间

## ✅ 完整测试流程

### 测试场景1：完整改写流程
1. **配置检查** → 确认系统配置正常
2. **分段分析** → 将文章分为合适段落  
3. **段落改写** → 改写各个段落
4. **质量评估** → 评估改写质量
5. **段落整合** → 整合成完整文章
6. **历史保存** → 保存改写记录

### 测试场景2：批量处理流程
1. **创建任务** → 选择多篇文章创建批量任务
2. **任务监控** → 查询任务进度和状态
3. **状态更新** → 模拟任务执行过程
4. **任务完成** → 确认任务完成状态

## 🔍 测试验证要点

### 功能验证
- ✅ 所有API返回正确的HTTP状态码
- ✅ 返回数据格式符合预期
- ✅ 业务逻辑正确执行
- ✅ 错误处理机制有效

### 数据验证
- ✅ 改写内容体现李诞风格特征
- ✅ 质量评分合理（0.3-0.9区间）
- ✅ 段落分割保持内容完整
- ✅ 整合后文章流畅自然

### 性能验证
- ✅ API响应时间 < 5秒
- ✅ 分段处理速度合理
- ✅ 并行改写提高效率
- ✅ 大文章处理无超时

## 🚨 常见测试问题

### 1. API返回500错误
**原因**: 数据库表未创建或配置错误
**解决**: 确认第一阶段数据库设置已完成

### 2. 改写效果不佳
**原因**: 未配置OpenRouter API密钥
**解决**: 添加 `OPENROUTER_API_KEY` 到环境变量

### 3. 分段数量异常
**原因**: 文章长度或参数设置不合理
**解决**: 调整 `maxSegmentLength` 和 `minSegmentLength` 参数

### 4. 质量评分过低
**原因**: 模拟改写效果有限
**解决**: 配置真实API密钥获得更好效果

## 📊 测试报告模板

```markdown
## API测试报告

### 测试环境
- 时间：2024-XX-XX
- 版本：Phase 3 Part 2
- API密钥：[已配置/未配置]

### 测试结果
| API接口 | 状态 | 响应时间 | 备注 |
|---------|------|----------|------|
| 配置管理 | ✅ | 50ms | 正常 |
| 分段分析 | ✅ | 200ms | 3个段落 |
| 段落改写 | ✅ | 1.5s | 李诞风格明显 |
| 段落整合 | ✅ | 100ms | 衔接自然 |
| 质量评估 | ✅ | 150ms | 评分0.78 |
| 历史管理 | ✅ | 80ms | CRUD正常 |
| 批量任务 | ✅ | 120ms | 状态管理正常 |

### 测试结论
- ✅ 所有核心功能正常
- ✅ API性能满足要求  
- ✅ 李诞风格改写效果良好
- ✅ 可以进行下一阶段开发
```

## 🎉 测试完成

完成所有API测试后，您将验证：
- ✅ 7个API接口功能完整可用
- ✅ 改写系统核心逻辑正确
- ✅ 李诞风格特征明显
- ✅ 质量评估体系有效
- ✅ 数据管理功能完善

**恭喜！第二阶段API开发已通过测试，可以开始前端开发了！** 🚀