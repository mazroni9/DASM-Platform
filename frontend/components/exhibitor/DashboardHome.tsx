'use client'

import { useEffect, useState, useMemo } from 'react'
import { Bar, Pie, Line } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'
import { motion, type Variants } from 'framer-motion'
import { FiShoppingCart, FiEye, FiDollarSign, FiTrendingUp, FiCalendar } from 'react-icons/fi'
import { FaCar } from 'react-icons/fa'

// Register Chart.js
Chart.register(...registerables)

/** ======= Theme (Dark) ======= */
const THEME = {
  // لا نفرض خلفية عامة – نتركها لتخطيط الأب
  bg: '#0B1220',
  card: 'rgba(17, 24, 39, 0.6)',
  cardSolid: '#0F172A',
  border: '#1F2937',
  text: '#E2E8F0',
  subtext: '#94A3B8',
  grid: 'rgba(148,163,184,0.15)',
  primary: '#8B5CF6',
  primarySoft: 'rgba(139,92,246,0.18)',
  accent: '#22D3EE',
  danger: '#EF4444',
  success: '#22C55E',
}

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
    Chart.defaults.color = THEME.text
    Chart.defaults.borderColor = THEME.grid
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
        backgroundColor: THEME.primarySoft,
        borderColor: THEME.primary,
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
          'rgba(139,92,246,0.8)',  // violet
          'rgba(56,189,248,0.8)',  // sky/cyan
          'rgba(34,197,94,0.8)',   // green
          'rgba(245,158,11,0.85)', // amber
          'rgba(239,68,68,0.85)',  // red
        ],
        borderColor: THEME.bg,
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
        backgroundColor: 'rgba(34, 211, 238, 0.12)',
        borderColor: THEME.accent,
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
        labels: { color: THEME.text },
        rtl: true,
      },
      tooltip: {
        backgroundColor: '#0B1220',
        titleColor: THEME.text,
        bodyColor: THEME.text,
        borderColor: THEME.border,
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: THEME.subtext },
        grid: { color: THEME.grid }
      },
      y: {
        beginAtZero: true,
        ticks: { color: THEME.subtext },
        grid: { color: THEME.grid }
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
    color = THEME.primary
  }: { icon: React.ReactNode, title: string, value: number, change?: number, color?: string }) => (
    <motion.div
      variants={itemVariants}
      className="relative rounded-2xl border p-5 backdrop-blur"
      style={{
        borderColor: THEME.border,
        background: `linear-gradient(180deg, rgba(148,163,184,0.12) 0%, rgba(15,23,42,0.6) 100%)`
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="grid place-items-center rounded-xl"
          style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(34,211,238,0.12))',
            border: `1px solid ${THEME.border}`
          }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {typeof change === 'number' && (
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: change >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: change >= 0 ? THEME.success : THEME.danger,
              border: `1px solid ${THEME.border}`
            }}
          >
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <h3 className="mt-4 text-sm" style={{ color: THEME.subtext }}>{title}</h3>
      <p className="mt-1 text-3xl font-bold" style={{ color: THEME.text }}>
        {Number(value || 0).toLocaleString()}
      </p>

      {/* زخرفة خفيفة */}
      <div
        className="pointer-events-none absolute -inset-px -z-10 rounded-2xl"
        style={{
          background: 'radial-gradient(600px circle at 80% -10%, rgba(139,92,246,0.15), transparent 40%), radial-gradient(600px circle at -10% 120%, rgba(34,211,238,0.12), transparent 40%)'
        }}
      />
    </motion.div>
  )

  return (
    <motion.section
      dir="rtl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen w-full p-6 md:p-8"
      // ❌ أزلنا أي background هنا – الخلفية تأتي من الـlayout الأب
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex flex-col gap-2">
          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight"
            style={{
              color: THEME.text,
              backgroundImage: 'linear-gradient(90deg, #E2E8F0, #22D3EE, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            لوحة تحكم المعارض
          </h1>
          <p className="text-sm md:text-base" style={{ color: THEME.subtext }}>
            أهلاً بك! تابع أداء المعرض وإحصائياتك من مكان واحد.
          </p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6"
      >
        <StatCard icon={<FaCar size={22} />} title="السيارات المضافة" value={stats.cars} />
        <StatCard icon={<FiShoppingCart size={22} />} title="الطلبات" value={stats.orders} />
        <StatCard icon={<FiEye size={22} />} title="الزيارات" value={stats.visits} />
        <StatCard icon={<FiDollarSign size={22} />} title="الإيرادات (ر.س)" value={stats.revenue} />
        <StatCard icon={<FiTrendingUp size={22} />} title="المزادات النشطة" value={stats.auctions} />
        <StatCard icon={<FiCalendar size={22} />} title="مزادات قادمة" value={stats.upcoming} />
      </motion.div>

      {/* Charts */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6"
      >
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border p-5 md:p-6 backdrop-blur"
          style={{ borderColor: THEME.border, background: THEME.card }}
        >
          <h3 className="text-lg md:text-xl font-bold mb-4" style={{ color: THEME.text }}>مبيعات السيارات خلال الأشهر</h3>
          <div className="h-80">
            <Bar data={salesData} options={baseOptions} />
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-2xl border p-5 md:p-6 backdrop-blur"
          style={{ borderColor: THEME.border, background: THEME.card }}
        >
          <h3 className="text-lg md:text-xl font-bold mb-4" style={{ color: THEME.text }}>توزيع أنواع السيارات</h3>
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
        className="rounded-2xl border p-5 md:p-6 mt-6 backdrop-blur"
        style={{ borderColor: THEME.border, background: THEME.card }}
      >
        <h3 className="text-lg md:text-xl font-bold mb-4" style={{ color: THEME.text }}>الزيارات اليومية خلال الأسبوع</h3>
        <div className="h-96">
          <Line data={visitsData} options={baseOptions} />
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border p-5 md:p-6 mt-6 backdrop-blur"
        style={{ borderColor: THEME.border, background: THEME.card }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-bold" style={{ color: THEME.text }}>أحدث النشاطات</h3>
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ color: THEME.subtext, border: `1px dashed ${THEME.border}` }}
          >
            قادمة من الـ API
          </span>
        </div>

        <div className="grid gap-3">
          {/* ضع عناصر النشاط القادمة من الـAPI هنا */}
          <div className="rounded-xl p-4 border" style={{ borderColor: THEME.border, background: THEME.cardSolid }}>
            <p className="text-sm" style={{ color: THEME.subtext }}>لا يوجد نشاط حتى الآن…</p>
          </div>
        </div>
      </motion.div>

      {/* Global Styles: الخط فقط + سك رول شفاف */}
      <style jsx global>{`
        :root { color-scheme: dark; }
        body {
          font-family: Lama, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Noto Sans Arabic', Cairo, Tahoma, Arial, sans-serif;
          /* ❌ لا نحدد أي خلفية هنا – نتركها للـlayout */
        }
        /* Scrollbar داكن أنيق بدون فرض خلفية */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, ${THEME.primarySoft}, rgba(148,163,184,0.18));
          border-radius: 8px;
          border: 0;
        }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </motion.section>
  )
}
