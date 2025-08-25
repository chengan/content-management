/**
 * 测试今日热榜API连接的测试接口
 * 用于验证环境变量配置和API连接是否正常
 */

import { NextRequest, NextResponse } from 'next/server';
import { TophubService } from '../../../lib/tophub';
import { createSuccessResponse, createErrorResponse } from '../../../lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('开始测试今日热榜API连接...');
    
    // 获取API配置信息
    const apiInfo = TophubService.getApiInfo();
    console.log('API配置信息:', apiInfo);
    
    // 测试基础连接
    const isConnected = await TophubService.testConnection();
    
    if (!isConnected) {
      return createErrorResponse('今日热榜API连接失败，请检查网络或API密钥配置', 500);
    }
    
    // 尝试获取微信热文榜数据（仅获取前3条作为测试）
    let wechatData = null;
    let wechatError = null;
    
    try {
      console.log('正在测试获取微信热文榜数据...');
      const fullData = await TophubService.getWechatHotlist();
      
      // 只返回前3条数据作为测试
      wechatData = {
        name: fullData.name,
        hashid: fullData.hashid,
        itemCount: fullData.items?.length || 0,
        sampleItems: fullData.items?.slice(0, 3) || [],
        updated_at: fullData.updated_at
      };
      
      console.log('✅ 微信热文榜数据获取成功');
      
    } catch (error) {
      wechatError = error instanceof Error ? error.message : '获取微信热文榜失败';
      console.error('❌ 微信热文榜数据获取失败:', error);
    }
    
    // 返回测试结果
    const result = {
      connection: {
        status: 'success',
        message: '今日热榜API连接正常'
      },
      apiInfo,
      wechatTest: wechatData ? {
        status: 'success',
        data: wechatData
      } : {
        status: 'error',
        error: wechatError
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('测试完成，返回结果');
    
    return createSuccessResponse(result);
    
  } catch (error) {
    console.error('测试今日热榜API时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return createErrorResponse(`测试失败: ${errorMessage}`, 500);
  }
}

// 处理OPTIONS请求（CORS预检）
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