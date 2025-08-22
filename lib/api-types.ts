// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// API错误类型
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 批量操作类型
export interface BatchOperation {
  action: 'delete' | 'updateStatus';
  ids: string[];
  data?: { status?: string };
}

// 分页查询参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 素材查询参数
export interface MaterialsQueryParams extends PaginationParams {
  status?: 'pending' | 'rewritten' | 'published';
  search?: string;
  sortBy?: 'collectTime' | 'readCount' | 'likeCount';
  order?: 'asc' | 'desc';
}