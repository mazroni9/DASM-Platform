'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  summary: {
    total_developers: number;
    active_developers: number;
    total_errors: number;
    unresolved_errors: number;
    platform_uptime: number;
    avg_response_time: number;
    cpu_usage: number;
    memory_usage: number;
  };
  recent_errors: Array<{
    id: number;
    type: string;
    severity: string;
    created_at: string;
  }>;
  top_developers: Array<{
    id: number;
    user: { name: string };
    overall_score: number;
  }>;
  developers_needing_attention: Array<{
    id: number;
    user: { name: string };
    overall_score: number;
  }>;
  error_trends: Array<{
    date: string;
    count: number;
  }>;
  performance_metrics: Array<{
    time: string;
    cpu: number;
    memory: number;
    response_time: number;
  }>;
}

export default function MonitoringDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/dashboard`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setData(response.data.data);
        setError(null);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/admin');
      } else {
        setError('Failed to load monitoring dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
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

  if (!data) return null;

  const errorSeverityData = [
    { name: 'حرجة', value: 0, color: '#ef4444' },
    { name: 'عالية', value: 0, color: '#f97316' },
    { name: 'متوسطة', value: 0, color: '#eab308' },
    { name: 'منخفضة', value: 0, color: '#3b82f6' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة المراقبة</h1>
          <p className="text-gray-600 mt-2">
            مراقبة شاملة لأداء الفريق والمنصة
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="المبرمجون النشطون"
            value={data.summary.active_developers}
            icon={<Users className="text-blue-500" />}
            total={data.summary.total_developers}
          />
          <MetricCard
            title="الأخطاء المعلقة"
            value={data.summary.unresolved_errors}
            icon={<AlertTriangle className="text-red-500" />}
            total={data.summary.total_errors}
          />
          <MetricCard
            title="معدل التشغيل"
            value={`${data.summary.platform_uptime}%`}
            icon={<Activity className="text-green-500" />}
          />
          <MetricCard
            title="وقت الاستجابة"
            value={`${data.summary.avg_response_time}ms`}
            icon={<Zap className="text-yellow-500" />}
          />
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">استخدام الموارد</h3>
            <div className="space-y-4">
              <ResourceBar
                label="CPU"
                usage={data.summary.cpu_usage}
                color="bg-blue-500"
              />
              <ResourceBar
                label="الذاكرة"
                usage={data.summary.memory_usage}
                color="bg-green-500"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">توزيع الأخطاء</h3>
            {errorSeverityData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={errorSeverityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {errorSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-500">
                لا توجد أخطاء حالياً 🎉
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error Trends */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">اتجاهات الأخطاء</h3>
            {data.error_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.error_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString('ar-SA', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ef4444"
                    name="عدد الأخطاء"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                لا توجد بيانات
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">مقاييس الأداء</h3>
            {data.performance_metrics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.performance_metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
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
                    dataKey="cpu"
                    stroke="#3b82f6"
                    name="CPU %"
                  />
                  <Line
                    type="monotone"
                    dataKey="memory"
                    stroke="#10b981"
                    name="Memory %"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                لا توجد بيانات
              </div>
            )}
          </div>
        </div>

        {/* Recent Errors & Top Developers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Errors */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">أحدث الأخطاء</h3>
              <Link
                href="/admin/monitoring/errors"
                className="text-primary hover:underline text-sm"
              >
                عرض الكل
              </Link>
            </div>
            <div className="space-y-3">
              {data.recent_errors.length > 0 ? (
                data.recent_errors.slice(0, 5).map((err) => (
                  <div
                    key={err.id}
                    className="p-3 bg-gray-50 rounded-lg border-l-4 border-red-500"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{err.type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(err.created_at).toLocaleString('ar-SA')}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          err.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : err.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {err.severity === 'critical'
                          ? 'حرجة'
                          : err.severity === 'high'
                          ? 'عالية'
                          : 'متوسطة'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">لا توجد أخطاء حالياً</p>
              )}
            </div>
          </div>

          {/* Top Developers & Needs Attention */}
          <div className="space-y-6">
            {/* Top Developers */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">أفضل المبرمجين</h3>
                <Link
                  href="/admin/monitoring/developers"
                  className="text-primary hover:underline text-sm"
                >
                  عرض الكل
                </Link>
              </div>
              <div className="space-y-2">
                {data.top_developers.length > 0 ? (
                  data.top_developers.slice(0, 3).map((dev, idx) => (
                    <div
                      key={dev.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                          #{idx + 1}
                        </div>
                        <span className="font-medium">{dev.user.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {dev.overall_score}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">لا توجد بيانات</p>
                )}
              </div>
            </div>

            {/* Needs Attention */}
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
              <h3 className="text-lg font-semibold mb-4 text-red-600">
                يحتاجون متابعة
              </h3>
              <div className="space-y-2">
                {data.developers_needing_attention.length > 0 ? (
                  data.developers_needing_attention.slice(0, 3).map((dev) => (
                    <div
                      key={dev.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <span className="font-medium">{dev.user.name}</span>
                      <span className="text-sm font-semibold text-red-600">
                        {dev.overall_score}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    جميع المبرمجين يؤدون بشكل جيد! 🎉
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">الإجراءات السريعة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionButton
              label="أداء الفريق"
              href="/admin/monitoring/developers"
              icon={<TrendingUp size={20} />}
            />
            <QuickActionButton
              label="صحة المنصة"
              href="/admin/monitoring/health"
              icon={<Activity size={20} />}
            />
            <QuickActionButton
              label="سجلات الأخطاء"
              href="/admin/monitoring/errors"
              icon={<AlertCircle size={20} />}
            />
            <QuickActionButton
              label="تحديث البيانات"
              href="#"
              icon={<Zap size={20} />}
              onClick={fetchDashboardData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  total,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  total?: number;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {total !== undefined && (
            <p className="text-xs text-gray-500 mt-1">من {total}</p>
          )}
        </div>
        <div className="text-4xl opacity-20">{icon}</div>
      </div>
    </div>
  );
}

function ResourceBar({
  label,
  usage,
  color,
}: {
  label: string;
  usage: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{usage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${usage}%` }} />
      </div>
    </div>
  );
}

function QuickActionButton({
  label,
  href,
  icon,
  onClick,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
      >
        <div className="text-primary">{icon}</div>
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
    >
      <div className="text-primary">{icon}</div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </Link>
  );
}
