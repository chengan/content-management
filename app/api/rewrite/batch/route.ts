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

// GET: 获取批量改写任务列表
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/rewrite/batch');
    
    const { searchParams } = new URL(request.url);
    const rawParams = parseQueryParams(searchParams);
    
    // 设置默认值并验证参数
    const params = {
      page: rawParams.page || 1,
      limit: rawParams.limit || 20,
      status: rawParams.status, // pending, running, completed, failed, cancelled
      search: rawParams.search,
      sortBy: rawParams.sortBy || 'created_at',
      order: rawParams.order || 'desc'
    };
    
    // 验证分页参数
    if (params.page < 1 || params.limit < 1 || params.limit > 100) {
      return createErrorResponse('分页参数无效：page >= 1, 1 <= limit <= 100', 400);
    }
    
    const supabase = getClient();
    
    console.log(`📋 查询批量任务: 页码${params.page}, 每页${params.limit}条`);
    
    // 构建查询
    let query = supabase
      .from('batch_rewrite_tasks')
      .select('*', { count: 'exact' });
    
    // 添加状态筛选
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    // 添加搜索功能
    if (params.search) {
      query = query.or(`task_name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }
    
    // 添加排序
    const orderColumn = params.sortBy === 'created_at' ? 'created_at' : 
                       params.sortBy === 'updated_at' ? 'updated_at' : 
                       params.sortBy === 'progress' ? 'progress' : 
                       'created_at';
    
    query = query.order(orderColumn, { ascending: params.order === 'asc' });
    
    // 添加分页
    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Supabase查询错误详情:', error);
      logApiError('GET', '/api/rewrite/batch', error);
      return createErrorResponse(`数据库查询失败: ${error.message}`, 500);
    }
    
    // 转换数据格式
    const batchTasks = data?.map((task: any) => ({
      id: task.id,
      taskName: task.task_name,
      description: task.description,
      status: task.status,
      articleIds: task.article_ids,
      totalArticles: task.total_articles,
      processedArticles: task.processed_articles,
      successfulArticles: task.successful_articles,
      failedArticles: task.failed_articles,
      progress: task.progress,
      style: task.style,
      config: task.config || {},
      startedAt: task.started_at,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      errorMessage: task.error_message
    })) || [];
    
    console.log(`✅ 批量任务查询完成: 返回 ${batchTasks.length} 个任务`);
    
    return createSuccessResponse(batchTasks, {
      page: params.page,
      limit: params.limit,
      total: count || 0,
      filters: {
        status: params.status,
        search: params.search
      }
    });
    
  } catch (error) {
    logApiError('GET', '/api/rewrite/batch', error);
    return createErrorResponse('获取批量任务列表失败', 500);
  }
}

// POST: 创建批量改写任务
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/rewrite/batch');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.taskName || typeof body.taskName !== 'string') {
      return createErrorResponse('taskName 是必需的字符串字段', 400);
    }
    
    if (!body.articleIds || !Array.isArray(body.articleIds) || body.articleIds.length === 0) {
      return createErrorResponse('articleIds 必须是非空数组', 400);
    }
    
    // 验证articleIds格式
    for (const articleId of body.articleIds) {
      if (!isValidUUID(articleId)) {
        return createErrorResponse(`无效的文章ID格式: ${articleId}`, 400);
      }
    }
    
    if (body.articleIds.length > 100) {
      return createErrorResponse('单次批量任务最多支持100篇文章', 400);
    }
    
    const {
      taskName,
      description = '',
      articleIds,
      style = 'lidan',
      config = {}
    } = body;
    
    console.log(`🚀 创建批量改写任务: ${taskName}, 文章数量: ${articleIds.length}`);
    
    // 验证文章是否存在
    const supabase = getClient();
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .in('id', articleIds);
    
    if (articlesError) {
      return createErrorResponse(`验证文章失败: ${articlesError.message}`, 500);
    }
    
    if (!articles || articles.length !== articleIds.length) {
      const foundIds = articles?.map(a => a.id) || [];
      const missingIds = articleIds.filter(id => !foundIds.includes(id));
      return createErrorResponse(`以下文章不存在: ${missingIds.join(', ')}`, 400);
    }
    
    // 创建批量任务数据
    const batchTaskData = {
      task_name: taskName,
      description,
      status: 'pending',
      article_ids: articleIds,
      total_articles: articleIds.length,
      processed_articles: 0,
      successful_articles: 0,
      failed_articles: 0,
      progress: 0,
      style,
      config: config,
      started_at: null,
      completed_at: null
    };
    
    // 使用Supabase服务创建任务
    const createdTask = await SupabaseService.createBatchRewriteTask(batchTaskData);
    
    console.log(`✅ 批量任务创建成功: ${createdTask.id}`);
    
    return createSuccessResponse({
      id: createdTask.id,
      taskName: createdTask.taskName,
      description: createdTask.description,
      status: createdTask.status,
      articleIds: createdTask.articleIds,
      totalArticles: createdTask.totalArticles,
      style: createdTask.style,
      config: createdTask.config,
      createdAt: createdTask.createdAt,
      articles: articles.map(a => ({
        id: a.id,
        title: a.title
      }))
    }, {
      message: '批量改写任务创建成功',
      taskId: createdTask.id,
      articleCount: articleIds.length
    });
    
  } catch (error: any) {
    logApiError('POST', '/api/rewrite/batch', error);
    return createErrorResponse(`创建批量任务失败: ${error.message}`, 500);
  }
}

// PUT: 更新批量改写任务状态
export async function PUT(request: NextRequest) {
  try {
    logApiRequest('PUT', '/api/rewrite/batch');
    
    const body = await request.json();
    
    if (!body.taskId || typeof body.taskId !== 'string') {
      return createErrorResponse('taskId 是必需的字符串字段', 400);
    }
    
    if (!isValidUUID(body.taskId)) {
      return createErrorResponse('taskId 必须是有效的UUID格式', 400);
    }
    
    const {
      taskId,
      status,
      processedArticles,
      successfulArticles,
      failedArticles,
      progress,
      errorMessage
    } = body;
    
    // 验证状态值
    if (status && !['pending', 'running', 'completed', 'failed', 'cancelled'].includes(status)) {
      return createErrorResponse('status 必须是 pending、running、completed、failed 或 cancelled 之一', 400);
    }
    
    console.log(`🔄 更新批量任务: ${taskId}, 状态: ${status || '不变'}`);
    
    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (status !== undefined) {
      updateData.status = status;
      
      if (status === 'running' && !body.startedAt) {
        updateData.started_at = new Date().toISOString();
      }
      
      if (['completed', 'failed', 'cancelled'].includes(status) && !body.completedAt) {
        updateData.completed_at = new Date().toISOString();
      }
    }
    
    if (processedArticles !== undefined) updateData.processed_articles = processedArticles;
    if (successfulArticles !== undefined) updateData.successful_articles = successfulArticles;
    if (failedArticles !== undefined) updateData.failed_articles = failedArticles;
    if (progress !== undefined) updateData.progress = Math.max(0, Math.min(100, progress));
    if (errorMessage !== undefined) updateData.error_message = errorMessage;
    
    // 使用Supabase服务更新任务
    const updatedTask = await SupabaseService.updateBatchRewriteTask(taskId, updateData);
    
    console.log(`✅ 批量任务更新成功: ${taskId}`);
    
    return createSuccessResponse({
      id: updatedTask.id,
      taskName: updatedTask.taskName,
      status: updatedTask.status,
      processedArticles: updatedTask.processedArticles,
      successfulArticles: updatedTask.successfulArticles,
      failedArticles: updatedTask.failedArticles,
      progress: updatedTask.progress,
      updatedAt: updatedTask.updatedAt,
      startedAt: updatedTask.startedAt,
      completedAt: updatedTask.completedAt
    }, {
      message: '批量任务状态更新成功',
      taskId,
      newStatus: status
    });
    
  } catch (error: any) {
    logApiError('PUT', '/api/rewrite/batch', error);
    return createErrorResponse(`更新批量任务失败: ${error.message}`, 500);
  }
}

// DELETE: 取消/删除批量改写任务
export async function DELETE(request: NextRequest) {
  try {
    logApiRequest('DELETE', '/api/rewrite/batch');
    
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const action = searchParams.get('action') || 'cancel'; // cancel 或 delete
    
    if (!taskId) {
      return createErrorResponse('taskId 参数是必需的', 400);
    }
    
    if (!isValidUUID(taskId)) {
      return createErrorResponse('taskId 必须是有效的UUID格式', 400);
    }
    
    if (!['cancel', 'delete'].includes(action)) {
      return createErrorResponse('action 必须是 cancel 或 delete', 400);
    }
    
    console.log(`${action === 'cancel' ? '🚫' : '🗑️'} ${action === 'cancel' ? '取消' : '删除'}批量任务: ${taskId}`);
    
    if (action === 'cancel') {
      // 取消任务（设置状态为cancelled）
      const updatedTask = await SupabaseService.updateBatchRewriteTask(taskId, {
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return createSuccessResponse({
        id: updatedTask.id,
        status: 'cancelled',
        completedAt: updatedTask.completedAt
      }, {
        message: '批量任务已取消',
        taskId,
        action: 'cancelled'
      });
      
    } else {
      // 删除任务
      await SupabaseService.deleteBatchRewriteTask(taskId);
      
      return createSuccessResponse(null, {
        message: '批量任务已删除',
        taskId,
        action: 'deleted'
      });
    }
    
  } catch (error: any) {
    logApiError('DELETE', '/api/rewrite/batch', error);
    return createErrorResponse(`操作批量任务失败: ${error.message}`, 500);
  }
}