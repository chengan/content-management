import { Article } from '@/src/types';
import { ApiResponse, MaterialsQueryParams, BatchOperation } from './api-types';

// API基础配置 - 使用相对路径避免跨域问题
const API_BASE_URL = '';
const API_PREFIX = '/api';

// 创建API客户端类
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${API_PREFIX}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // GET请求
  private async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return this.request<T>(url, { method: 'GET' });
  }

  // POST请求
  private async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT请求
  private async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  private async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // === 素材管理API方法 ===

  // 获取素材列表
  async getMaterials(params: MaterialsQueryParams = {}): Promise<ApiResponse<Article[]>> {
    return this.get<Article[]>('/materials', params);
  }

  // 获取单个素材
  async getMaterial(id: string): Promise<ApiResponse<Article>> {
    return this.get<Article>(`/materials/${id}`);
  }

  // 创建新素材
  async createMaterial(article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Article>> {
    return this.post<Article>('/materials', article);
  }

  // 更新素材
  async updateMaterial(id: string, updates: Partial<Article>): Promise<ApiResponse<Article>> {
    return this.put<Article>(`/materials/${id}`, updates);
  }

  // 删除素材
  async deleteMaterial(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/materials/${id}`);
  }

  // 批量操作素材
  async batchOperateMaterials(operation: BatchOperation): Promise<ApiResponse<{ success: number; failed: number }>> {
    return this.post<{ success: number; failed: number }>('/materials/batch', operation);
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient();

// 导出便捷方法
export const materialsApi = {
  // 获取素材列表
  getList: (params?: MaterialsQueryParams) => apiClient.getMaterials(params),
  
  // 获取单个素材
  getById: (id: string) => apiClient.getMaterial(id),
  
  // 创建素材
  create: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => apiClient.createMaterial(article),
  
  // 更新素材
  update: (id: string, updates: Partial<Article>) => apiClient.updateMaterial(id, updates),
  
  // 删除素材
  delete: (id: string) => apiClient.deleteMaterial(id),
  
  // 批量删除
  batchDelete: (ids: string[]) => apiClient.batchOperateMaterials({
    action: 'delete',
    ids,
  }),
  
  // 批量更新状态
  batchUpdateStatus: (ids: string[], status: Article['status']) => apiClient.batchOperateMaterials({
    action: 'updateStatus',
    ids,
    data: { status },
  }),
};

// 全局错误处理器
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: ApiResponse<any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 处理API响应的工具函数
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new ApiError(response.error || 'API request failed', undefined, response);
  }
  
  if (response.data === undefined) {
    throw new ApiError('API response data is undefined');
  }
  
  return response.data;
}

// 导出默认API客户端
export default apiClient;