import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import SupabaseService from '../../../../lib/supabase';
import { CollectSource } from '../../../../src/types';

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

// GET: 获取采集源列表
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/collect/sources');
    
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || undefined;
    const isActive = searchParams.get('isActive');
    
    const options = {
      platform,
      isActive: isActive !== null ? isActive === 'true' : undefined
    };
    
    console.log('📡 获取采集源列表，筛选条件:', options);
    
    const sources = await SupabaseService.getCollectSources(options);
    
    console.log(`✅ 成功获取 ${sources.length} 个采集源`);
    
    return createSuccessResponse(sources, {
      total: sources.length,
      filters: options
    });
    
  } catch (error: any) {
    logApiError('GET', '/api/collect/sources', error);
    return createErrorResponse(error.message, 500);
  }
}

// POST: 创建新的采集源
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/collect/sources');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.name || !body.platform || !body.hashId) {
      return createErrorResponse('缺少必需字段: name, platform, hashId', 400);
    }
    
    // 验证hashId格式（今日热榜的hashId通常是10位字母数字）
    if (!/^[a-zA-Z0-9]{10}$/.test(body.hashId)) {
      return createErrorResponse('hashId格式不正确，应为10位字母数字组合', 400);
    }
    
    const sourceData: Omit<CollectSource, 'id' | 'createdAt'> = {
      name: body.name.trim(),
      platform: body.platform.trim(),
      hashId: body.hashId.trim(),
      category: body.category?.trim() || '',
      description: body.description?.trim() || '',
      userCreated: true, // 用户手动创建的标记为true
      isActive: body.isActive ?? true,
      config: body.config || {}
    };
    
    console.log('📝 创建新采集源:', sourceData);
    
    const newSource = await SupabaseService.createCollectSource(sourceData);
    
    console.log('✅ 采集源创建成功:', newSource.id);
    
    return createSuccessResponse(newSource, {
      message: '采集源创建成功'
    });
    
  } catch (error: any) {
    logApiError('POST', '/api/collect/sources', error);
    
    // 处理可能的重复错误
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return createErrorResponse('该采集源已存在，请检查名称或HashId', 409);
    }
    
    return createErrorResponse(error.message, 500);
  }
}

// PUT: 更新采集源
export async function PUT(request: NextRequest) {
  try {
    logApiRequest('PUT', '/api/collect/sources');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return createErrorResponse('缺少采集源ID', 400);
    }
    
    const body = await request.json();
    
    // 准备更新数据
    const updateData: Partial<CollectSource> = {};
    
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.platform !== undefined) updateData.platform = body.platform.trim();
    if (body.hashId !== undefined) {
      // 验证hashId格式
      if (!/^[a-zA-Z0-9]{10}$/.test(body.hashId)) {
        return createErrorResponse('hashId格式不正确，应为10位字母数字组合', 400);
      }
      updateData.hashId = body.hashId.trim();
    }
    if (body.category !== undefined) updateData.category = body.category.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.config !== undefined) updateData.config = body.config;
    
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('没有提供要更新的字段', 400);
    }
    
    console.log(`📝 更新采集源 ${id}:`, updateData);
    
    const updatedSource = await SupabaseService.updateCollectSource(id, updateData);
    
    console.log('✅ 采集源更新成功');
    
    return createSuccessResponse(updatedSource, {
      message: '采集源更新成功'
    });
    
  } catch (error: any) {
    logApiError('PUT', '/api/collect/sources', error);
    
    if (error.message.includes('not found')) {
      return createErrorResponse('采集源不存在', 404);
    }
    
    return createErrorResponse(error.message, 500);
  }
}

// DELETE: 删除采集源
export async function DELETE(request: NextRequest) {
  try {
    logApiRequest('DELETE', '/api/collect/sources');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const cascadeDelete = searchParams.get('cascade') === 'true';
    
    if (!id) {
      return createErrorResponse('缺少采集源ID', 400);
    }
    
    // 先检查采集源是否存在
    const existingSource = await SupabaseService.getCollectSourceById(id);
    if (!existingSource) {
      return createErrorResponse('采集源不存在', 404);
    }
    
    // 记录删除的采集源类型（用于日志）
    const sourceType = existingSource.userCreated ? '用户创建' : '系统预设';
    console.log(`🗑️ 删除${sourceType}采集源: ${existingSource.name}`);
    
    // 如果不是级联删除，先检查是否有关联数据
    if (!cascadeDelete) {
      const usage = await SupabaseService.checkCollectSourceUsage(id);
      
      if (usage.hasResults || usage.hasBatches) {
        return createErrorResponse('采集源有关联数据，无法直接删除', 409, {
          code: 'HAS_RELATED_DATA',
          details: {
            resultsCount: usage.resultsCount,
            batchesCount: usage.batchesCount,
            hasResults: usage.hasResults,
            hasBatches: usage.hasBatches
          }
        });
      }
    }
    
    await SupabaseService.deleteCollectSource(id, { cascadeDelete });
    
    console.log('✅ 采集源删除成功');
    
    return createSuccessResponse(null, {
      message: cascadeDelete ? '采集源及相关数据删除成功' : '采集源删除成功'
    });
    
  } catch (error: any) {
    logApiError('DELETE', '/api/collect/sources', error);
    return createErrorResponse(error.message, 500);
  }
}