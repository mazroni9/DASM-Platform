export enum TestStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
}

export enum TestCategory {
  LOGIC = 'logic',
  TRANSITIONS = 'transitions',
  PRICE_UPDATES = 'price_updates',
  STATE_CONSISTENCY = 'state_consistency',
}

export interface TestResult {
  id: number;
  test_name: string;
  test_category: TestCategory;
  status: TestStatus;
  message: string;
  details: Record<string, any>;
  errors: string[] | null;
  execution_time_ms: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  running: number;
}

export interface TestCategoryInfo {
  value: string;
  label: string;
  english_label: string;
  description: string;
}

export interface LatestTestResult {
  category: string;
  category_label: string;
  latest_run: string | null;
  last_passed: string | null;
  last_failed: string | null;
  latest_result: {
    id: number;
    status: string;
    status_label: string;
    message: string;
    execution_time_ms: number;
    completed_at: string | null;
  } | null;
}

export interface TestFilters {
  category?: TestCategory;
  status?: TestStatus;
}

export interface TestPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}
