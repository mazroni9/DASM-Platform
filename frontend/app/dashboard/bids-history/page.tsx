"use client"
import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Zap } from 'lucide-react';

const BidLogsTimeline = ({ auctionId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outbid: 0
  });

  useEffect(() => {
    fetchBidLogs();
  }, [auctionId, filter]);

  const fetchBidLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bids-history?filter=${filter}`);
      const data = await res.json();
      setLogs(data.data || []);
      setStats(data.stats || { total: 0, active: 0, outbid: 0 });
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'bid_placed':
        return <CheckCircle className="w-6 h-6 text-white" />;
      case 'outbid':
        return <TrendingDown className="w-6 h-6 text-white" />;
      case 'autobid_fired':
        return <Zap className="w-6 h-6 text-white" />;
      case 'bid_rejected':
        return <XCircle className="w-6 h-6 text-white" />;
      case 'bid_withdrawn':
        return <AlertCircle className="w-6 h-6 text-white" />;
      default:
        return <TrendingUp className="w-6 h-6 text-white" />;
    }
  };

  const getEventStyle = (eventType) => {
    switch (eventType) {
      case 'bid_placed':
        return {
          bgGradient: 'from-green-400 to-green-600',
          borderColor: 'border-green-500',
          bgLight: 'bg-green-50',
          badgeBg: 'bg-green-100',
          badgeText: 'text-green-700',
          pulse: true
        };
      case 'outbid':
        return {
          bgGradient: 'from-orange-400 to-orange-600',
          borderColor: 'border-orange-400',
          bgLight: 'bg-white',
          badgeBg: 'bg-orange-100',
          badgeText: 'text-orange-700',
          pulse: false
        };
      case 'autobid_fired':
        return {
          bgGradient: 'from-blue-400 to-blue-600',
          borderColor: 'border-blue-500',
          bgLight: 'bg-blue-50',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-700',
          pulse: false
        };
      case 'bid_rejected':
        return {
          bgGradient: 'from-red-400 to-red-600',
          borderColor: 'border-red-500',
          bgLight: 'bg-red-50',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
          pulse: false
        };
      default:
        return {
          bgGradient: 'from-gray-300 to-gray-400',
          borderColor: 'border-gray-300',
          bgLight: 'bg-white',
          badgeBg: 'bg-gray-100',
          badgeText: 'text-gray-700',
          pulse: false
        };
    }
  };

  const getEventBadge = (eventType) => {
    const badges = {
      bid_placed: 'مزايدة نشطة',
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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'منذ لحظات';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return date.toLocaleString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">سجل المزايدات</h1>
            <p className="text-gray-600 mt-1">رقم المزاد #{auctionId}</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">إجمالي المزايدات</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">مزايدات نشطة</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.outbid}</div>
            <div className="text-sm text-gray-600">تم تجاوزها</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setFilter('bid_placed')}
            className={`px-4 py-2 rounded-lg text-sm ${filter === 'bid_placed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            نشطة
          </button>
          <button 
            onClick={() => setFilter('outbid')}
            className={`px-4 py-2 rounded-lg text-sm ${filter === 'outbid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            متجاوزة
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {logs.map((log, i) => {
          const style = getEventStyle(log.event_type);
          
          return (
            <div key={log.bid_id} className="relative pr-16 mb-8">
              {/* Timeline Icon */}
              <div className={`absolute right-0 top-0 w-12 h-12 bg-gradient-to-br ${style.bgGradient} rounded-full flex items-center justify-center shadow-lg ${style.pulse ? 'animate-pulse' : ''}`}>
                {getEventIcon(log.event_type)}
              </div>
              
              {/* Timeline Line */}
              {i < logs.length - 1 && (
                <div className="absolute right-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 to-gray-200"></div>
              )}
              
              {/* Card */}
              <div className={`${style.bgLight} rounded-lg shadow-sm p-5 border-r-4 ${style.borderColor} transition-all hover:-translate-x-1 hover:shadow-md`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">
                      {log.event}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
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
                    <div className={`text-2xl font-bold ${log.event_type === 'outbid' ? 'text-gray-600 line-through' : 'text-gray-800'}`}>
                      {parseFloat(log.bid_amount).toLocaleString('ar-SA')} {log.currency}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(log.server_ts_utc)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(log.server_ts_utc).toLocaleString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Warning for outbid */}
                {log.event_type === 'outbid' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <strong>تنبيه:</strong> تم تجاوز مزايدتك. قم بزيادة عرضك للبقاء في المنافسة.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {logs.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-400 mb-2">
            <TrendingUp className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-600">لا توجد مزايدات بعد</p>
        </div>
      )}
    </div>
  );
};

export default BidLogsTimeline;