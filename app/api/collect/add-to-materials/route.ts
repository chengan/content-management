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

    // 在添加前先读取并检查采集结果的URL
    const collectResults = await SupabaseService.getCollectResultsByIds(resultIds);
    console.log(`🔍 检查采集结果数据（前3条）:`);
    collectResults.slice(0, 3).forEach((result, index) => {
      console.log(`📋 采集结果${index + 1}:`, {
        id: result.id,
        title: result.title,
        sourceUrl: result.sourceUrl,
        urlLength: result.sourceUrl?.length || 0,
        urlHasBiz: result.sourceUrl?.includes('__biz=') || false
      });

      // 特别检查微信文章URL
      if (result.sourceUrl?.includes('mp.weixin.qq.com') && result.sourceUrl.includes('__biz=')) {
        const bizMatch = result.sourceUrl.match(/__biz=([^&]+)/);
        if (bizMatch) {
          console.log(`📱 数据库中的微信文章biz参数: "${bizMatch[1]}", 长度: ${bizMatch[1].length}`);
          if (bizMatch[1].length < 20) {
            console.warn(`⚠️  数据库中的biz参数异常，长度过短: ${bizMatch[1]}`);
          }
        }
      }
    });

    // 调用服务方法添加到素材库（带去重功能）
    const result = await SupabaseService.addCollectResultsToMaterials(resultIds);

    console.log(`✅ 添加完成: 新增 ${result.added} 条，跳过 ${result.skipped} 条，重复 ${result.duplicated} 条`);

    // 构建详细的返回消息
    let message = `成功添加 ${result.added} 条采集结果到素材库`;

    if (result.duplicated > 0) {
      message += `，去重跳过 ${result.duplicated} 条`;
      if (result.details.duplicateByTitle > 0) {
        message += `（标题重复 ${result.details.duplicateByTitle} 条）`;
      }
      if (result.details.duplicateByUrl > 0) {
        message += `（链接重复 ${result.details.duplicateByUrl} 条）`;
      }
    }

    if (result.details.alreadyAdded > 0) {
      message += `，已添加过 ${result.details.alreadyAdded} 条`;
    }

    return createSuccessResponse({
      added: result.added,
      skipped: result.skipped,
      duplicated: result.duplicated,
      total: resultIds.length,
      details: result.details
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