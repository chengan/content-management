/**
 * 测试极致了API连接的测试接口
 * 用于验证环境变量配置和API连接是否正常
 */

import { NextRequest, NextResponse } from 'next/server';
import { JizhileService } from '../../../lib/jizhile';
import { createSuccessResponse, createErrorResponse } from '../../../lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('开始测试极致了API连接...');

    // 获取API配置信息
    const apiInfo = JizhileService.getApiInfo();
    console.log('API配置信息:', apiInfo);

    // 测试基础连接
    const isConnected = await JizhileService.testConnection();

    if (!isConnected) {
      return createErrorResponse('极致了API连接失败，请检查网络或API密钥配置', 500);
    }

    // 尝试进行关键词搜索测试（搜索"新闻"关键词，仅获取前3条作为测试）
    let searchData = null;
    let searchError = null;

    try {
      console.log('正在测试关键词搜索功能...');
      const searchResult = await JizhileService.kwSearch({
        kw: '新闻',
        mode: 1, // 搜索标题
        period: 1, // 1天内数据
        page: 1,
        sort_type: 1 // 按阅读数排序
      });

      // 只返回前3条数据作为测试
      searchData = {
        keyword: '新闻',
        total: searchResult.total,
        data_number: searchResult.data_number,
        page: searchResult.page,
        total_page: searchResult.total_page,
        cost_money: searchResult.cost_money,
        remain_money: searchResult.remain_money,
        sampleItems: searchResult.data?.slice(0, 3).map(item => ({
          title: item.title,
          wx_name: item.wx_name,
          read: item.read,
          publish_time_str: item.publish_time_str,
          url: item.url
        })) || []
      };

      console.log('✅ 关键词搜索测试成功');

    } catch (error) {
      searchError = error instanceof Error ? error.message : '关键词搜索测试失败';
      console.error('❌ 关键词搜索测试失败:', error);
    }

    // 返回测试结果
    const result = {
      connection: {
        status: 'success',
        message: '极致了API连接正常'
      },
      apiInfo,
      searchTest: searchData ? {
        status: 'success',
        data: searchData
      } : {
        status: 'error',
        error: searchError
      },
      usage: {
        description: '极致了API按调用结果扣费',
        pricing: '0.02元/条，最低0.02元',
        note: '本次测试可能产生少量费用'
      },
      timestamp: new Date().toISOString()
    };

    console.log('测试完成，返回结果');

    return createSuccessResponse(result);

  } catch (error) {
    console.error('测试极致了API时发生错误:', error);

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