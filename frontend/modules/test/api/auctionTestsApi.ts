import api from '@/lib/axios';
import type {
  TestResult,
  TestSummary,
  LatestTestResult,
  TestCategoryInfo,
  TestPagination,
  ScenarioDefinition,
  ScenarioRunSummary,
  ScenarioRunDetail,
} from '../types';

const BASE_PATH = '/api/auction-tests';

export class AuctionTestsApi {
  async getResults(filters?: {
    category?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    status: string;
    data: TestResult[];
    pagination: TestPagination;
    summary: TestSummary;
  }> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());

    const queryString = params.toString();
    const url = queryString ? `${BASE_PATH}?${queryString}` : BASE_PATH;

    const response = await api.get(url);
    return response.data;
  }

  async getResult(id: number): Promise<{
    status: string;
    data: TestResult;
  }> {
    const response = await api.get(`${BASE_PATH}/${id}`);
    return response.data;
  }

  async getLatest(): Promise<{
    status: string;
    data: LatestTestResult[];
  }> {
    const response = await api.get(`${BASE_PATH}/latest`);
    return response.data;
  }

  async getCategories(): Promise<{
    status: string;
    data: TestCategoryInfo[];
  }> {
    const response = await api.get(`${BASE_PATH}/categories`);
    return response.data;
  }

  async runAll(): Promise<{
    status: string;
    message: string;
    data: TestResult[];
  }> {
    const response = await api.post(`${BASE_PATH}/run-all`);
    return response.data;
  }

  async runCategory(category: string): Promise<{
    status: string;
    message: string;
    data: TestResult;
  }> {
    const response = await api.post(`${BASE_PATH}/run/${category}`);
    return response.data;
  }

  async delete(id: number): Promise<{
    status: string;
    message: string;
  }> {
    const response = await api.delete(`${BASE_PATH}/${id}`);
    return response.data;
  }

  async bulkDelete(ids: number[]): Promise<{
    status: string;
    message: string;
    deleted_count: number;
  }> {
    const response = await api.delete(`${BASE_PATH}/bulk`, { data: { ids } });
    return response.data;
  }

  // ——— Scenario-based load runs ———
  async getScenarios(): Promise<{ status: string; data: ScenarioDefinition[] }> {
    const response = await api.get(`${BASE_PATH}/scenarios`);
    return response.data;
  }

  async getScenarioRuns(params?: {
    status?: string;
    scenario_key?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    status: string;
    data: ScenarioRunSummary[];
    pagination: TestPagination;
  }> {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.scenario_key) search.set('scenario_key', params.scenario_key);
    if (params?.page) search.set('page', params.page.toString());
    if (params?.per_page) search.set('per_page', params.per_page.toString());
    const qs = search.toString();
    const url = qs ? `${BASE_PATH}/scenario-runs?${qs}` : `${BASE_PATH}/scenario-runs`;
    const response = await api.get(url);
    return response.data;
  }

  async runScenario(body: {
    scenario_key: string;
    user_count?: number;
    duration_seconds?: number;
  }): Promise<{
    status: string;
    message: string;
    data: ScenarioRunSummary;
  }> {
    const response = await api.post(`${BASE_PATH}/scenario-runs`, body);
    return response.data;
  }

  async getScenarioRun(id: number): Promise<{
    status: string;
    data: ScenarioRunDetail;
  }> {
    const response = await api.get(`${BASE_PATH}/scenario-runs/${id}`);
    return response.data;
  }
}

export const auctionTestsApi = new AuctionTestsApi();
