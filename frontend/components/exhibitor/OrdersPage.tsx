'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiFilter, FiPlus, FiX, FiChevronLeft, FiChevronRight, FiEye, FiUser, FiCheckCircle, FiClock, FiTruck
} from 'react-icons/fi'

interface Order {
  id: number
  customer: string
  phone: string
  car: string
  total: number
  status: 'قيد التنفيذ' | 'تم التوصيل' | 'ملغي'
  createdAt: string // ISO
  address: string
  notes: string
}

const statuses = ['قيد التنفيذ', 'تم التوصيل', 'ملغي']

// مودال تفاصيل الطلب
function OrderDetailsModal({ open, onClose, order }: {
  open: boolean,
  onClose: () => void,
  order: Order | null
}) {
  const modalRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const backdropRef = useRef<HTMLDivElement>(null)
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  if (!order) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          onMouseDown={handleBackdrop}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 relative"
            onMouseDown={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute left-4 top-4 text-gray-400 hover:text-gray-700 focus:outline-none"
              aria-label="إغلاق"
              tabIndex={0}
            >
              <FiX size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">تفاصيل الطلب</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiUser className="text-indigo-500" />
                <span className="font-bold">{order.customer}</span>
                <span className="text-gray-500 text-sm">({order.phone})</span>
              </div>
              <div className="flex items-center gap-2">
                <FiTruck className="text-green-500" />
                <span className="font-bold">{order.car}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className={
                  order.status === 'تم التوصيل' ? 'text-green-600' :
                  order.status === 'قيد التنفيذ' ? 'text-yellow-500' : 'text-red-500'
                } />
                <span className="font-bold">{order.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="text-gray-400" />
                <span className="text-sm">{new Date(order.createdAt).toLocaleString('ar-EG')}</span>
              </div>
              <div>
                <span className="text-gray-500 text-sm">العنوان:</span>
                <div className="font-bold">{order.address}</div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">ملاحظات:</span>
                <div className="font-bold">{order.notes || 'لا يوجد'}</div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">الإجمالي:</span>
                <div className="font-bold text-indigo-700 text-lg">{order.total.toLocaleString()} ر.س</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const ordersPerPage = 7

  // بيانات تجريبية
  useEffect(() => {
    const now = new Date()
    const mockOrders: Order[] = [
      {
        id: 1,
        customer: 'محمد علي',
        phone: '0501234567',
        car: 'تويوتا كامري 2022',
        total: 125000,
        status: 'قيد التنفيذ',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        address: 'الرياض - حي العليا',
        notes: 'يرجى الاتصال قبل التوصيل'
      },
      {
        id: 2,
        customer: 'سارة أحمد',
        phone: '0559876543',
        car: 'نيسان باترول 2021',
        total: 210000,
        status: 'تم التوصيل',
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        address: 'جدة - حي الشاطئ',
        notes: ''
      },
      {
        id: 3,
        customer: 'خالد فهد',
        phone: '0533333333',
        car: 'هيونداي اكسنت 2023',
        total: 85000,
        status: 'ملغي',
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        address: 'الدمام - حي الفيصلية',
        notes: 'تم الإلغاء من قبل العميل'
      },
      {
        id: 4,
        customer: 'أحمد يوسف',
        phone: '0544444444',
        car: 'شفروليه كمارو 2020',
        total: 180000,
        status: 'قيد التنفيذ',
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        address: 'مكة - حي العزيزية',
        notes: ''
      },
      {
        id: 5,
        customer: 'نورة خالد',
        phone: '0566666666',
        car: 'مرسيدس E200 2021',
        total: 250000,
        status: 'تم التوصيل',
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        address: 'الرياض - حي النرجس',
        notes: ''
      },
      {
        id: 6,
        customer: 'عبدالله صالح',
        phone: '0577777777',
        car: 'بي ام دبليو X5 2022',
        total: 320000,
        status: 'قيد التنفيذ',
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        address: 'جدة - حي الروضة',
        notes: 'توصيل سريع'
      },
      {
        id: 7,
        customer: 'سلمان ناصر',
        phone: '0588888888',
        car: 'لكزس LX570 2020',
        total: 380000,
        status: 'ملغي',
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        address: 'الدمام - حي الشاطئ',
        notes: ''
      },
      {
        id: 8,
        customer: 'ريم عبدالله',
        phone: '0599999999',
        car: 'فورد رابتر 2023',
        total: 290000,
        status: 'قيد التنفيذ',
        createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
        address: 'الرياض - حي الملقا',
        notes: ''
      }
    ]
    setOrders(mockOrders)
    setFilteredOrders(mockOrders)
    setLoading(false)
  }, [])

  // بحث وفلاتر
  useEffect(() => {
    let results = orders.filter(order => {
      const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.car.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm)
      const matchesFilters = (
        (filters.status === '' || order.status === filters.status)
      )
      return matchesSearch && matchesFilters
    })
    setFilteredOrders(results)
    setCurrentPage(1)
  }, [searchTerm, filters, orders])

  // Pagination
  const indexOfLast = currentPage * ordersPerPage
  const indexOfFirst = indexOfLast - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast)
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <OrderDetailsModal open={showDetails} onClose={() => setShowDetails(false)} order={selectedOrder} />
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
              <FiTruck className="text-indigo-600" />
              الطلبات
            </motion.h1>
            <p className="text-gray-600">إدارة ومتابعة جميع طلبات العملاء بسهولة</p>
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
              placeholder="ابحث عن عميل أو سيارة أو رقم جوال..."
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
                  <label className="block text-gray-700 mb-2">حالة الطلب</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilters({ status: '' })}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500"
          >
            <h3 className="text-gray-500 mb-2">إجمالي الطلبات</h3>
            <p className="text-3xl font-bold">{orders.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500"
          >
            <h3 className="text-gray-500 mb-2">طلبات قيد التنفيذ</h3>
            <p className="text-3xl font-bold">{orders.filter(o => o.status === 'قيد التنفيذ').length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500"
          >
            <h3 className="text-gray-500 mb-2">طلبات تم التوصيل</h3>
            <p className="text-3xl font-bold">{orders.filter(o => o.status === 'تم التوصيل').length}</p>
          </motion.div>
        </div>
        {/* حالة التحميل */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السيارة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                    <td className="px-6 py-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* لا توجد نتائج */}
        {!loading && filteredOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-md p-12 text-center"
          >
            <div className="text-gray-400 mb-4">
              <FiTruck size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">لا توجد طلبات متطابقة</h3>
            <p className="text-gray-500 mb-6">لم نتمكن من العثور على أي طلبات تطابق بحثك أو فلاترك.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setFilters({ status: '' }); setSearchTerm('') }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              عرض جميع الطلبات
            </motion.button>
          </motion.div>
        )}
        {/* جدول الطلبات */}
        {!loading && filteredOrders.length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السيارة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FiUser className="text-indigo-500" />
                          <span className="font-bold">{order.customer}</span>
                          <span className="text-gray-500 text-xs">({order.phone})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold">{order.car}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'تم التوصيل' ? 'bg-green-100 text-green-800' :
                          order.status === 'قيد التنفيذ' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-700">{order.total.toLocaleString()} ر.س</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('ar-EG')}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                          onClick={() => { setSelectedOrder(order); setShowDetails(true) }}
                        >
                          <FiEye size={18} />
                          عرض التفاصيل
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  عرض <span className="font-medium">{indexOfFirst + 1}</span> إلى <span className="font-medium">
                    {Math.min(indexOfLast, filteredOrders.length)}
                  </span> من <span className="font-medium">{filteredOrders.length}</span> طلب
                </div>
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentPage === number
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}