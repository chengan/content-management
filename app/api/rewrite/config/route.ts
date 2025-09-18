import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import { getClient } from '../../../../lib/supabase';

// 处理OPTIONS预检请求
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// GET: 获取改写配置
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/rewrite/config');
    
    const { searchParams } = new URL(request.url);
    const configKey = searchParams.get('key');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    const supabase = getClient();
    
    console.log(`⚙️ 查询改写配置: ${configKey ? `key=${configKey}` : '全部配置'}`);
    
    // 构建查询
    let query = supabase
      .from('rewrite_configs')
      .select('*');
    
    // 添加key筛选
    if (configKey) {
      query = query.eq('config_key', configKey);
    }
    
    // 只返回活跃配置
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    // 按key排序
    query = query.order('config_key', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase查询错误详情:', error);
      logApiError('GET', '/api/rewrite/config', error);
      return createErrorResponse(`配置查询失败: ${error.message}`, 500);
    }
    
    // 转换数据格式
    const configs = data?.map((config: any) => ({
      key: config.config_key,
      value: config.config_value,
      description: config.description,
      isActive: config.is_active,
      dataType: config.data_type || 'string',
      updatedAt: config.updated_at,
      createdAt: config.created_at
    })) || [];
    
    console.log(`✅ 配置查询完成: 返回 ${configs.length} 项配置`);
    
    // 如果查询单个配置且找到结果，直接返回该配置的值
    if (configKey && configs.length === 1) {
      return createSuccessResponse({
        key: configKey,
        value: configs[0].value,
        description: configs[0].description,
        isActive: configs[0].isActive,
        dataType: configs[0].dataType
      });
    }
    
    // 返回配置列表，按类别组织
    const categorizedConfigs = {
      ai_settings: configs.filter(c => c.key.includes('ai_') || c.key.includes('model') || c.key.includes('prompt')),
      segmentation: configs.filter(c => c.key.includes('segment') || c.key.includes('length')),
      quality: configs.filter(c => c.key.includes('quality') || c.key.includes('threshold')),
      performance: configs.filter(c => c.key.includes('batch') || c.key.includes('timeout') || c.key.includes('retries')),
      other: configs.filter(c => 
        !c.key.includes('ai_') && !c.key.includes('model') && !c.key.includes('prompt') &&
        !c.key.includes('segment') && !c.key.includes('length') &&
        !c.key.includes('quality') && !c.key.includes('threshold') &&
        !c.key.includes('batch') && !c.key.includes('timeout') && !c.key.includes('retries')
      )
    };
    
    return createSuccessResponse({
      total: configs.length,
      activeCount: configs.filter(c => c.isActive).length,
      configs: configKey ? configs : categorizedConfigs,
      allConfigs: configKey ? undefined : configs
    });
    
  } catch (error) {
    logApiError('GET', '/api/rewrite/config', error);
    return createErrorResponse('获取改写配置失败', 500);
  }
}

// PUT: 更新改写配置
export async function PUT(request: NextRequest) {
  try {
    logApiRequest('PUT', '/api/rewrite/config');
    
    const body = await request.json();
    
    // 验证请求体格式
    if (!body.configs && !body.key) {
      return createErrorResponse('必须提供 configs 数组或单个 key-value 配置', 400);
    }
    
    const supabase = getClient();
    let updatedConfigs = [];
    
    if (body.configs && Array.isArray(body.configs)) {
      // 批量更新配置
      console.log(`⚙️ 批量更新配置: ${body.configs.length} 项`);
      
      for (const config of body.configs) {
        if (!config.key || typeof config.key !== 'string') {
          return createErrorResponse('每个配置项必须包含有效的 key 字段', 400);
        }
        
        if (config.value === undefined) {
          return createErrorResponse(`配置项 ${config.key} 必须包含 value 字段`, 400);
        }
        
        // 更新单个配置
        const { data, error } = await supabase
          .from('rewrite_configs')
          .update({
            config_value: JSON.stringify(config.value),
            description: config.description,
            is_active: config.isActive !== undefined ? config.isActive : true,
            data_type: config.dataType || 'string',
            updated_at: new Date().toISOString()
          })
          .eq('config_key', config.key)
          .select()
          .single();
        
        if (error) {
          console.error(`配置 ${config.key} 更新失败:`, error);
          return createErrorResponse(`配置 ${config.key} 更新失败: ${error.message}`, 500);
        }
        
        updatedConfigs.push({
          key: data.config_key,
          value: data.config_value,
          description: data.description,
          isActive: data.is_active,
          dataType: data.data_type,
          updatedAt: data.updated_at
        });
      }
      
    } else if (body.key) {
      // 单个配置更新
      console.log(`⚙️ 更新单个配置: ${body.key}`);
      
      if (!body.key || typeof body.key !== 'string') {
        return createErrorResponse('key 必须是有效的字符串', 400);
      }
      
      if (body.value === undefined) {
        return createErrorResponse('value 字段是必需的', 400);
      }
      
      const { data, error } = await supabase
        .from('rewrite_configs')
        .update({
          config_value: JSON.stringify(body.value),
          description: body.description,
          is_active: body.isActive !== undefined ? body.isActive : true,
          data_type: body.dataType || 'string',
          updated_at: new Date().toISOString()
        })
        .eq('config_key', body.key)
        .select()
        .single();
      
      if (error) {
        console.error(`配置 ${body.key} 更新失败:`, error);
        return createErrorResponse(`配置 ${body.key} 更新失败: ${error.message}`, 500);
      }
      
      updatedConfigs = [{
        key: data.config_key,
        value: data.config_value,
        description: data.description,
        isActive: data.is_active,
        dataType: data.data_type,
        updatedAt: data.updated_at
      }];
    }
    
    console.log(`✅ 配置更新完成: ${updatedConfigs.length} 项`);
    
    return createSuccessResponse({
      updatedCount: updatedConfigs.length,
      configs: updatedConfigs
    }, {
      message: `配置更新成功，共更新 ${updatedConfigs.length} 项配置`
    });
    
  } catch (error: any) {
    logApiError('PUT', '/api/rewrite/config', error);
    return createErrorResponse(`配置更新失败: ${error.message}`, 500);
  }
}