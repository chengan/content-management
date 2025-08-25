import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import SupabaseService from '../../../../lib/supabase';

// 处理OPTIONS预检请求
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// POST: 将采集结果添加到素材库
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/collect/add-to-materials');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.resultIds || !Array.isArray(body.resultIds) || body.resultIds.length === 0) {
      return createErrorResponse('请选择要添加到素材库的采集结果', 400);
    }
    
    const { resultIds } = body;
    
    console.log(`📦 将采集结果添加到素材库: ${resultIds.length} 条记录`);
    
    // 调用服务方法添加到素材库
    const { added, skipped } = await SupabaseService.addCollectResultsToMaterials(resultIds);
    
    console.log(`✅ 添加完成: 成功添加 ${added} 条，跳过 ${skipped} 条`);
    
    let message = `成功添加 ${added} 条采集结果到素材库`;
    if (skipped > 0) {
      message += `，跳过 ${skipped} 条（已存在或已添加）`;
    }
    
    return createSuccessResponse({
      added,
      skipped,
      total: resultIds.length
    }, {
      message
    });
    
  } catch (error: any) {
    logApiError('POST', '/api/collect/add-to-materials', error);
    
    // 处理常见错误
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return createErrorResponse('部分文章已存在于素材库中', 409);
    }
    
    return createErrorResponse(error.message, 500);
  }
}