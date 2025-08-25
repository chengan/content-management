import { NextResponse } from 'next/server';
import { ApiResponse, ApiError } from './api-types';

// CORS头部配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 创建成功响应
export function createSuccessResponse<T>(data: T, pagination?: ApiResponse<T>['pagination']): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(pagination && { pagination })
  };
  
  return NextResponse.json(response, { headers: corsHeaders });
}

// 创建错误响应
export function createErrorResponse(
  error: string | ApiError,
  status: number = 400,
  details?: any
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: typeof error === 'string' ? error : error.message,
    ...(details && { details })
  };
  
  return NextResponse.json(response, { status, headers: corsHeaders });
}

// 记录API日志
export function logApiRequest(method: string, path: string, params?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[API ${timestamp}] ${method} ${path}`, params ? JSON.stringify(params) : '');
}

// 记录API错误
export function logApiError(method: string, path: string, error: any) {
  const timestamp = new Date().toISOString();
  console.error(`[API ERROR ${timestamp}] ${method} ${path}:`, error);
}

// 解析查询参数
export function parseQueryParams(searchParams: URLSearchParams) {
  const params: Record<string, any> = {};
  
  for (const [key, value] of searchParams.entries()) {
    // 处理数字类型
    if (key === 'page' || key === 'limit' || key === 'readCount' || key === 'likeCount') {
      params[key] = parseInt(value, 10);
    }
    // 处理布尔类型
    else if (value === 'true' || value === 'false') {
      params[key] = value === 'true';
    }
    // 字符串类型
    else {
      params[key] = value;
    }
  }
  
  return params;
}

// 验证UUID格式
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}