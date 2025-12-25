'use client';

import { useState, useMemo } from 'react';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import LoadingLink from "@/components/LoadingLink";
import { 
  Package, 
  DollarSign, 
  Truck, 
  CheckCircle, 
  MessageSquare,
  Filter,
  Search,
  Calendar,
  User,
  TrendingUp,
  CreditCard,
  Clock,
  Eye,
  Sparkles,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

// Mock data for sales
const mockSales = [
  {
    id: 's1',
    itemId: 'item123', 
    itemName: 'طابعة ليزر HP M404dn',
    imageUrl: '/office-placeholder.png',
    salePrice: 1500,
    endDate: '2024-10-26',
    status: 'paid_pending_delivery',
    buyerUsername: 'أحمد علي',
    buyerRating: 4.8,
    commissionRate: 0.10,
    category: 'أجهزة مكتبية',
    bidCount: 12,
    saleDate: '2024-10-25'
  },
  {
    id: 's2',
    itemId: 'server456',
    itemName: 'سيرفر Dell PowerEdge R730',
    imageUrl: '/server-placeholder.png',
    salePrice: 8500,
    endDate: '2024-10-25',
    status: 'completed',
    buyerUsername: 'فاطمة سعد',
    buyerRating: 4.9,
    commissionRate: 0.08,
    category: 'سيرفرات',
    bidCount: 8,
    saleDate: '2024-10-24'
  },
  {
    id: 's3',
    itemId: 'medical789',
    itemName: 'جهاز أشعة Siemens Mobilett',
    imageUrl: '/medical-placeholder.png',
    salePrice: 3200,
    endDate: '2024-10-24',
    status: 'payment_pending',
    buyerUsername: 'خالد فهد',
    buyerRating: 4.5,
    commissionRate: 0.12,
    category: 'أجهزة طبية',
    bidCount: 15,
    saleDate: '2024-10-23'
  },
  {
    id: 's4',
    itemId: 'car001',
    itemName: 'تويوتا كامري 2023',
    imageUrl: '/car-placeholder.png',
    salePrice: 55000,
    endDate: '2024-10-23',
    status: 'shipped',
    buyerUsername: 'محمد عبدالله',
    buyerRating: 4.7,
    commissionRate: 0.05,
    category: 'سيارات',
    bidCount: 23,
    saleDate: '2024-10-22'
  },
];

// Helper function
const getSellerStatusConfig = (status: string) => {
  const statusMap = {
    'payment_pending': { 
      text: 'بانتظار دفع المشتري', 
      color: 'text-amber-400',
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      icon: Clock
    },
    'paid_pending_delivery': { 
      text: 'تم الدفع - بانتظار التسليم', 
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      icon: Package
    },
    'shipped': { 
      text: 'تم الشحن', 
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/20',
      border: 'border-cyan-500/30',
      icon: Truck
    },
    'delivered_pending_confirmation': { 
      text: 'بانتظار تأكيد المشتري', 
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/30',
      icon: Truck
    },
    'completed': { 
      text: 'مكتملة (تم التحويل)', 
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      icon: CheckCircle
    }
  };
  
  return statusMap[status] || { 
    text: status, 
    color: 'text-gray-400',
    bg: 'bg-gray-500/20',
    border: 'border-gray-500/30',
    icon: Package
  };
};

export default function MySalesPage() {
  const [sales, setSales] = useState(mockSales);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = sale.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || sale.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [sales, searchTerm, statusFilter, categoryFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
    const totalCommission = sales.reduce((sum, sale) => sum + (sale.salePrice * sale.commissionRate), 0);
    const netRevenue = totalRevenue - totalCommission;
    
    return {
      total: sales.length,
      completed: sales.filter(s => s.status === 'completed').length,
      pending: sales.filter(s => s.status === 'payment_pending').length,
      totalRevenue: totalRevenue,
      netRevenue: netRevenue,
      totalCommission: totalCommission
    };
  }, [sales]);

  const handleArrangeDelivery = (saleId: string) => {
    // Simulate delivery arrangement
    setSales(sales.map(s => 
      s.id === saleId ? { ...s, status: 'shipped' } : s
    ));
  };

  const handleConfirmShipment = (saleId: string) => {
    // Simulate shipment confirmation
    setSales(sales.map(s => 
      s.id === saleId ? { ...s, status: 'delivered_pending_confirmation' } : s
    ));
  };

  const handleOpenDispute = (saleId: string) => {
    // Simulate opening a dispute
    alert(`Opening dispute for sale ID: ${saleId}`);
  };

  const getCategories = () => {
    return [...new Set(sales.map(s => s.category))];
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-2xl border border-border rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  مبيعاتي <span className="text-primary">({stats.total})</span>
                </h1>
                <p className="text-foreground/70 text-sm mt-1">إدارة وتتبع جميع مبيعاتك في المزادات</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-500/20 rounded">
                    <Package className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-xs text-foreground/70">المجموع</span>
                </div>
                <p className="text-lg font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-emerald-500/20 rounded">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-xs text-foreground/70">مكتملة</span>
                </div>
                <p className="text-lg font-bold text-emerald-400 mt-1">{stats.completed}</p>
              </div>
              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-amber-500/20 rounded">
                    <Clock className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-xs text-foreground/70">بانتظار الدفع</span>
                </div>
                <p className="text-lg font-bold text-amber-400 mt-1">{stats.pending}</p>
              </div>
              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-cyan-500/20 rounded">
                    <DollarSign className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-xs text-foreground/70">صافي الإيرادات</span>
                </div>
                <p className="text-lg font-bold text-cyan-400 mt-1">
                  {stats.netRevenue.toLocaleString('ar-EG')}
                </p>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-3 bg-background/30 rounded-lg border border-border">
              <div className="text-sm">
                <span className="text-foreground/70">إجمالي المبيعات: </span>
                <span className="text-foreground font-medium">{stats.totalRevenue.toLocaleString('ar-EG')} ريال</span>
              </div>
              <div className="text-sm">
                <span className="text-foreground/70">عمولة المنصة: </span>
                <span className="text-rose-400 font-medium">-{stats.totalCommission.toLocaleString('ar-EG')} ريال</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <LoadingLink
              href="/dashboard/mycars"
              className="flex items-center gap-2 px-4 py-3 bg-secondary text-white rounded-xl border border-secondary/30 hover:scale-105 transition-all duration-300 group"
            >
              <Package className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-medium">إضافة عنصر جديد</span>
            </LoadingLink>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/70" />
              <input
                type="text"
                placeholder="ابحث في المبيعات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-xl pl-4 pr-10 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="all">جميع الحالات</option>
              <option value="payment_pending">بانتظار الدفع</option>
              <option value="paid_pending_delivery">تم الدفع</option>
              <option value="shipped">تم الشحن</option>
              <option value="delivered_pending_confirmation">بانتظار التأكيد</option>
              <option value="completed">مكتملة</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="all">جميع الفئات</option>
              {getCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <Filter className="w-4 h-4" />
            <span>عرض {filteredSales.length} من {sales.length} عملية بيع</span>
          </div>
        </div>
      </motion.div>

      {/* Sales List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredSales.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-card/30 rounded-2xl border border-border max-w-md mx-auto">
              <TrendingUp className="w-16 h-16 text-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground/70 mb-2">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'لا توجد نتائج' 
                  : 'لا توجد مبيعات'
                }
              </h3>
              <p className="text-foreground/50 text-sm mb-4">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'لم نتمكن من العثور على مبيعات تطابق معايير البحث'
                  : 'لم تقم ببيع أي عناصر في المزادات بعد'
                }
              </p>
              {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="px-4 py-2 bg-primary/20 text-primary rounded-lg border border-primary/30 hover:bg-primary/30 transition-colors"
                >
                  إعادة تعيين الفلتر
                </button>
              ) : (
                <LoadingLink
                  href="/dashboard/mycars"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:scale-105 transition-all duration-300"
                >
                  <Package className="w-4 h-4" />
                  إضافة أول عنصر للبيع
                </LoadingLink>
              )}
            </div>
          </div>
        ) : (
          filteredSales.map((sale, index) => {
            const statusConfig = getSellerStatusConfig(sale.status);
            const StatusIcon = statusConfig.icon;
            const netAmount = sale.salePrice * (1 - sale.commissionRate);
            const commissionAmount = sale.salePrice * sale.commissionRate;
            
            return (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border/70 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 bg-background rounded-xl overflow-hidden">
                      <img 
                        src={sale.imageUrl} 
                        alt={sale.itemName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://via.placeholder.com/200x200?text=No+Image";
                        }}
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-foreground/80 transition-colors mb-2">
                          {sale.itemName}
                        </h3>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-foreground/70 mb-3">
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>{sale.category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>بيعت في {sale.saleDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{sale.bidCount} مزايدة</span>
                          </div>
                        </div>

                        {/* Buyer Info */}
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2 text-foreground/70">
                            <User className="w-4 h-4" />
                            <span>المشتري:</span>
                            <span className="text-blue-300">{sale.buyerUsername}</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-400">
                            <span>⭐ {sale.buyerRating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start lg:items-end gap-3">
                        {/* Price Info */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-secondary">
                            {sale.salePrice.toLocaleString('ar-EG')} ريال
                          </div>
                          <div className="text-sm text-foreground/70 mt-1">
                            صافي: <span className="text-emerald-400">{netAmount.toLocaleString('ar-EG')} ريال</span>
                          </div>
                          <div className="text-xs text-rose-400">
                            عمولة: -{commissionAmount.toLocaleString('ar-EG')} ريال
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm",
                          statusConfig.bg,
                          statusConfig.border,
                          statusConfig.color
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.text}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                      {sale.status === 'paid_pending_delivery' && (
                        <button 
                          onClick={() => handleArrangeDelivery(sale.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/30 transition-all duration-300 group/delivery"
                        >
                          <MessageSquare className="w-4 h-4 transition-transform group-hover/delivery:scale-110" />
                          <span className="font-medium">تواصل مع المشتري للتسليم</span>
                        </button>
                      )}
                      
                      {sale.status === 'shipped' && (
                        <button 
                          onClick={() => handleConfirmShipment(sale.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/30 transition-all duration-300 group/ship"
                        >
                          <Truck className="w-4 h-4 transition-transform group-hover/ship:scale-110" />
                          <span className="font-medium">تأكيد الشحن</span>
                        </button>
                      )}

                      <LoadingLink
                        href={`/auctions/item/${sale.itemId}`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-300 group/view"
                      >
                        <Eye className="w-4 h-4 transition-transform group-hover/view:scale-110" />
                        <span className="font-medium">عرض تفاصيل العنصر</span>
                      </LoadingLink>

                      {sale.status !== 'completed' && (
                        <button 
                          onClick={() => handleOpenDispute(sale.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30 hover:bg-rose-500/30 transition-all duration-300 group/dispute"
                        >
                          <AlertCircle className="w-4 h-4 transition-transform group-hover/dispute:scale-110" />
                          <span className="font-medium">فتح نزاع</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}