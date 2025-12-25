'use client'

import { useEffect, useState, useMemo } from 'react'
import { Bar, Pie, Line } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'
import { motion, type Variants } from 'framer-motion'
import { ShoppingCart, Eye, DollarSign, TrendingUp, Calendar, Car } from 'lucide-react'

// Register Chart.js
Chart.register(...registerables)

export function DashboardHome() {
  const [stats, setStats] = useState({
    cars: 0,
    orders: 0,
    visits: 0,
    revenue: 0,
    auctions: 0,
    upcoming: 0
  })

  // احضر بياناتك من API هنا
  useEffect(() => {
    const fetchStats = async () => {
      // const res = await fetch('/api/dashboard')
      // const data = await res.json()
      // setStats(data)
      setStats({
        cars: 0,
        orders: 0,
        visits: 0,
        revenue: 0,
        auctions: 0,
        upcoming: 0
      })
    }
    fetchStats()
  }, [])

  /** إعداد افتراضي لتناسق الخط والألوان داخل الرسوم */
  useEffect(() => {
    Chart.defaults.color = 'hsl(var(--foreground))'
    Chart.defaults.borderColor = 'hsl(var(--border))'
    Chart.defaults.font = {
      family: 'Lama, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans Arabic, Cairo, Tahoma, Arial, sans-serif',
      size: 12
    }
  }, [])

  /** ======= Demo Data (بدّلها ببياناتك) ======= */
  const months = useMemo(() => ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'], [])
  const salesData = useMemo(() => ({
    labels: months,
    datasets: [
      {
        label: 'مبيعات السيارات',
        data: [5, 8, 6, 10, 9, 12, 7, 6, 11, 13, 15, 14],
        backgroundColor: 'rgba(var(--color-primary), 0.18)',
        borderColor: 'rgb(var(--color-primary))',
        borderWidth: 2,
        borderRadius: 8,
        tension: 0.35,
      }
    ]
  }), [months])

  const carTypesData = useMemo(() => ({
    labels: ['سيدان', 'SUV', 'هاتشباك', 'بيك أب', 'فاخرة'],
    datasets: [
      {
        data: [25, 35, 12, 18, 10],
        backgroundColor: [
          'rgba(var(--color-primary), 0.8)',
          'rgba(var(--color-secondary), 0.8)',
          'rgba(34,197,94,0.8)',
          'rgba(245,158,11,0.85)',
          'rgba(239,68,68,0.85)',
        ],
        borderColor: 'rgb(var(--color-background))',
        borderWidth: 2
      }
    ]
  }), [])

  const visitsData = useMemo(() => ({
    labels: ['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'],
    datasets: [
      {
        label: 'الزيارات',
        data: [120, 160, 150, 210, 240, 200, 180],
        fill: true,
        backgroundColor: 'rgba(var(--color-secondary), 0.12)',
        borderColor: 'rgb(var(--color-secondary))',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.35,
      },
    ],
  }), [])

  const baseOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: 'hsl(var(--foreground))' },
        rtl: true,
      },
      tooltip: {
        backgroundColor: 'hsl(var(--background))',
        titleColor: 'hsl(var(--foreground))',
        bodyColor: 'hsl(var(--foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: 'hsl(var(--foreground))' },
        grid: { color: 'hsl(var(--border))' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: 'hsl(var(--foreground))' },
        grid: { color: 'hsl(var(--border))' }
      }
    }
  }

  /** ======= Motion Variants (typed) ======= */
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const itemVariants: Variants = {
    hidden: { y: 18, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
  }

  /** ======= Small Components ======= */
  const StatCard = ({
    icon,
    title,
    value,
    change,
    color = 'rgb(var(--color-primary))'
  }: { icon: React.ReactNode, title: string, value: number, change?: number, color?: string }) => (
    <motion.div
      variants={itemVariants}
      className="relative rounded-2xl border p-5 backdrop-blur bg-card/50 border-border"
    >
      <div className="flex items-center justify-between">
        <div
          className="grid place-items-center rounded-xl w-12 h-12 bg-primary/10 border border-border"
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {typeof change === 'number' && (
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold border"
            style={{
              backgroundColor: change >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: change >= 0 ? '#22C55E' : '#EF4444',
              borderColor: 'hsl(var(--border))'
            }}
          >
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <h3 className="mt-4 text-sm text-foreground/70">{title}</h3>
      <p className="mt-1 text-3xl font-bold text-foreground">
        {Number(value || 0).toLocaleString()}
      </p>
    </motion.div>
  )

  return (
    <motion.section
      dir="rtl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen w-full p-6 md:p-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex flex-col gap-2">
          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary"
          >
            لوحة تحكم المعارض
          </h1>
          <p className="text-sm md:text-base text-foreground/70">
            أهلاً بك! تابع أداء المعرض وإحصائياتك من مكان واحد.
          </p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6"
      >
        <StatCard icon={<Car size={22} />} title="السيارات المضافة" value={stats.cars} />
        <StatCard icon={<ShoppingCart size={22} />} title="الطلبات" value={stats.orders} />
        <StatCard icon={<Eye size={22} />} title="الزيارات" value={stats.visits} />
        <StatCard icon={<DollarSign size={22} />} title="الإيرادات (ر.س)" value={stats.revenue} />
        <StatCard icon={<TrendingUp size={22} />} title="المزادات النشطة" value={stats.auctions} />
        <StatCard icon={<Calendar size={22} />} title="مزادات قادمة" value={stats.upcoming} />
      </motion.div>

      {/* Charts */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6"
      >
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border p-5 md:p-6 backdrop-blur bg-card border-border"
        >
          <h3 className="text-lg md:text-xl font-bold mb-4 text-foreground">مبيعات السيارات خلال الأشهر</h3>
          <div className="h-80">
            <Bar data={salesData} options={baseOptions} />
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-2xl border p-5 md:p-6 backdrop-blur bg-card border-border"
        >
          <h3 className="text-lg md:text-xl font-bold mb-4 text-foreground">توزيع أنواع السيارات</h3>
          <div className="h-80">
            <Pie
              data={carTypesData}
              options={{
                ...baseOptions,
                scales: undefined, // مخطط دائري لا يحتاج محاور
                plugins: {
                  ...baseOptions.plugins,
                  legend: {
                    ...baseOptions.plugins.legend,
                    position: 'right'
                  }
                }
              }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Visits Line */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border p-5 md:p-6 mt-6 backdrop-blur bg-card border-border"
      >
        <h3 className="text-lg md:text-xl font-bold mb-4 text-foreground">الزيارات اليومية خلال الأسبوع</h3>
        <div className="h-96">
          <Line data={visitsData} options={baseOptions} />
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border p-5 md:p-6 mt-6 backdrop-blur bg-card border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-bold text-foreground">أحدث النشاطات</h3>
          <span
            className="text-xs px-2 py-1 rounded-full text-foreground/70 border border-dashed border-border"
          >
            قادمة من الـ API
          </span>
        </div>

        <div className="grid gap-3">
          {/* ضع عناصر النشاط القادمة من الـAPI هنا */}
          <div className="rounded-xl p-4 border border-border bg-card">
            <p className="text-sm text-foreground/70">لا يوجد نشاط حتى الآن…</p>
          </div>
        </div>
      </motion.div>

    </motion.section>
  )
}
