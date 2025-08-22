import { NextRequest } from 'next/server';
import { getClient } from '../../../../lib/supabase';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError, isValidUUID } from '../../../../lib/api-utils';
import { updateMaterialSchema, uuidSchema } from '../../../../lib/validation';

// GET /api/materials/[id] - 获取单个素材
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logApiRequest('GET', `/api/materials/${id}`);
    
    // 验证ID格式
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return createErrorResponse('无效的素材ID格式', 400);
    }
    
    const supabase = getClient();
    
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('素材不存在', 404);
      }
      logApiError('GET', `/api/materials/${id}`, error);
      return createErrorResponse('查询失败: ' + error.message, 500);
    }
    
    // 转换数据格式
    const material = {
      id: data.id,
      title: data.title,
      content: data.content,
      source: data.source,
      sourceUrl: data.source_url,
      author: data.author,
      publishTime: data.publish_time,
      collectTime: data.collect_time,
      tags: data.tags || [],
      category: data.category,
      readCount: data.read_count,
      likeCount: data.like_count,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    return createSuccessResponse(material);
    
  } catch (error) {
    logApiError('GET', `/api/materials/[id]`, error);
    return createErrorResponse('服务器内部错误', 500);
  }
}

// PUT /api/materials/[id] - 更新素材
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logApiRequest('PUT', `/api/materials/${id}`);
    
    // 验证ID格式
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return createErrorResponse('无效的素材ID格式', 400);
    }
    
    // 解析请求体
    const body = await request.json().catch(() => null);
    if (!body) {
      return createErrorResponse('请求体不能为空', 400);
    }
    
    // 验证更新数据
    const validationResult = updateMaterialSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      return createErrorResponse(`数据验证失败: ${errorMessage}`, 400);
    }
    
    const updateData = validationResult.data;
    
    const supabase = getClient();
    
    // 检查素材是否存在
    const { data: existingData, error: checkError } = await supabase
      .from('articles')
      .select('id, updated_at')
      .eq('id', id)
      .single();
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return createErrorResponse('素材不存在', 404);
      }
      logApiError('PUT', `/api/materials/${id}`, checkError);
      return createErrorResponse('检查素材失败: ' + checkError.message, 500);
    }
    
    // 准备更新数据（转换字段名）
    const dbUpdateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updateData.title !== undefined) dbUpdateData.title = updateData.title;
    if (updateData.content !== undefined) dbUpdateData.content = updateData.content;
    if (updateData.source !== undefined) dbUpdateData.source = updateData.source;
    if (updateData.sourceUrl !== undefined) dbUpdateData.source_url = updateData.sourceUrl;
    if (updateData.author !== undefined) dbUpdateData.author = updateData.author;
    if (updateData.publishTime !== undefined) dbUpdateData.publish_time = updateData.publishTime;
    if (updateData.tags !== undefined) dbUpdateData.tags = updateData.tags;
    if (updateData.category !== undefined) dbUpdateData.category = updateData.category;
    if (updateData.readCount !== undefined) dbUpdateData.read_count = updateData.readCount;
    if (updateData.likeCount !== undefined) dbUpdateData.like_count = updateData.likeCount;
    if (updateData.status !== undefined) dbUpdateData.status = updateData.status;
    
    // 执行更新
    const { data, error } = await supabase
      .from('articles')
      .update(dbUpdateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      logApiError('PUT', `/api/materials/${id}`, error);
      return createErrorResponse('更新失败: ' + error.message, 500);
    }
    
    // 转换返回数据格式
    const material = {
      id: data.id,
      title: data.title,
      content: data.content,
      source: data.source,
      sourceUrl: data.source_url,
      author: data.author,
      publishTime: data.publish_time,
      collectTime: data.collect_time,
      tags: data.tags || [],
      category: data.category,
      readCount: data.read_count,
      likeCount: data.like_count,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    return createSuccessResponse(material);
    
  } catch (error) {
    logApiError('PUT', `/api/materials/[id]`, error);
    return createErrorResponse('服务器内部错误', 500);
  }
}

// DELETE /api/materials/[id] - 删除素材
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logApiRequest('DELETE', `/api/materials/${id}`);
    
    // 验证ID格式
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return createErrorResponse('无效的素材ID格式', 400);
    }
    
    const supabase = getClient();
    
    // 检查素材是否存在
    const { data: existingData, error: checkError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('id', id)
      .single();
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return createErrorResponse('素材不存在', 404);
      }
      logApiError('DELETE', `/api/materials/${id}`, checkError);
      return createErrorResponse('检查素材失败: ' + checkError.message, 500);
    }
    
    // 软删除：更新状态而不是真正删除
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);
    
    if (error) {
      logApiError('DELETE', `/api/materials/${id}`, error);
      return createErrorResponse('删除失败: ' + error.message, 500);
    }
    
    // 记录删除操作日志
    console.log(`[DELETE LOG] 素材已删除: ID=${id}, 标题="${existingData.title}"`);
    
    return createSuccessResponse({ id, message: '素材删除成功' });
    
  } catch (error) {
    logApiError('DELETE', `/api/materials/[id]`, error);
    return createErrorResponse('服务器内部错误', 500);
  }
}