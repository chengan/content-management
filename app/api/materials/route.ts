import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '../../../lib/supabase';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError, parseQueryParams } from '../../../lib/api-utils';
import { queryParamsSchema } from '../../../lib/validation';

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

export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/materials');
    
    const { searchParams } = new URL(request.url);
    const rawParams = parseQueryParams(searchParams);
    
    // 设置默认值并验证参数
    const params = {
      page: rawParams.page || 1,
      limit: rawParams.limit || 20,
      status: rawParams.status,
      search: rawParams.search,
      sortBy: rawParams.sortBy || 'collectTime',
      order: rawParams.order || 'desc'
    };
    
    // 验证查询参数
    const validationResult = queryParamsSchema.safeParse(params);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues.map(issue => issue.message).join(', ');
      return createErrorResponse(`参数验证失败: ${errorMessage}`, 400);
    }

    const supabase = getClient();
    
    // 构建查询
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' });
    
    // 添加状态筛选
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    // 添加搜索功能
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%,author.ilike.%${params.search}%`);
    }
    
    // 添加排序
    const orderColumn = params.sortBy === 'collectTime' ? 'collect_time' : 
                       params.sortBy === 'readCount' ? 'read_count' : 
                       params.sortBy === 'likeCount' ? 'like_count' : 
                       'collect_time';
    
    query = query.order(orderColumn, { ascending: params.order === 'asc' });
    
    // 添加分页
    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Supabase查询错误详情:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      logApiError('GET', '/api/materials', error);
      return createErrorResponse(`数据库查询失败: ${error.message}`, 500);
    }
    
    // 转换数据格式以匹配前端期望的字段名
    const materials = data?.map((article: any) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      source: article.source,
      sourceUrl: article.source_url,
      author: article.author,
      publishTime: article.publish_time,
      collectTime: article.collect_time,
      tags: article.tags || [],
      category: article.category,
      readCount: article.read_count,
      likeCount: article.like_count,
      status: article.status,
      createdAt: article.created_at,
      updatedAt: article.updated_at
    })) || [];
    
    return createSuccessResponse(materials, {
      page: params.page,
      limit: params.limit,
      total: count || 0
    });
    
  } catch (error) {
    logApiError('GET', '/api/materials', error);
    return createErrorResponse('服务器内部错误', 500);
  }
}