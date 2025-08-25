-- 第二阶段数据库扩展 - 采集功能重构（修复版）
-- 请在Supabase SQL Editor中执行以下命令

-- 1. 扩展 collect_sources 表，支持用户自定义采集源
ALTER TABLE collect_sources 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS user_created BOOLEAN DEFAULT true;

-- 更新现有数据，标记为系统预设
UPDATE collect_sources SET user_created = false WHERE user_created IS NULL;

-- 2. 创建 collect_results 表，存储临时采集结果
CREATE TABLE IF NOT EXISTS collect_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT,
  source VARCHAR(100) NOT NULL,
  source_url VARCHAR(500),
  author VARCHAR(100),
  publish_time TIMESTAMP,
  collect_time TIMESTAMP DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(50),
  read_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  source_id UUID REFERENCES collect_sources(id),
  collect_batch_id UUID NOT NULL, -- 批次ID，同一次采集任务的结果有相同的batch_id
  keyword VARCHAR(200), -- 关键词采集时使用
  is_selected BOOLEAN DEFAULT false, -- 是否被用户选中
  added_to_materials BOOLEAN DEFAULT false, -- 是否已添加到素材库
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_collect_results_batch_id ON collect_results(collect_batch_id);
CREATE INDEX IF NOT EXISTS idx_collect_results_source_id ON collect_results(source_id);
CREATE INDEX IF NOT EXISTS idx_collect_results_collect_time ON collect_results(collect_time);
CREATE INDEX IF NOT EXISTS idx_collect_results_added ON collect_results(added_to_materials);

-- 4. 创建 collect_batches 表，管理采集批次信息
CREATE TABLE IF NOT EXISTS collect_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  collect_type VARCHAR(20) CHECK (collect_type IN ('keyword', 'full')) NOT NULL,
  keyword VARCHAR(200), -- 关键词采集时使用
  source_ids UUID[] DEFAULT '{}', -- 采集的数据源ID列表
  total_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. 添加外键约束
ALTER TABLE collect_results 
ADD CONSTRAINT fk_collect_results_batch 
FOREIGN KEY (collect_batch_id) REFERENCES collect_batches(id) ON DELETE CASCADE;

-- 6. 为 collect_sources 表添加唯一约束（如果不存在）
DO $$ 
BEGIN
    -- 检查是否已存在hash_id的唯一约束
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_hash_id' 
        AND table_name = 'collect_sources'
    ) THEN
        ALTER TABLE collect_sources ADD CONSTRAINT unique_hash_id UNIQUE (hash_id);
    END IF;
END $$;

-- 7. 插入一些示例采集源数据（使用改进的插入逻辑）
DO $$ 
BEGIN
    -- 微信热文总榜
    IF NOT EXISTS (SELECT 1 FROM collect_sources WHERE hash_id = 'WnBe01o371') THEN
        INSERT INTO collect_sources (name, platform, hash_id, category, description, user_created, config, is_active) 
        VALUES ('微信热文总榜', '微信', 'WnBe01o371', '社交媒体', '微信公众号热门文章总排行', false, '{}', true);
    ELSE
        UPDATE collect_sources SET 
            name = '微信热文总榜',
            category = '社交媒体',
            description = '微信公众号热门文章总排行',
            user_created = false
        WHERE hash_id = 'WnBe01o371';
    END IF;

    -- 知乎热榜
    IF NOT EXISTS (SELECT 1 FROM collect_sources WHERE hash_id = 'mproPpoq6O') THEN
        INSERT INTO collect_sources (name, platform, hash_id, category, description, user_created, config, is_active) 
        VALUES ('知乎热榜', '知乎', 'mproPpoq6O', '知识社区', '知乎热门内容排行', false, '{}', true);
    ELSE
        UPDATE collect_sources SET 
            name = '知乎热榜',
            category = '知识社区',
            description = '知乎热门内容排行',
            user_created = false
        WHERE hash_id = 'mproPpoq6O';
    END IF;

    -- 微博热搜
    IF NOT EXISTS (SELECT 1 FROM collect_sources WHERE hash_id = 'KqndgxeLl9') THEN
        INSERT INTO collect_sources (name, platform, hash_id, category, description, user_created, config, is_active) 
        VALUES ('微博热搜', '微博', 'KqndgxeLl9', '社交媒体', '微博热门话题和内容', false, '{}', true);
    ELSE
        UPDATE collect_sources SET 
            name = '微博热搜',
            category = '社交媒体',
            description = '微博热门话题和内容',
            user_created = false
        WHERE hash_id = 'KqndgxeLl9';
    END IF;
END $$;

-- 8. 添加表注释
COMMENT ON TABLE collect_results IS '采集结果临时存储表';
COMMENT ON TABLE collect_batches IS '采集批次管理表';
COMMENT ON COLUMN collect_results.collect_batch_id IS '采集批次ID，关联collect_batches表';
COMMENT ON COLUMN collect_results.keyword IS '关键词采集时使用的搜索词';
COMMENT ON COLUMN collect_results.is_selected IS '用户是否选中此条结果';
COMMENT ON COLUMN collect_results.added_to_materials IS '是否已添加到素材库';