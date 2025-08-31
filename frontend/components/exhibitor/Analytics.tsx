'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiFilter, FiBarChart2, FiUsers, FiTruck, FiDollarSign, FiTrendingUp
} from 'react-icons/fi'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'

const periods = [
  { label: 'آخر 7 أيام', value: '7d' },
  { label: 'آخر 30 يوم', value: '30d' },
  { label: 'هذا الشهر', value: 'month' },
  { label: 'هذا العام', value: 'year' }
]

// البيانات التجريبية محذوفة. يجب جلب بيانات الإحصائيات من مصدر خارجي هنا.
// مثال: const stats = useStatsData(); أو جلبها من API أو props أو Context
const stats: Array<{ label: string, value: number | string, icon: React.ReactNode, color: string }> = []

// بيانات الرسم البياني محذوفة. يجب جلبها من مصدر خارجي
const salesData: Array<{ name: string, value: number }> = []
const ordersData: Array<{ name: string, value: number }> = []
const customersData: Array<{ name: string, value: number }> = []

const COLORS = ['#6366f1', '#22c55e', '#f59e42', '#ef4444']

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // بحث وهمي (لا يؤثر فعلياً على البيانات)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* العنوان */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold text-indigo-800 mb-2 flex items-center gap-2"
            >
              <FiBarChart2 className="text-indigo-600" />
              التحليلات
            </motion.h1>
            <p className="text-gray-600">لوحة تحكم التحليلات والإحصائيات الشاملة</p>
          </div>
        </div>
        {/* بحث وفلاتر */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <motion.div className="relative flex-grow" whileHover={{ scale: 1.01 }}>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث في التحليلات..."
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={search}
              onChange={handleSearch}
            />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiFilter className="ml-2" />
            <span>الفلاتر</span>
          </motion.button>
        </div>
        {/* لوحة الفلاتر */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-md mb-8 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">الفترة الزمنية</label>
                  <select
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {periods.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPeriod('7d')}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  إعادة تعيين
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  تطبيق الفلاتر
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white p-6 rounded-xl shadow-md border-l-4 border-${stat.color}-500 flex items-center gap-4`}
            >
              <div className={`text-3xl text-${stat.color}-500`}>{stat.icon}</div>
              <div>
                <div className="text-gray-500 mb-1">{stat.label}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
        {/* الرسوم البيانية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* مبيعات الأسبوع */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <FiBarChart2 className="text-indigo-500" />
              <span className="font-bold text-lg">مبيعات الأسبوع</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
          {/* حالة الطلبات */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <FiTruck className="text-blue-500" />
              <span className="font-bold text-lg">حالة الطلبات</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1">
                  {ordersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
        {/* العملاء */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <FiUsers className="text-green-500" />
              <span className="font-bold text-lg">نوع العملاء</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={customersData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#22c55e"
                  label
                >
                  {customersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  )
}