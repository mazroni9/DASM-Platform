"use client"
import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Zap } from 'lucide-react';
import api from '@/lib/axios';
import { PriceWithIcon } from '@/components/ui/priceWithIcon';
import * as dayjs from 'dayjs'
import 'dayjs/locale/ar'
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

const BidLogsTimeline = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [auctionIds, setAuctionIds] = useState([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    bid_placed: 0,
    outbid: 0
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLogs([]);
    setPage(1);
    fetchBidLogs(1, true);
  }, [selectedAuctionId, filter]);

  const fetchBidLogs = async (pageNum, isNewFilter = false) => {
    if (isNewFilter) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      let url = `/api/bids-history?filter=${filter}&page=${pageNum}`;
      if (selectedAuctionId) {
        url += `&auction_id=${selectedAuctionId}`;
      }
      const res = await api.get(url);
      const data = await res.data;
      setLogs(prev => isNewFilter ? (data.data || []) : [...prev, ...(data.data || [])]);
      setPagination(data.pagination);
      if (isNewFilter) {
        setAuctionIds(Object.values(data.auctions_ids) || []);
        setStats(data.stats || { total: 0, bid_placed: 0, outbid: 0 });
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      if (isNewFilter) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const getEventIcon = (eventType: string) => {
    // كلاسات موحدة لحجم الأيقون
    const iconClasses = "w-6 h-6";
  
    switch (eventType) {
      case 'bid_placed':
        // استخدم لون DASM الأخضر (Secondary) للنجاح
        return <CheckCircle className={`${iconClasses} text-secondary`} />;
      
      case 'outbid':
        // استخدم لون تحذيري (برتقالي)
        return <TrendingDown className={`${iconClasses} text-orange-500`} />;
      
      case 'autobid_fired':
        // استخدم لون DASM الأزرق (Primary) للإجراءات الآلية
        return <Zap className={`${iconClasses} text-primary`} />;
      
      case 'bid_rejected':
        // استخدم لون الخطر (أحمر)
        return <XCircle className={`${iconClasses} text-red-500`} />;
      
      case 'bid_withdrawn':
        // استخدم لون تحذيري
        return <AlertCircle className={`${iconClasses} text-orange-500`} />;
      
      default:
        // استخدم لوناً محايداً (رمادي)
        return <TrendingUp className={`${iconClasses} text-gray-500`} />;
    }
  };
// import { useTheme } from 'next-themes';

const getEventStyle = (eventType: string) => {

  switch (eventType) {
    case 'bid_placed':
      return {
       
        bgColor: 'bg-secondary', 
        textColor: 'text-white', 
        borderColor: 'border-secondary', 
        
        cardBg: 'bg-card', 
        cardBorder: 'border-border', 
        cardText: 'text-foreground', 
        
        badgeBg: 'bg-secondary/20', // أخضر فاتح للـ badge
        badgeText: 'text-secondary', // نص أخضر للـ badge
        
        pulse: true
      };
    case 'outbid':
      return {
     
        bgColor: 'bg-orange-500', // يمكن تعريف لون تحذيري جديد في Tailwind
        textColor: 'text-white',
        borderColor: 'border-orange-500',
        
        cardBg: 'bg-card', // لون خلفية الكارت المتوافق مع الثيم
        cardBorder: 'border-border', // حدود الكارت
        cardText: 'text-foreground', // نص الكارت
        
        badgeBg: 'bg-orange-500/20',
        badgeText: 'text-orange-500',
        
        pulse: false
      };
    case 'autobid_fired':
      return {
        // اللون الأزرق للأتمتة/الـ autobid
        bgColor: 'bg-primary', // لون DASM الأزرق
        textColor: 'text-white',
        borderColor: 'border-primary',
        
        cardBg: 'bg-card', // لون خلفية الكارت المتوافق مع الثيم
        cardBorder: 'border-border', // حدود الكارت
        cardText: 'text-foreground', // نص الكارت
        
        badgeBg: 'bg-primary/20', // أزرق فاتح للـ badge
        badgeText: 'text-primary', // نص أزرق للـ badge
        
        pulse: false
      };
    case 'bid_rejected':
      return {
        // اللون الأحمر للرفض/الأخطاء
        bgColor: 'bg-red-500', // يمكن تعريف لون خطأ جديد في Tailwind
        textColor: 'text-white',
        borderColor: 'border-red-500',
        
        cardBg: 'bg-card', // لون خلفية الكارت المتوافق مع الثيم
        cardBorder: 'border-border', // حدود الكارت
        cardText: 'text-foreground', // نص الكارت
        
        badgeBg: 'bg-red-500/20',
        badgeText: 'text-red-500',
        
        pulse: false
      };
    default:
      return {
        // الألوان الافتراضية/الرمادية
        bgColor: 'bg-gray-500',
        textColor: 'text-white',
        borderColor: 'border-gray-500',
        
        cardBg: 'bg-card', // لون خلفية الكارت المتوافق مع الثيم
        cardBorder: 'border-border', // حدود الكارت
        cardText: 'text-foreground', // نص الكارت
        
        badgeBg: 'bg-gray-500/20',
        badgeText: 'text-gray-500',
        
        pulse: false
      };
  }
};
  const getEventBadge = (eventType) => {
    const badges = {
      bid_placed: 'تمت المزايدة',
      outbid: 'تم التجاوز',
      autobid_fired: 'مزايدة تلقائية',
      bid_rejected: 'مرفوضة',
      bid_withdrawn: 'ملغية'
    };
    return badges[eventType] || eventType;
  };

  const getChannelText = (channel) => {
    const channels = {
      web: 'موقع الويب',
      app: 'التطبيق',
      onsite: 'في الموقع',
      agent: 'عبر وكيل',
      api: 'API'
    };
    return channels[channel] || channel;
  };
  const relativeTime = require("dayjs/plugin/relativeTime");
  // import relativeTime from 'dayjs/plugin/relativeTime' // ES 2015
  dayjs.extend(relativeTime);

  const formatTime = (timestamp) => {
    const date = dayjs(timestamp).locale('ar').fromNow();
    return date;

  };

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 100 || loading || loadingMore) {
      return;
    }
    if (pagination && pagination.current_page < pagination.last_page) {
      setPage(prevPage => prevPage + 1);
    }
  };

  useEffect(() => {
    if (page > 1) {
      fetchBidLogs(page);
    }
  }, [page]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, pagination]);

  const SkeletonCard = () => (
    <div className="relative pr-16 mb-8">
        <div className="absolute right-0 top-0">
            <Skeleton variant="circular" width={48} height={48} />
        </div>
        <div className="absolute right-6 top-12 bottom-0 w-0.5 bg-gray-200" />
        <div className="bg-white rounded-lg shadow-sm p-5 border-r-4 border-gray-200">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <Skeleton variant="text" width={150} sx={{ fontSize: '1rem' }} />
                    <Skeleton variant="text" width={100} sx={{ fontSize: '0.75rem' }} />
                </div>
                <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" />
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton variant="text" width={120} sx={{ fontSize: '1.5rem' }} />
                </div>
                <div className="text-left">
                    <Skeleton variant="text" width={80} sx={{ fontSize: '0.875rem' }} />
                    <Skeleton variant="text" width={60} sx={{ fontSize: '0.75rem' }} />
                </div>
            </div>
            <Skeleton variant="text" width={100} sx={{ fontSize: '0.875rem' }} className="mt-1" />
        </div>
    </div>
);

  return (
    <div className="max-w-4xl mx-auto mt-4">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">سجل المزايدات</h1>
            {/* <p className="text-gray-600 mt-1">رقم المزاد #{auctionId}</p> */}
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-foreground/70">إجمالي المزايدات</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.bid_placed}</div>
            <div className="text-sm text-foreground/70">مزايدات تمت</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground/50">{stats.outbid}</div>
            <div className="text-sm text-foreground/70">تم تجاوزها</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm mb-6 p-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-primary text-white' : 'bg-border text-foreground hover:bg-border/80'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setFilter('bid_placed')}
            className={`px-4 py-2 rounded-lg text-sm ${filter === 'bid_placed' ? 'bg-primary text-white' : 'bg-border text-foreground hover:bg-border/80'}`}
          >
            مزايدات تمت
          </button>
          <button 
            onClick={() => setFilter('outbid')}
            className={`px-4 py-2 rounded-lg text-sm ${filter === 'outbid' ? 'bg-primary text-white' : 'bg-border text-foreground hover:bg-border/80'}`}
          >
            متجاوزة
          </button>
          <select
            value={selectedAuctionId}
            onChange={(e) => setSelectedAuctionId(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm bg-border text-foreground hover:bg-border/80"
          >
            <option value="">كل المزادات</option>
            {auctionIds.map((id) => (
              <option key={id} value={id}>
                مزاد #{id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
         {
         loading ? (
           // عرض skeleton cards أثناء التحميل
           Array.from(new Array(5)).map((_, index) => (
            <SkeletonCard key={index} />
           ))
         ) :
         logs.map((log, i) => {
           const style = getEventStyle(log.event_type);
           
           return (
            <div key={log.bid_id} className="relative pr-16 mb-8">
              {/* Timeline Icon */}
              <div className={`absolute right-0 top-0 w-12 h-12 bg-gradient-to-br ${style.badgeBg}  rounded-full flex items-center justify-center shadow-lg ${style.pulse ? 'animate-pulse' : ''}`}>
                {getEventIcon(log.event_type)}
              </div>
              
              {/* Timeline Line */}
              {i < logs.length - 1 && (
                <div className="absolute right-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-primary to-border"></div>
              )}
              
              {/* Card */}
              <div className={`${style.cardBg} rounded-lg shadow-sm p-5 border-r-4  ${style.borderColor}  transition-all hover:-translate-x-1 hover:shadow-md`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-foreground mb-1">
                      {log.event}
                    </div>
                    <div className="text-xs text-foreground/70 flex items-center gap-2">
                      <span>{getChannelText(log.channel)}</span>
                      {log.reason_code && (
                        <>
                          <span>•</span>
                          <span>{log.reason_code}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 ${style.badgeBg} ${style.badgeText} text-xs rounded-full font-semibold whitespace-nowrap`}>
                    {getEventBadge(log.event_type)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${log.event_type === 'outbid' ? 'text-foreground/70 ' : 'text-foreground'}`}>
                      <PriceWithIcon price={log.bid_amount} />
                    </div>
                  </div>
                  
                  <div className="text-left">
                    <div className="text-sm text-foreground/80 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(log.client_ts)}
                    </div>
                    <div className="text-xs text-foreground/50 mt-1">
                      {new Date(log.client_ts).toLocaleString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-foreground/80 mt-1">رقم المزاد #{log.auction_id}</p>
          
              </div>
            </div>
          );
        })}
        {loadingMore && (
          Array.from(new Array(2)).map((_, index) => (
            <SkeletonCard key={index} />
           ))
        )}
       </div>
 
       {logs.length === 0 && !loading &&(
         <div className="bg-card rounded-lg shadow-sm p-8 text-center">
          <div className="text-foreground/50 mb-2">
            <TrendingUp className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-foreground/70">لا توجد مزايدات بعد</p>
        </div>
      )}
    </div>
  );
};

export default BidLogsTimeline;