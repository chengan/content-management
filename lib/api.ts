import { 
  Article, 
  CollectSource, 
  CollectHistory, 
  CollectStats, 
  CollectResult, 
  CollectBatch, 
  CollectOperationResult 
} from '@/src/types';
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
        // 尝试解析错误响应体
        let errorData: any = null;
        try {
          errorData = await response.json();
          console.log(`[API Error ${response.status}] Response data:`, errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          // 如果无法解析响应体，使用默认错误信息
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        // 创建详细的错误对象
        const error = new Error(errorData.error || errorData.message || `API request failed: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        
        // 确保错误详细信息被正确设置
        if (errorData.details) {
          (error as any).details = errorData.details;
        } else if (errorData.success === false) {
          // 如果是标准的API响应格式，将整个errorData作为details
          (error as any).details = errorData;
        }
        
        console.log('Constructed error object:', {
          message: error.message,
          status: (error as any).status,
          details: (error as any).details
        });
        
        throw error;
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

// === 新的采集相关API方法 ===

// 采集相关查询参数类型
export interface CollectSourcesQueryParams {
  platform?: string;
  isActive?: boolean;
}

export interface CollectExecuteRequest {
  sourceIds: string[];
  collectType: 'keyword' | 'full';
  keyword?: string;
  name?: string;
  description?: string;
  limit?: number;
}

export interface CollectResultsQueryParams {
  batchId?: string;
  page?: number;
  limit?: number;
  onlySelected?: boolean;
}

export interface CollectBatchesQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface CollectHistoryQueryParams {
  page?: number;
  limit?: number;
  sourceId?: string;
  platform?: string;
  range?: 'today' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
  includeStats?: boolean;
}

// 扩展API客户端，添加新的采集方法
class ExtendedApiClient extends ApiClient {
  
  // === 采集源管理 ===
  
  // 获取采集源列表
  async getCollectSources(params: CollectSourcesQueryParams = {}): Promise<ApiResponse<CollectSource[]>> {
    return this.get<CollectSource[]>('/collect/sources', params);
  }

  // 创建采集源
  async createCollectSource(source: Omit<CollectSource, 'id' | 'createdAt'>): Promise<ApiResponse<CollectSource>> {
    return this.post<CollectSource>('/collect/sources', source);
  }

  // 更新采集源
  async updateCollectSource(id: string, updates: Partial<CollectSource>): Promise<ApiResponse<CollectSource>> {
    return this.put<CollectSource>(`/collect/sources?id=${id}`, updates);
  }

  // 删除采集源
  async deleteCollectSource(id: string, options: {
    cascade?: boolean
  } = {}): Promise<ApiResponse<void>> {
    const params = new URLSearchParams({ id });
    if (options.cascade) {
      params.set('cascade', 'true');
    }
    return this.delete<void>(`/collect/sources?${params.toString()}`);
  }
  
  // === 采集执行 ===
  
  // 执行采集任务
  async executeCollect(request: CollectExecuteRequest): Promise<ApiResponse<CollectOperationResult>> {
    return this.post<CollectOperationResult>('/collect/execute', request);
  }
  
  // === 采集结果管理 ===
  
  // 获取采集结果列表
  async getCollectResults(params: CollectResultsQueryParams = {}): Promise<ApiResponse<CollectResult[]>> {
    return this.get<CollectResult[]>('/collect/results', params);
  }

  // 批量更新采集结果选中状态
  async updateCollectResultSelection(ids: string[], isSelected: boolean): Promise<ApiResponse<void>> {
    return this.put<void>('/collect/results', { ids, isSelected });
  }

  // 批量删除采集结果
  async deleteCollectResults(ids: string[]): Promise<ApiResponse<void>> {
    return this.request<void>('/collect/results', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 将采集结果添加到素材库
  async addCollectResultsToMaterials(resultIds: string[]): Promise<ApiResponse<{ added: number; skipped: number }>> {
    return this.post<{ added: number; skipped: number }>('/collect/add-to-materials', { resultIds });
  }
  
  // === 采集批次管理 ===
  
  // 获取采集批次列表
  async getCollectBatches(params: CollectBatchesQueryParams = {}): Promise<ApiResponse<CollectBatch[]>> {
    return this.get<CollectBatch[]>('/collect/batches', params);
  }
  
  // === 采集历史 ===
  
  // 获取采集历史
  async getCollectHistory(params: CollectHistoryQueryParams = {}): Promise<ApiResponse<{
    history: CollectHistory[];
    pagination: any;
    filters: any;
    summary: any;
    stats?: CollectStats;
  }>> {
    return this.get('/collect/history', params);
  }
}

// 创建扩展的API客户端实例
const extendedApiClient = new ExtendedApiClient();

// 导出采集相关API方法
export const collectApi = {
  // === 采集源管理 ===
  getSources: (params?: CollectSourcesQueryParams) => extendedApiClient.getCollectSources(params),
  createSource: (source: Omit<CollectSource, 'id' | 'createdAt'>) => extendedApiClient.createCollectSource(source),
  updateSource: (id: string, updates: Partial<CollectSource>) => extendedApiClient.updateCollectSource(id, updates),
  deleteSource: (id: string, options?: { cascade?: boolean }) => extendedApiClient.deleteCollectSource(id, options),
  
  // === 采集执行 ===
  execute: (request: CollectExecuteRequest) => extendedApiClient.executeCollect(request),
  
  // === 采集结果管理 ===
  getResults: (params?: CollectResultsQueryParams) => extendedApiClient.getCollectResults(params),
  updateResultSelection: (ids: string[], isSelected: boolean) => extendedApiClient.updateCollectResultSelection(ids, isSelected),
  deleteResults: (ids: string[]) => extendedApiClient.deleteCollectResults(ids),
  addToMaterials: (resultIds: string[]) => extendedApiClient.addCollectResultsToMaterials(resultIds),
  
  // === 批次管理 ===
  getBatches: (params?: CollectBatchesQueryParams) => extendedApiClient.getCollectBatches(params),
  
  // === 采集历史 ===
  getHistory: (params?: CollectHistoryQueryParams) => extendedApiClient.getCollectHistory(params),
  getStats: () => extendedApiClient.getCollectHistory({ includeStats: true, limit: 1 }),
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