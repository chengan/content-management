import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError, parseQueryParams } from '../../../../lib/api-utils';
import SupabaseService from '../../../../lib/supabase';

// 处理OPTIONS预检请求
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// 格式化日期为 YYYY-MM-DD 格式
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

// 生成时间范围的默认值
function getDateRange(range?: string): { startDate?: string, endDate?: string } {
  const now = new Date();
  const today = formatDate(now.toISOString());
  
  switch (range) {
    case 'today':
      return { startDate: today, endDate: today };
    
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: formatDate(weekAgo.toISOString()), endDate: today };
    
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: formatDate(monthAgo.toISOString()), endDate: today };
    
    default:
      return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/collect/history');
    
    const { searchParams } = new URL(request.url);
    const rawParams = parseQueryParams(searchParams);
    
    // 解析参数
    const params = {
      page: rawParams.page || 1,
      limit: rawParams.limit || 20,
      sourceId: rawParams.sourceId,
      platform: rawParams.platform,
      range: rawParams.range, // today, week, month
      startDate: rawParams.startDate,
      endDate: rawParams.endDate,
      includeStats: rawParams.includeStats !== 'false' // 是否包含统计数据
    };

    // 参数验证
    if (params.page < 1) {
      return createErrorResponse('页码必须大于0', 400);
    }
    
    if (params.limit < 1 || params.limit > 100) {
      return createErrorResponse('每页数量必须在1-100之间', 400);
    }

    // 处理日期范围
    const dateRange = params.range ? getDateRange(params.range) : {};
    const finalStartDate = params.startDate || dateRange.startDate;
    const finalEndDate = params.endDate || dateRange.endDate;

    console.log(`📊 获取采集历史，页码: ${params.page}，条件:`, {
      sourceId: params.sourceId,
      platform: params.platform,
      startDate: finalStartDate,
      endDate: finalEndDate
    });

    // 构建查询选项
    const queryOptions: any = {
      page: params.page,
      limit: params.limit
    };

    if (params.sourceId) {
      queryOptions.sourceId = params.sourceId;
    }

    if (finalStartDate) {
      queryOptions.startDate = finalStartDate;
    }

    if (finalEndDate) {
      queryOptions.endDate = finalEndDate;
    }

    // 获取采集历史
    const { history, total } = await SupabaseService.getCollectHistory(queryOptions);

    // 如果需要平台筛选，在前端进行过滤（因为数据库中没有直接存储platform字段）
    let filteredHistory = history;
    if (params.platform) {
      filteredHistory = history.filter(h => 
        h.source?.platform === params.platform ||
        (params.platform === 'wechat' && h.source?.name?.includes('微信'))
      );
    }

    // 计算分页后的总数
    const filteredTotal = filteredHistory.length;
    
    // 重新分页（如果进行了平台筛选）
    if (params.platform) {
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      filteredHistory = filteredHistory.slice(startIndex, endIndex);
    }

    // 获取统计数据（如果需要）
    let stats = null;
    if (params.includeStats) {
      try {
        stats = await SupabaseService.getCollectStats();
        console.log('📈 获取采集统计数据成功');
      } catch (error) {
        console.error('获取统计数据失败:', error);
        // 统计数据获取失败不影响主要功能
      }
    }

    // 计算当前页的统计信息
    const pageStats = {
      totalRecords: filteredTotal,
      currentPage: params.page,
      totalPages: Math.ceil(filteredTotal / params.limit),
      hasMore: params.page * params.limit < filteredTotal,
      recordsOnPage: filteredHistory.length
    };

    // 计算成功率统计
    const totalArticles = filteredHistory.reduce((sum, h) => sum + h.articlesCount, 0);
    const totalSuccess = filteredHistory.reduce((sum, h) => sum + h.successCount, 0);
    const averageSuccessRate = totalArticles > 0 ? (totalSuccess / totalArticles) * 100 : 0;

    console.log(`✅ 成功获取采集历史：${filteredHistory.length} 条记录`);

    const responseData = {
      history: filteredHistory,
      pagination: pageStats,
      filters: {
        sourceId: params.sourceId,
        platform: params.platform,
        startDate: finalStartDate,
        endDate: finalEndDate,
        range: params.range
      },
      summary: {
        totalArticles,
        totalSuccess,
        averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
        totalHistoryRecords: filteredTotal
      },
      ...(stats && { stats })
    };

    return createSuccessResponse(responseData, {
      message: `获取到 ${filteredHistory.length} 条采集历史记录`
    });
    
  } catch (error: any) {
    logApiError('GET', '/api/collect/history', error);
    
    return createErrorResponse(`获取采集历史失败: ${error.message}`, 500);
  }
}