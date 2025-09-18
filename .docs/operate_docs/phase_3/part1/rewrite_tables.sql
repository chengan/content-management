-- ==================================================
-- AI智能改写模块 - 数据库表创建脚本
-- 执行前请确保已连接到正确的Supabase项目
-- ==================================================

-- 1. 改写记录表（rewrite_records）
-- 存储文章改写的主要信息
CREATE TABLE rewrite_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  original_title VARCHAR(500) NOT NULL,
  rewritten_title VARCHAR(500) NOT NULL,
  original_content TEXT NOT NULL,
  rewritten_content TEXT NOT NULL,
  style VARCHAR(50) NOT NULL DEFAULT 'lidan',
  custom_prompt TEXT,
  
  -- 分段改写相关字段
  segments JSONB, -- 存储分段信息
  segment_strategy VARCHAR(20) DEFAULT 'semantic', -- 分段策略：semantic/length/structure
  rewrite_method VARCHAR(20) DEFAULT 'segmented', -- 改写方法：segmented/complete
  
  -- 质量评估字段
  quality_score DECIMAL(3,2),
  style_consistency DECIMAL(3,2),
  content_completeness DECIMAL(3,2),
  readability DECIMAL(3,2),
  
  -- AI模型信息
  ai_model VARCHAR(100) DEFAULT 'openrouter/anthropic/claude-3-haiku',
  processing_time INTEGER, -- 处理时间（毫秒）
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 改写记录表索引
CREATE INDEX idx_rewrite_records_article_id ON rewrite_records(article_id);
CREATE INDEX idx_rewrite_records_style ON rewrite_records(style);
CREATE INDEX idx_rewrite_records_quality ON rewrite_records(quality_score);
CREATE INDEX idx_rewrite_records_created ON rewrite_records(created_at);

-- 2. 分段详情表（rewrite_segments）
-- 存储每个段落的改写详情
CREATE TABLE rewrite_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rewrite_record_id UUID REFERENCES rewrite_records(id) ON DELETE CASCADE,
  segment_order INTEGER NOT NULL,
  original_content TEXT NOT NULL,
  rewritten_content TEXT NOT NULL,
  segment_type VARCHAR(20) DEFAULT 'paragraph', -- paragraph/title/conclusion
  
  -- 段落质量评估
  quality_score DECIMAL(3,2),
  processing_time INTEGER,
  retry_count INTEGER DEFAULT 0,
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 分段详情表索引
CREATE INDEX idx_rewrite_segments_record_id ON rewrite_segments(rewrite_record_id);
CREATE INDEX idx_rewrite_segments_order ON rewrite_segments(rewrite_record_id, segment_order);

-- 3. 批量改写任务表（batch_rewrite_tasks）
-- 管理批量改写任务
CREATE TABLE batch_rewrite_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200),
  article_ids UUID[] NOT NULL,
  style VARCHAR(50) NOT NULL DEFAULT 'lidan',
  custom_prompt TEXT,
  
  -- 任务状态
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- 进度信息
  total_articles INTEGER NOT NULL,
  completed_articles INTEGER DEFAULT 0,
  failed_articles INTEGER DEFAULT 0,
  
  -- 配置信息
  config JSONB DEFAULT '{}',
  
  -- 时间信息
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 错误信息
  error_message TEXT
);

-- 批量任务表索引
CREATE INDEX idx_batch_tasks_status ON batch_rewrite_tasks(status);
CREATE INDEX idx_batch_tasks_created ON batch_rewrite_tasks(created_at);

-- 4. 改写配置表（rewrite_configs）
-- 存储系统配置信息
CREATE TABLE rewrite_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 配置表索引
CREATE INDEX idx_rewrite_configs_key ON rewrite_configs(config_key);
CREATE INDEX idx_rewrite_configs_active ON rewrite_configs(is_active);

-- 5. 插入默认配置数据
INSERT INTO rewrite_configs (config_key, config_value, description) VALUES
('segment_strategy', '"semantic"', '默认分段策略'),
('max_segment_length', '400', '最大段落长度'),
('min_segment_length', '50', '最小段落长度'),
('batch_size', '5', '批量改写并发数'),
('quality_threshold', '0.7', '质量阈值'),
('style_templates', '{"lidan": "李诞风格改写"}', '风格模板配置'),
('ai_model', '"openrouter/anthropic/claude-3-haiku"', '默认AI模型'),
('request_timeout', '30000', '请求超时时间(毫秒)'),
('max_retries', '3', '最大重试次数');

-- 6. 更新articles表，添加改写状态字段（如果需要）
-- 检查status字段是否已包含rewritten状态
DO $$
BEGIN
    -- 这里不需要修改articles表，因为它已经有status字段包含'rewritten'状态
    RAISE NOTICE 'Articles table already has rewrite status field';
END
$$;

-- ==================================================
-- 表创建完成！
-- 接下来请执行验证查询以确保所有表都创建成功
-- ==================================================

-- 验证查询（可选执行）
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

-- 检查默认配置是否插入成功
SELECT config_key, config_value, description 
FROM rewrite_configs 
ORDER BY config_key;