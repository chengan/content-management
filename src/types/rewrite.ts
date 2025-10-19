// AI智能改写模块类型定义

// 质量评分接口
export interface QualityScore {
  overallScore: number;
  originality: number;
  fluency: number;
  styleConsistency: number;
  readability: number;
  suggestions: string[];
}

// 分段策略 - 仅支持AI智能分段
export type SegmentStrategy = 'ai';

// 改写方法
export type RewriteMethod = 'segmented' | 'complete';

// 段落类型
export type SegmentType = 'paragraph' | 'title' | 'conclusion';

// 改写风格
export type RewriteStyle = 'lidan' | 'professional' | 'casual' | 'academic';

// 批量任务状态
export type BatchTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// 改写记录接口
export interface RewriteRecord {
  id: string;
  articleId: string;
  originalTitle: string;
  rewrittenTitle: string;
  originalContent: string;
  rewrittenContent: string;
  style: RewriteStyle;
  customPrompt?: string;
  
  // 分段改写相关
  segments?: RewriteSegmentInfo[];
  segmentStrategy: SegmentStrategy;
  rewriteMethod: RewriteMethod;
  
  // 质量评估
  qualityScore?: number;
  styleConsistency?: number;
  contentCompleteness?: number;
  readability?: number;
  
  // AI模型信息
  aiModel?: string;
  processingTime?: number; // 毫秒
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 数据库格式的改写记录（snake_case）
export interface DatabaseRewriteRecord {
  id: string;
  article_id: string;
  original_title: string;
  rewritten_title: string;
  original_content: string;
  rewritten_content: string;
  style: string;
  custom_prompt?: string;
  
  segments?: any; // JSONB
  segment_strategy: string;
  rewrite_method: string;
  
  quality_score?: number;
  style_consistency?: number;
  content_completeness?: number;
  readability?: number;
  
  ai_model?: string;
  processing_time?: number;
  
  created_at: string;
  updated_at: string;
}

// 分段信息接口
export interface RewriteSegmentInfo {
  id: string;
  content: string;
  order: number;
  type: SegmentType;
}

// 分段详情接口
export interface RewriteSegment {
  id: string;
  rewriteRecordId: string;
  segmentOrder: number;
  originalContent: string;
  rewrittenContent: string;
  segmentType: SegmentType;
  
  // 段落质量评估
  qualityScore?: number;
  processingTime?: number;
  retryCount: number;
  
  // 元数据
  metadata: Record<string, any>;
  
  createdAt: string;
}

// 前端段落数据接口（用于UI显示）
export interface SegmentData {
  id: string;
  order: number;
  originalContent: string;
  rewrittenContent?: string;
  wordCount: number;
  rewriteStatus: 'pending' | 'processing' | 'completed' | 'failed';
  qualityScore?: number;
  processingTime?: number;
  reason?: string; // AI分段的理由
}

// 数据库格式的分段详情（snake_case）
export interface DatabaseRewriteSegment {
  id: string;
  rewrite_record_id: string;
  segment_order: number;
  original_content: string;
  rewritten_content: string;
  segment_type: string;
  
  quality_score?: number;
  processing_time?: number;
  retry_count: number;
  
  metadata: Record<string, any>;
  
  created_at: string;
}

// 批量改写任务接口
export interface BatchRewriteTask {
  id: string;
  name?: string;
  articleIds: string[];
  style: RewriteStyle;
  customPrompt?: string;
  
  // 任务状态
  status: BatchTaskStatus;
  
  // 进度信息
  totalArticles: number;
  completedArticles: number;
  failedArticles: number;
  
  // 配置信息
  config: Record<string, any>;
  
  // 时间信息
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  
  // 错误信息
  errorMessage?: string;
}

// 数据库格式的批量任务（snake_case）
export interface DatabaseBatchRewriteTask {
  id: string;
  name?: string;
  article_ids: string[];
  style: string;
  custom_prompt?: string;
  
  status: string;
  
