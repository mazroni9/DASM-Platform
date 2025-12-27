'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertCircle, Activity, Zap, Database, Globe } from 'lucide-react';

interface HealthData {
  status: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_users: number;
  api_requests_per_minute: number;
  avg_response_time: number;
  error_count: number;
  database_connections: number;
  database_query_time: number;
  is_healthy: boolean;
  alerts: string;
  check_time: string;
}

interface HealthSummary {
  period_days: number;
  total_checks: number;
  healthy_checks: number;
  unhealthy_checks: number;
  uptime_percentage: number;
  avg_cpu_usage: number;
  avg_memory_usage: number;
  avg_disk_usage: number;
  avg_response_time: number;
  max_cpu_usage: number;
  max_memory_usage: number;
  max_disk_usage: number;
}

export default function PlatformHealthPage() {
  const router = useRouter();
  const [currentHealth, setCurrentHealth] = useState<HealthData | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthData[]>([]);
  const [apiPerformance, setApiPerformance] = useState<any>(null);
  const [dbPerformance, setDbPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const [currentRes, summaryRes, historyRes, apiRes, dbRes] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/health/current`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/health/summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/health/history?hours=24`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/health/api-performance`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/health/database-performance`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      setCurrentHealth(currentRes.data.data);
      setHealthSummary(summaryRes.data.data);
      setHealthHistory(historyRes.data.data || []);
      setApiPerformance(apiRes.data.statistics);
      setDbPerformance(dbRes.data.statistics);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/admin');
      } else {
        setError('Failed to load health data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">صحة المنصة</h1>
          <p className="text-gray-600 mt-2">
            مراقبة شاملة لأداء وصحة النظام
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'resources', label: 'الموارد' },
            { id: 'api', label: 'أداء API' },
            { id: 'database', label: 'قاعدة البيانات' },
            { id: 'history', label: 'السجل التاريخي' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && currentHealth && healthSummary && (
          <div className="space-y-6">
            {/* Current Status */}
            <div
              className={`p-6 rounded-lg shadow ${
                currentHealth.is_healthy
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    currentHealth.is_healthy ? 'bg-green-200' : 'bg-red-200'
                  }`}
                >
                  <Activity
                    size={32}
                    className={currentHealth.is_healthy ? 'text-green-600' : 'text-red-600'}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {currentHealth.is_healthy ? 'المنصة سليمة' : 'المنصة بحاجة انتباه'}
                  </h2>
                  <p className="text-gray-600">
                    آخر فحص: {new Date(currentHealth.check_time).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="استخدام CPU"
                value={`${currentHealth.cpu_usage}%`}
                icon={<Zap className="text-blue-500" />}
                status={currentHealth.cpu_usage < 80 ? 'good' : 'warning'}
              />
              <MetricCard
                title="استخدام الذاكرة"
                value={`${currentHealth.memory_usage}%`}
                icon={<Activity className="text-green-500" />}
                status={currentHealth.memory_usage < 80 ? 'good' : 'warning'}
              />
              <MetricCard
                title="استخدام القرص"
                value={`${currentHealth.disk_usage}%`}
                icon={<Database className="text-purple-500" />}
                status={currentHealth.disk_usage < 90 ? 'good' : 'warning'}
              />
              <MetricCard
                title="وقت الاستجابة"
                value={`${currentHealth.avg_response_time}ms`}
                icon={<Globe className="text-orange-500" />}
                status={currentHealth.avg_response_time < 1000 ? 'good' : 'warning'}
              />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">ملخص الـ {healthSummary.period_days} أيام الأخيرة</h3>
                <div className="space-y-3">
                  <SummaryRow
                    label="معدل التشغيل"
                    value={`${healthSummary.uptime_percentage}%`}
                  />
                  <SummaryRow
                    label="الفحوصات السليمة"
                    value={`${healthSummary.healthy_checks}/${healthSummary.total_checks}`}
                  />
                  <SummaryRow
                    label="متوسط CPU"
                    value={`${healthSummary.avg_cpu_usage}%`}
                  />
                  <SummaryRow
                    label="متوسط الذاكرة"
                    value={`${healthSummary.avg_memory_usage}%`}
                  />
                  <SummaryRow
                    label="متوسط وقت الاستجابة"
                    value={`${healthSummary.avg_response_time}ms`}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">القيم القصوى</h3>
                <div className="space-y-3">
                  <SummaryRow
                    label="أقصى CPU"
                    value={`${healthSummary.max_cpu_usage}%`}
                  />
                  <SummaryRow
                    label="أقصى ذاكرة"
                    value={`${healthSummary.max_memory_usage}%`}
                  />
                  <SummaryRow
                    label="أقصى قرص"
                    value={`${healthSummary.max_disk_usage}%`}
                  />
                  <SummaryRow
                    label="المستخدمون النشطون"
                    value={currentHealth.active_users}
                  />
                  <SummaryRow
                    label="طلبات API/دقيقة"
                    value={currentHealth.api_requests_per_minute}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && healthHistory.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">استخدام الموارد (آخر 24 ساعة)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={healthHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="check_time"
                  tickFormatter={(time) =>
                    new Date(time).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  }
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cpu_usage"
                  stroke="#8884d8"
                  name="CPU"
                />
                <Line
                  type="monotone"
                  dataKey="memory_usage"
                  stroke="#82ca9d"
                  name="الذاكرة"
                />
                <Line
                  type="monotone"
                  dataKey="disk_usage"
                  stroke="#ffc658"
                  name="القرص"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* API Performance Tab */}
        {activeTab === 'api' && apiPerformance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">إحصائيات API</h3>
              <div className="space-y-3">
                <SummaryRow
                  label="إجمالي الطلبات"
                  value={apiPerformance.total_requests}
                />
                <SummaryRow
                  label="متوسط وقت الاستجابة"
                  value={`${apiPerformance.avg_response_time}ms`}
                />
                <SummaryRow
                  label="أدنى وقت استجابة"
                  value={`${apiPerformance.min_response_time}ms`}
                />
                <SummaryRow
                  label="أقصى وقت استجابة"
                  value={`${apiPerformance.max_response_time}ms`}
                />
                <SummaryRow
                  label="معدل الأخطاء"
                  value={`${apiPerformance.error_rate}%`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Database Performance Tab */}
        {activeTab === 'database' && dbPerformance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">إحصائيات قاعدة البيانات</h3>
              <div className="space-y-3">
                <SummaryRow
                  label="إجمالي الاستعلامات"
                  value={dbPerformance.total_queries}
                />
                <SummaryRow
                  label="متوسط وقت التنفيذ"
                  value={`${dbPerformance.avg_execution_time}ms`}
                />
                <SummaryRow
                  label="الاستعلامات البطيئة"
                  value={dbPerformance.slow_queries_count}
                />
                <SummaryRow
                  label="الاستعلامات بأخطاء"
                  value={dbPerformance.error_queries_count}
                />
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && healthHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold">الوقت</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">CPU</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">الذاكرة</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">القرص</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {healthHistory.map((health, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(health.check_time).toLocaleString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 text-sm">{health.cpu_usage}%</td>
                      <td className="px-6 py-4 text-sm">{health.memory_usage}%</td>
                      <td className="px-6 py-4 text-sm">{health.disk_usage}%</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            health.is_healthy
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {health.is_healthy ? 'سليمة' : 'غير سليمة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  status,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  status: 'good' | 'warning' | 'critical';
}) {
  const bgColors = {
    good: 'bg-green-50',
    warning: 'bg-yellow-50',
    critical: 'bg-red-50',
  };

  const borderColors = {
    good: 'border-green-200',
    warning: 'border-yellow-200',
    critical: 'border-red-200',
  };

  return (
    <div
      className={`${bgColors[status]} ${borderColors[status]} border p-6 rounded-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl opacity-20">{icon}</div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
