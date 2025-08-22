import { NextRequest } from 'next/server';
import { getClient } from '../../../../lib/supabase';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import { batchOperationSchema } from '../../../../lib/validation';

export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/materials/batch');
    
    // 解析请求体
    const body = await request.json().catch(() => null);
    if (!body) {
      return createErrorResponse('请求体不能为空', 400);
    }
    
    // 验证批量操作数据
    const validationResult = batchOperationSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      return createErrorResponse(`数据验证失败: ${errorMessage}`, 400);
    }
    
    const { action, ids, data } = validationResult.data;
    
    const supabase = getClient();
    
    // 开始事务处理
    const results = {
      success: [] as any[],
      failed: [] as any[],
      total: ids.length
    };
    
    try {
      if (action === 'delete') {
        // 批量删除操作
        
        // 首先获取要删除的素材信息（用于日志记录）
        const { data: materialsToDelete, error: fetchError } = await supabase
          .from('articles')
          .select('id, title')
          .in('id', ids);
        
        if (fetchError) {
          logApiError('POST', '/api/materials/batch', fetchError);
          return createErrorResponse('获取素材信息失败: ' + fetchError.message, 500);
        }
        
        // 执行批量删除
        const { error: deleteError } = await supabase
          .from('articles')
          .delete()
          .in('id', ids);
        
        if (deleteError) {
          logApiError('POST', '/api/materials/batch', deleteError);
          return createErrorResponse('批量删除失败: ' + deleteError.message, 500);
        }
        
        // 记录成功删除的项目
        materialsToDelete?.forEach((material: any) => {
          results.success.push({
            id: material.id,
            title: material.title,
            action: 'deleted'
          });
          console.log(`[BATCH DELETE LOG] 素材已删除: ID=${material.id}, 标题="${material.title}"`);
        });
        
        // 检查是否有项目不存在
        const deletedIds = materialsToDelete?.map(m => m.id) || [];
        const notFoundIds = ids.filter(id => !deletedIds.includes(id));
        notFoundIds.forEach(id => {
          results.failed.push({
            id,
            error: '素材不存在'
          });
        });
        
      } else if (action === 'updateStatus') {
        // 批量状态更新操作
        
        if (!data?.status) {
          return createErrorResponse('批量状态更新需要提供status字段', 400);
        }
        
        // 首先检查所有素材是否存在
        const { data: existingMaterials, error: checkError } = await supabase
          .from('articles')
          .select('id, title, status')
          .in('id', ids);
        
        if (checkError) {
          logApiError('POST', '/api/materials/batch', checkError);
          return createErrorResponse('检查素材失败: ' + checkError.message, 500);
        }
        
        const existingIds = existingMaterials?.map((m: any) => m.id) || [];
        const notFoundIds = ids.filter(id => !existingIds.includes(id));
        
        // 记录不存在的项目
        notFoundIds.forEach(id => {
          results.failed.push({
            id,
            error: '素材不存在'
          });
        });
        
        // 对存在的素材执行批量更新
        if (existingIds.length > 0) {
          const { data: updatedMaterials, error: updateError } = await supabase
            .from('articles')
            .update({ 
              status: data.status,
              updated_at: new Date().toISOString()
            })
            .in('id', existingIds)
            .select('id, title, status');
          
          if (updateError) {
            logApiError('POST', '/api/materials/batch', updateError);
            return createErrorResponse('批量更新失败: ' + updateError.message, 500);
          }
          
          // 记录成功更新的项目
          updatedMaterials?.forEach((material: any) => {
            results.success.push({
              id: material.id,
              title: material.title,
              action: 'updated',
              newStatus: material.status
            });
            console.log(`[BATCH UPDATE LOG] 素材状态已更新: ID=${material.id}, 标题="${material.title}", 新状态="${material.status}"`);
          });
        }
      }
      
      return createSuccessResponse({
        message: `批量操作完成`,
        results: {
          total: results.total,
          success: results.success.length,
          failed: results.failed.length,
          details: {
            success: results.success,
            failed: results.failed
          }
        }
      });
      
    } catch (transactionError) {
      logApiError('POST', '/api/materials/batch', transactionError);
      return createErrorResponse('批量操作事务失败', 500);
    }
    
  } catch (error) {
    logApiError('POST', '/api/materials/batch', error);
    return createErrorResponse('服务器内部错误', 500);
  }
}