  total_articles: number;
  completed_articles: number;
  failed_articles: number;
  
  config: Record<string, any>;
  
  started_at?: string;
  completed_at?: string;
  created_at: string;
  
  error_message?: string;
}

// 改写配置接口
export interface RewriteConfig {
  id: string;
  configKey: string;
  configValue: any;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 数据库格式的配置（snake_case）
export interface DatabaseRewriteConfig {
  id: string;
  config_key: string;
  config_value: any;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API请求接口

// 分段分析请求
export interface AnalyzeSegmentsRequest {
  articleId: string;
  content: string;
  segmentStrategy: SegmentStrategy;
  maxSegmentLength?: number;
  minSegmentLength?: number;
  // AI分段专用参数
  aiModel?: string;  // 用于AI分段的模型ID
}

// 分段分析响应
export interface AnalyzeSegmentsResponse {
  success: boolean;
  data: {
    segments: Array<{
      id: string;
      content: string;
      order: number;
      type: SegmentType;
      wordCount: number;
    }>;
    totalSegments: number;
    estimatedTime: number; // 预估改写时间（秒）
  };
  message?: string;
}

// 分段改写请求
export interface RewriteSegmentsRequest {
  articleId: string;
  segments: Array<{
    id: string;
    content: string;
    order: number;
  }>;
  style: RewriteStyle;
  customPrompt?: string;
  batchSize?: number;
  // 模型选择参数
  aiModel?: string;  // 用于改写的模型ID
}

// 分段改写响应
export interface RewriteSegmentsResponse {
  success: boolean;
  data: {
    rewriteRecordId: string;
    segments: Array<{
      id: string;
      originalContent: string;
      rewrittenContent: string;
      qualityScore: number;
      processingTime: number;
    }>;
    overallQuality: {
      qualityScore: number;
      styleConsistency: number;
      contentCompleteness: number;
      readability: number;
    };
  };
  message?: string;
}

// 段落整合请求
export interface IntegrateSegmentsRequest {
  articleId: string;
  rewrittenSegments: Array<{
    id: string;
    rewrittenContent: string;
    order: number;
  }>;
  optimizeTransitions?: boolean;
}

// 段落整合响应
export interface IntegrateSegmentsResponse {
  success: boolean;
  data: {
    integratedContent: string;
    title: string;
    qualityScore: number;
    improvements: Array<{
      type: string;
      description: string;
      position?: number;
    }>;
  };
  message?: string;
}

// 质量评估请求
export interface EvaluateQualityRequest {
  originalContent: string;
  rewrittenContent: string;
  style: RewriteStyle;
}

// 质量评估响应
export interface EvaluateQualityResponse {
  success: boolean;
  data: {
    overallScore: number;
    styleConsistency: number;
    contentCompleteness: number;
    readability: number;
    suggestions: Array<{
      type: string;
      message: string;
      position?: number;
    }>;
  };
  message?: string;
}

// 改写历史查询参数
export interface RewriteHistoryQueryParams {
  page?: number;
  limit?: number;
  articleId?: string;
  style?: RewriteStyle;
  startDate?: string;
  endDate?: string;
  sortBy?: 'created_at' | 'quality_score' | 'processing_time';
  order?: 'asc' | 'desc';
}

// 改写统计信息
export interface RewriteStats {
  totalRewrites: number;
  todayRewrites: number;
  averageQualityScore: number;
  totalProcessingTime: number; // 毫秒
  styleDistribution: Record<RewriteStyle, number>;
  qualityDistribution: {
    excellent: number; // 0.9+
    good: number; // 0.7-0.9
    fair: number; // 0.5-0.7
    poor: number; // <0.5
  };
}

// 改写进度信息
export interface RewriteProgress {
  rewriteRecordId: string;
  totalSegments: number;
  completedSegments: number;
  currentSegment?: string;
  estimatedTimeRemaining: number; // 秒
  status: 'analyzing' | 'rewriting' | 'integrating' | 'evaluating' | 'completed' | 'failed';
  error?: string;
}

