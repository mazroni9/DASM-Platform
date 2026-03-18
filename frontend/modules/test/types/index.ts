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

/** نتيجة حالة اختبار واحدة (من details.cases) */
export interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
}

export interface TestResult {
  id: number;
  test_name: string;
  test_category: TestCategory;
  status: TestStatus;
  message: string;
  details: Record<string, unknown> & {
    cases?: TestCaseResult[];
    cases_passed?: number;
    cases_total?: number;
  };
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

// Scenario-based load runs
export interface ScenarioDefinition {
  key: string;
  name_ar: string;
  name_en: string;
  description: string;
  default_users: number;
  default_duration_seconds: number;
  bid_pattern: string;
}

export interface ScenarioRunSummary {
  id: number;
  scenario_key: string;
  status: string;
  user_count: number;
  duration_seconds: number;
  total_bids: number | null;
  successful_bids: number | null;
  failed_bids: number | null;
  avg_latency_ms: number | null;
  max_latency_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface ScenarioRunDetail extends ScenarioRunSummary {
  auction_id: number | null;
  options: Record<string, unknown> | null;
  events: Array<{
    id: number;
    event_type: string;
    latency_ms: number | null;
    user_id: number | null;
    bid_id: number | null;
    bid_amount: number | null;
    message: string | null;
    occurred_at: string | null;
  }>;
}
