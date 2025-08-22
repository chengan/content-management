import { z } from 'zod';

// 素材更新验证架构
export const updateMaterialSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符').optional(),
  content: z.string().min(1, '内容不能为空').optional(),
  source: z.string().min(1, '来源不能为空').optional(),
  sourceUrl: z.string().url('无效的URL格式').optional().or(z.literal('')),
  author: z.string().optional(),
  publishTime: z.string().datetime('无效的日期时间格式').optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  readCount: z.number().min(0, '阅读数不能为负数').optional(),
  likeCount: z.number().min(0, '点赞数不能为负数').optional(),
  status: z.enum(['pending', 'rewritten', 'published'], {
    errorMap: () => ({ message: '状态只能是 pending, rewritten 或 published' })
  }).optional()
});

// 批量操作验证架构
export const batchOperationSchema = z.object({
  action: z.enum(['delete', 'updateStatus'], {
    errorMap: () => ({ message: '操作只能是 delete 或 updateStatus' })
  }),
  ids: z.array(z.string().uuid('无效的ID格式')).min(1, '至少需要选择一个项目'),
  data: z.object({
    status: z.enum(['pending', 'rewritten', 'published']).optional()
  }).optional()
});

// 查询参数验证架构
export const queryParamsSchema = z.object({
  page: z.number().min(1, '页码必须大于0').optional(),
  limit: z.number().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').optional(),
  status: z.enum(['pending', 'rewritten', 'published']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['collectTime', 'readCount', 'likeCount']).optional(),
  order: z.enum(['asc', 'desc']).optional()
});

// UUID验证
export const uuidSchema = z.string().uuid('无效的ID格式');