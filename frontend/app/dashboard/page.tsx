'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { Home, ArrowRight, User, ShoppingCart, CreditCard, ShoppingBag, Truck, Settings } from 'lucide-react'

export default function DashboardTabs() {
  const pathname = usePathname()

  const tabs = [
    { name: 'مشترياتي', href: '/dashboard/my-purchases', icon: <ShoppingCart className="w-4 h-4 ml-1.5" /> },
    { name: 'مبيعاتي', href: '/dashboard/my-sales', icon: <ShoppingBag className="w-4 h-4 ml-1.5" /> },
    { name: 'محفظتي', href: '/dashboard/my-wallet', icon: <CreditCard className="w-4 h-4 ml-1.5" /> },
    { name: 'تحويلاتي', href: '/dashboard/my-transfers', icon: <ArrowRight className="w-4 h-4 ml-1.5" /> },
    { name: 'خدمات الشحن', href: '/dashboard/shipping', icon: <Truck className="w-4 h-4 ml-1.5" /> },
    { name: 'الملف الشخصي', href: '/dashboard/profile', icon: <User className="w-4 h-4 ml-1.5" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* زر العودة للصفحة الرئيسية + عنوان الصفحة */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>الرئيسية</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* البطاقة الرئيسية */}
        <div className="bg-white rounded-lg shadow-md border p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">مرحباً بك في لوحة التحكم</h2>
              <p className="text-gray-500 mt-1">يمكنك إدارة حسابك ومشترياتك ومبيعاتك من هنا</p>
            </div>
            <div className="hidden sm:block">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          {/* شريط التنقل بين الأقسام */}
          <div className="flex overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-3 mx-auto">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "min-w-[110px] flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-all border",
                    pathname === tab.href
                      ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-full",
                    pathname === tab.href ? "bg-blue-100" : "bg-gray-100"
                  )}>
                    {tab.icon}
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">{tab.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* المحتوى الإضافي */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* إحصائيات سريعة */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-800">إحصائيات سريعة</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-500">المشتريات</p>
                <p className="text-2xl font-bold text-gray-800">3</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-sm text-gray-500">المبيعات</p>
                <p className="text-2xl font-bold text-gray-800">5</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <p className="text-sm text-gray-500">رصيد المحفظة</p>
                <p className="text-2xl font-bold text-gray-800">5,000</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-gray-500">الطلبات النشطة</p>
                <p className="text-2xl font-bold text-gray-800">2</p>
              </div>
            </div>
          </div>
          
          {/* آخر النشاطات */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-800">آخر النشاطات</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="p-2 bg-blue-100 rounded-full">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">تم شراء طابعة HP M404dn</p>
                  <p className="text-xs text-gray-500">26 أكتوبر 2024</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="p-2 bg-green-100 rounded-full">
                  <ShoppingBag className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">تم بيع سيرفر Dell</p>
                  <p className="text-xs text-gray-500">25 أكتوبر 2024</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="p-2 bg-amber-100 rounded-full">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">إيداع 5,000 ريال في المحفظة</p>
                  <p className="text-xs text-gray-500">27 أكتوبر 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
