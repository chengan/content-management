import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError, parseQueryParams, isValidUUID } from '../../../../lib/api-utils';
import SupabaseService from '../../../../lib/supabase';
import { getClient } from '../../../../lib/supabase';

// 处理OPTIONS预检请求
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// GET: 获取改写历史记录
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/rewrite/history');
    
    const { searchParams } = new URL(request.url);
    const rawParams = parseQueryParams(searchParams);
    
    // 设置默认值并验证参数
    const params = {
      page: rawParams.page || 1,
      limit: rawParams.limit || 20,
      status: rawParams.status, // pending, in_progress, completed, failed
      articleId: rawParams.articleId,
      search: rawParams.search,
      sortBy: rawParams.sortBy || 'created_at',
      order: rawParams.order || 'desc',
      startDate: rawParams.startDate,
      endDate: rawParams.endDate
    };
    
    // 验证分页参数
    if (params.page < 1 || params.limit < 1 || params.limit > 100) {
      return createErrorResponse('分页参数无效：page >= 1, 1 <= limit <= 100', 400);
    }
    
    // 验证articleId格式
    if (params.articleId && !isValidUUID(params.articleId)) {
      return createErrorResponse('articleId 必须是有效的UUID格式', 400);
    }
    
    const supabase = getClient();
    
    console.log(`📖 查询改写历史: 页码${params.page}, 每页${params.limit}条`);
    
    // 构建查询
    let query = supabase
      .from('rewrite_records')
      .select(`
        *,
        articles(id, title, source)
      `, { count: 'exact' });
    
    // 添加文章ID筛选
    if (params.articleId) {
      query = query.eq('article_id', params.articleId);
    }
    
    // 添加状态筛选
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    // 添加搜索功能
    if (params.search) {
      query = query.or(`original_title.ilike.%${params.search}%,rewritten_title.ilike.%${params.search}%`);
    }
    
    // 添加时间范围筛选
    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }
    
    // 添加排序
    const orderColumn = params.sortBy === 'created_at' ? 'created_at' : 
                       params.sortBy === 'updated_at' ? 'updated_at' : 
                       params.sortBy === 'quality_score' ? 'quality_score' : 
                       'created_at';
    
    query = query.order(orderColumn, { ascending: params.order === 'asc' });
    
    // 添加分页
    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Supabase查询错误详情:', error);
      logApiError('GET', '/api/rewrite/history', error);
      return createErrorResponse(`数据库查询失败: ${error.message}`, 500);
    }
    
    // 转换数据格式
    const rewriteHistory = data?.map((record: any) => ({
      id: record.id,
      articleId: record.article_id,
      articleTitle: record.articles?.title || record.original_title,
      articleSource: record.articles?.source || '未知来源',
      originalTitle: record.original_title,
      rewrittenTitle: record.rewritten_title,
      originalContent: record.original_content,
      rewrittenContent: record.rewritten_content,
      status: record.status,
      style: record.style,
      qualityScore: record.quality_score,
      wordCount: record.word_count,
      segmentCount: record.segment_count,
      processingTime: record.processing_time,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      config: record.config || {}
    })) || [];
    
    console.log(`✅ 改写历史查询完成: 返回 ${rewriteHistory.length} 条记录`);
    
    return createSuccessResponse(rewriteHistory, {
      page: params.page,
      limit: params.limit,
      total: count || 0,
      filters: {
        status: params.status,
        articleId: params.articleId,
        search: params.search,
        dateRange: params.startDate || params.endDate ? {
          start: params.startDate,
          end: params.endDate
        } : null
      }
    });
    
  } catch (error) {
    logApiError('GET', '/api/rewrite/history', error);
    return createErrorResponse('获取改写历史失败', 500);
  }
}

// POST: 创建新的改写记录
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/rewrite/history');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.articleId || typeof body.articleId !== 'string') {
      return createErrorResponse('articleId 是必需的字符串字段', 400);
    }
    
    if (!isValidUUID(body.articleId)) {
      return createErrorResponse('articleId 必须是有效的UUID格式', 400);
    }
    
    if (!body.originalTitle || typeof body.originalTitle !== 'string') {
      return createErrorResponse('originalTitle 是必需的字符串字段', 400);
    }
    
    if (!body.rewrittenTitle || typeof body.rewrittenTitle !== 'string') {
      return createErrorResponse('rewrittenTitle 是必需的字符串字段', 400);
    }
    
    if (!body.originalContent || typeof body.originalContent !== 'string') {
      return createErrorResponse('originalContent 是必需的字符串字段', 400);
    }
    
    if (!body.rewrittenContent || typeof body.rewrittenContent !== 'string') {
      return createErrorResponse('rewrittenContent 是必需的字符串字段', 400);
    }
    
    const {
      articleId,
      originalTitle,
      rewrittenTitle,
      originalContent,
      rewrittenContent,
      style = 'lidan',
      qualityScore = 0,
      segmentCount = 1,
      processingTime = 0,
      config = {}
    } = body;
    
    console.log(`📝 创建改写记录: ${originalTitle} -> ${rewrittenTitle}`);
    
    // 创建改写记录数据
    const rewriteRecordData = {
      article_id: articleId,
      original_title: originalTitle,
      rewritten_title: rewrittenTitle,
      original_content: originalContent,
      rewritten_content: rewrittenContent,
      status: 'completed',
      style,
      quality_score: qualityScore,
      word_count: rewrittenContent.length,
      segment_count: segmentCount,
      processing_time: processingTime,
      config: config
    };
    
    // 使用Supabase服务创建记录
    const createdRecord = await SupabaseService.createRewriteRecord(rewriteRecordData);
    
    console.log(`✅ 改写记录创建成功: ${createdRecord.id}`);
    
    return createSuccessResponse({
      id: createdRecord.id,
      articleId: createdRecord.articleId,
      originalTitle: createdRecord.originalTitle,
      rewrittenTitle: createdRecord.rewrittenTitle,
      status: createdRecord.status,
      style: createdRecord.style,
      qualityScore: createdRecord.qualityScore,
      wordCount: createdRecord.wordCount,
      segmentCount: createdRecord.segmentCount,
      processingTime: createdRecord.processingTime,
      createdAt: createdRecord.createdAt,
      updatedAt: createdRecord.updatedAt
    }, {
      message: '改写记录创建成功',
      recordId: createdRecord.id
    });
    
  } catch (error: any) {
    logApiError('POST', '/api/rewrite/history', error);
    return createErrorResponse(`创建改写记录失败: ${error.message}`, 500);
  }
}

// DELETE: 删除改写记录
export async function DELETE(request: NextRequest) {
  try {
    logApiRequest('DELETE', '/api/rewrite/history');
    
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('id');
    
    if (!recordId) {
      return createErrorResponse('记录ID是必需的', 400);
    }
    
    if (!isValidUUID(recordId)) {
      return createErrorResponse('记录ID必须是有效的UUID格式', 400);
    }
    
    console.log(`🗑️ 删除改写记录: ${recordId}`);
    
    // 删除改写记录
    await SupabaseService.deleteRewriteRecord(recordId);
    
    console.log(`✅ 改写记录删除成功: ${recordId}`);
    
    return createSuccessResponse(null, {
      message: '改写记录删除成功',
      recordId
    });
    
  } catch (error: any) {
    logApiError('DELETE', '/api/rewrite/history', error);
    return createErrorResponse(`删除改写记录失败: ${error.message}`, 500);
  }
}