import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
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

// GET: 获取采集批次列表
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/collect/batches');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    
    const options = {
      page,
      limit,
      status
    };
    
    console.log('📡 获取采集批次列表，筛选条件:', options);
    
    const { batches, total } = await SupabaseService.getCollectBatches(options);
    
    console.log(`✅ 成功获取 ${batches.length} 个采集批次，总数: ${total}`);
    
    return createSuccessResponse(batches, {
      total,
      page,
      limit,
      hasMore: page * limit < total,
      filters: options
    });
    
  } catch (error: any) {
    logApiError('GET', '/api/collect/batches', error);
    return createErrorResponse(error.message, 500);
  }
}