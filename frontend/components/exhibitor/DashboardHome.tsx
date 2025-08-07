'use client'

import { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiEye, FiDollarSign, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { FaCar } from 'react-icons/fa';

// Register Chart.js components
Chart.register(...registerables);

export function DashboardHome() {
  const [stats, setStats] = useState({
    cars: 0,
    orders: 0,
    visits: 0,
    revenue: 0,
    auctions: 0,
    upcoming: 0
  });

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        cars: 24,
        orders: 18,
        visits: 1243,
        revenue: 45800,
        auctions: 7,
        upcoming: 3
      });
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Chart data
  const salesData = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [
      {
        label: 'مبيعات السيارات',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const carTypesData = {
    labels: ['سيدان', 'SUV', 'كوبيه', 'هايبرد', 'كلاسيك'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const visitsData = {
    labels: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    datasets: [
      {
        label: 'الزيارات',
        data: [120, 190, 130, 170, 150, 240, 210],
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        tension: 0.4,
      },
    ],
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const StatCard = ({ icon, title, value, change }: { icon: React.ReactNode; title: string; value: number; change?: number }) => (
    <motion.div 
      variants={itemVariants}
      className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        {change && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <h3 className="mt-4 text-gray-500 font-medium">{title}</h3>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </motion.div>
  );

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة تحكم المعارض</h1>
        <p className="text-gray-600">مرحبًا بك في لوحة التحكم الخاصة بك. هنا يمكنك متابعة إحصائياتك وأداء معرضك.</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mt-8"
      >
        <StatCard 
          icon={<FaCar size={24} />} 
          title="السيارات المضافة" 
          value={stats.cars} 
          change={12} 
        />
        <StatCard 
          icon={<FiShoppingCart size={24} />} 
          title="الطلبات" 
          value={stats.orders} 
          change={8} 
        />
        <StatCard 
          icon={<FiEye size={24} />} 
          title="الزيارات" 
          value={stats.visits} 
          change={24} 
        />
        <StatCard 
          icon={<FiDollarSign size={24} />} 
          title="الإيرادات (ر.س)" 
          value={stats.revenue} 
        />
        <StatCard 
          icon={<FiTrendingUp size={24} />} 
          title="المزادات النشطة" 
          value={stats.auctions} 
          change={-3} 
        />
        <StatCard 
          icon={<FiCalendar size={24} />} 
          title="مزادات قادمة" 
          value={stats.upcoming} 
        />
      </motion.div>

      {/* Charts Section */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8"
      >
        <motion.div 
          variants={itemVariants}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">مبيعات السيارات خلال الأشهر</h3>
          <div className="h-80">
            <Bar 
              data={salesData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    rtl: true,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }} 
            />
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">توزيع أنواع السيارات</h3>
          <div className="h-80">
            <Pie 
              data={carTypesData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    rtl: true,
                  },
                },
              }} 
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Additional Charts */}
      <motion.div 
        variants={itemVariants}
        className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mt-6"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">الزيارات اليومية خلال الأسبوع</h3>
        <div className="h-96">
          <Line 
            data={visitsData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  rtl: true,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }} 
          />
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div 
        variants={itemVariants}
        className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mt-6"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">أحدث النشاطات</h3>
        <div className="space-y-4">
          {[
            { id: 1, action: 'تم بيع سيارة مرسيدس 2023', time: 'منذ ساعتين', amount: '45,000 ر.س' },
            { id: 2, action: 'تمت إضافة سيارة جديدة (بي إم دبليو X6)', time: 'منذ 5 ساعات' },
            { id: 3, action: 'مزاد جديد لسيارة كلاسيكية', time: 'منذ يوم', amount: 'بداية من 120,000 ر.س' },
            { id: 4, action: 'طلب حجز لسيارة تويوتا كامري', time: 'منذ يومين' },
          ].map((activity) => (
            <div key={activity.id} className="flex items-start p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 mr-3">
                <FiShoppingCart size={18} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{activity.action}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
              {activity.amount && (
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  {activity.amount}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}