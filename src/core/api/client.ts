import axios, { AxiosInstance } from 'axios';

export interface ApiConfig {
  apiKey: string;
  apiBaseUrl: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(private config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
    });
  }

  private getHeaders(withApiKey: boolean = true, frameworkToken?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (withApiKey) {
      headers['X-API-KEY'] = this.config.apiKey;
    }

    if (frameworkToken) {
      headers['X-Framework-Token'] = frameworkToken;
    }

    return headers;
  }

  async get<T>(url: string, params?: any, frameworkToken?: string): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, {
      params,
      headers: this.getHeaders(true, frameworkToken),
    });
    return response.data;
  }

  async post<T>(url: string, data?: any, frameworkToken?: string): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, {
      headers: this.getHeaders(true, frameworkToken),
    });
    return response.data;
  }

  async postWithoutAuth<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, {
      headers: this.getHeaders(false),
    });
    return response.data;
  }
}

export function createApiClient(config: ApiConfig): ApiClient {
  return new ApiClient(config);
}
