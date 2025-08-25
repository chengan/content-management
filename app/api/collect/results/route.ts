import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import SupabaseService from '../../../../lib/supabase';

// 处理OPTIONS预检请求
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// GET: 获取采集结果列表
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/collect/results');
    
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const onlySelected = searchParams.get('onlySelected') === 'true';
    
    const options = {
      batchId,
      page,
      limit,
      onlySelected
    };
    
    console.log('📡 获取采集结果列表，筛选条件:', options);
    
    const { results, total } = await SupabaseService.getCollectResults(options);
    
    console.log(`✅ 成功获取 ${results.length} 条采集结果，总数: ${total}`);
    
    return createSuccessResponse(results, {
      total,
      page,
      limit,
      hasMore: page * limit < total,
      filters: options
    });
    
  } catch (error: any) {
    logApiError('GET', '/api/collect/results', error);
    return createErrorResponse(error.message, 500);
  }
}

// PUT: 批量更新采集结果（选中状态）
export async function PUT(request: NextRequest) {
  try {
    logApiRequest('PUT', '/api/collect/results');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return createErrorResponse('请提供要更新的结果ID列表', 400);
    }
    
    if (body.isSelected === undefined) {
      return createErrorResponse('请提供isSelected字段', 400);
    }
    
    const { ids, isSelected } = body;
    
    console.log(`📝 批量更新采集结果选中状态: ${ids.length} 条记录，isSelected=${isSelected}`);
    
    const updatedCount = await SupabaseService.updateCollectResultSelection(ids, isSelected);
    
    console.log(`✅ 成功更新 ${updatedCount} 条采集结果`);
    
    return createSuccessResponse(null, {
      message: `成功更新 ${updatedCount} 条采集结果的选中状态`,
      updatedCount,
      isSelected
    });
    
  } catch (error: any) {
    logApiError('PUT', '/api/collect/results', error);
    return createErrorResponse(error.message, 500);
  }
}

// DELETE: 批量删除采集结果
export async function DELETE(request: NextRequest) {
  try {
    logApiRequest('DELETE', '/api/collect/results');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return createErrorResponse('请提供要删除的结果ID列表', 400);
    }
    
    const { ids } = body;
    
    console.log(`🗑️ 批量删除采集结果: ${ids.length} 条记录`);
    
    const deletedCount = await SupabaseService.deleteCollectResults(ids);
    
    console.log(`✅ 成功删除 ${deletedCount} 条采集结果`);
    
    return createSuccessResponse(null, {
      message: `成功删除 ${deletedCount} 条采集结果`,
      deletedCount
    });
    
  } catch (error: any) {
    logApiError('DELETE', '/api/collect/results', error);
    return createErrorResponse(error.message, 500);
  }
}