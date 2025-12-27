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
import { AlertCircle, TrendingUp, Award, AlertTriangle } from 'lucide-react';

interface Developer {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  productivity_score: number;
  code_quality_score: number;
  code_review_score: number;
  total_commits: number;
  total_pull_requests: number;
  tasks_completed: number;
  overall_score: number;
}

interface TeamStats {
  total_developers: number;
  average_productivity: number;
  average_code_quality: number;
  average_code_review: number;
  total_commits: number;
  total_pull_requests: number;
  total_bugs_fixed: number;
  total_bugs_introduced: number;
  total_tasks_completed: number;
  total_tasks_pending: number;
  developers_needing_attention: number;
}

export default function DeveloperMetricsPage() {
  const router = useRouter();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<Developer[]>([]);
  const [needsAttention, setNeedsAttention] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const [devRes, statsRes, topRes, attentionRes] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/developers`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/developers/team-stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/developers/top-performers`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/developers/needs-attention`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      setDevelopers(devRes.data.data.data || []);
      setTeamStats(statsRes.data.data);
      setTopPerformers(topRes.data.data || []);
      setNeedsAttention(attentionRes.data.data || []);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/admin');
      } else {
        setError('Failed to load developer metrics');
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
          <h1 className="text-3xl font-bold text-gray-900">أداء الفريق</h1>
          <p className="text-gray-600 mt-2">
            متابعة شاملة لأداء المبرمجين والإنتاجية
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'all', label: 'جميع المبرمجين' },
            { id: 'top', label: 'أفضل الأداء' },
            { id: 'attention', label: 'يحتاجون متابعة' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 border-b-2 transition-colors ${
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
        {activeTab === 'overview' && teamStats && (
          <div className="space-y-6">
            {/* Team Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="إجمالي المبرمجين"
                value={teamStats.total_developers}
                icon={<TrendingUp className="text-blue-500" />}
              />
              <StatCard
                title="متوسط الإنتاجية"
                value={`${teamStats.average_productivity}%`}
                icon={<TrendingUp className="text-green-500" />}
              />
              <StatCard
                title="متوسط جودة الكود"
                value={`${teamStats.average_code_quality}%`}
                icon={<Award className="text-purple-500" />}
              />
              <StatCard
                title="يحتاجون متابعة"
                value={teamStats.developers_needing_attention}
                icon={<AlertTriangle className="text-red-500" />}
              />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">الإحصائيات العامة</h3>
                <div className="space-y-3">
                  <MetricRow label="إجمالي Commits" value={teamStats.total_commits} />
                  <MetricRow
                    label="إجمالي Pull Requests"
                    value={teamStats.total_pull_requests}
                  />
                  <MetricRow label="الأخطاء المصححة" value={teamStats.total_bugs_fixed} />
                  <MetricRow
                    label="الأخطاء المُدخلة"
                    value={teamStats.total_bugs_introduced}
                  />
                  <MetricRow
                    label="المهام المنجزة"
                    value={teamStats.total_tasks_completed}
                  />
                  <MetricRow
                    label="المهام المعلقة"
                    value={teamStats.total_tasks_pending}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">متوسط الدرجات</h3>
                <div className="space-y-4">
                  <ScoreBar
                    label="الإنتاجية"
                    score={teamStats.average_productivity}
                    color="bg-blue-500"
                  />
                  <ScoreBar
                    label="جودة الكود"
                    score={teamStats.average_code_quality}
                    color="bg-green-500"
                  />
                  <ScoreBar
                    label="مراجعة الكود"
                    score={teamStats.average_code_review}
                    color="bg-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Developers Tab */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      الاسم
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      الإنتاجية
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      جودة الكود
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Commits
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      PRs
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      المهام
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      الدرجة الكلية
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {developers.map((dev) => (
                    <tr
                      key={dev.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/monitoring/developers/${dev.id}`)
                      }
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{dev.user.name}</p>
                          <p className="text-sm text-gray-500">{dev.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ScoreBadge score={dev.productivity_score} />
                      </td>
                      <td className="px-6 py-4">
                        <ScoreBadge score={dev.code_quality_score} />
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {dev.total_commits}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {dev.total_pull_requests}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {dev.tasks_completed}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {dev.overall_score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Performers Tab */}
        {activeTab === 'top' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topPerformers.map((dev, index) => (
              <DeveloperCard key={dev.id} developer={dev} rank={index + 1} />
            ))}
          </div>
        )}

        {/* Needs Attention Tab */}
        {activeTab === 'attention' && (
          <div className="space-y-4">
            {needsAttention.length > 0 ? (
              needsAttention.map((dev) => (
                <div
                  key={dev.id}
                  className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dev.user.name}
                      </h3>
                      <p className="text-sm text-gray-600">{dev.user.email}</p>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/admin/monitoring/developers/${dev.id}`)
                      }
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">الإنتاجية</p>
                      <p className="text-xl font-bold text-red-600">
                        {dev.productivity_score}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">جودة الكود</p>
                      <p className="text-xl font-bold">
                        {dev.code_quality_score}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Commits</p>
                      <p className="text-xl font-bold">{dev.total_commits}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">الدرجة الكلية</p>
                      <p className="text-xl font-bold">{dev.overall_score}%</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600">جميع المبرمجين يؤدون بشكل جيد! 🎉</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
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

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="font-semibold">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-green-100 text-green-800'
      : score >= 60
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800';

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
      {score}%
    </span>
  );
}

function DeveloperCard({
  developer,
  rank,
}: {
  developer: Developer;
  rank: number;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border-t-4 border-primary">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {developer.user.name}
          </h3>
          <p className="text-sm text-gray-600">{developer.user.email}</p>
        </div>
        <div className="text-3xl font-bold text-primary">#{rank}</div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-sm text-gray-600">الإنتاجية</span>
          <span className="font-semibold">{developer.productivity_score}%</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-sm text-gray-600">جودة الكود</span>
          <span className="font-semibold">{developer.code_quality_score}%</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-sm text-gray-600">مراجعة الكود</span>
          <span className="font-semibold">{developer.code_review_score}%</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-center">
          <span className="text-2xl font-bold text-primary">
            {developer.overall_score}%
          </span>
          <span className="text-sm text-gray-600 block">الدرجة الكلية</span>
        </p>
      </div>
    </div>
  );
}
