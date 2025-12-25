'use client';

import React, { useState, useEffect } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { 
    Youtube, 
    Settings, 
    Save, 
    ExternalLink, 
    Eye, 
    Users, 
    Video,
    CheckCircle,
    AlertTriangle,
    Info,
    Shield,
    RefreshCw,
    Sparkles,
    Link2,
    QrCode
} from 'lucide-react';

const MAIN_CHANNEL_ID = 'UCxiLyu5z-T0FanDNotwTJcg';

export default function YoutubeChannelManagementPage() {
  const [channelId, setChannelId] = useState(MAIN_CHANNEL_ID);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [channelInfo, setChannelInfo] = useState({
    name: 'القناة الرئيسية',
    subscribers: '1.2M',
    videos: '245',
    status: 'active'
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      setSuccessMessage(null);
      setError(null);
      
      // التحقق من تنسيق معرّف القناة
      if (!channelId.startsWith('UC') || channelId.length !== 24) {
        setError('تنسيق معرّف القناة غير صحيح. يجب أن يبدأ بـ UC ويتكون من 24 حرفًا');
        return;
      }
      
      // محاكاة عملية الحفظ
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccessMessage('تم تحديث معرّف قناة اليوتيوب بنجاح');
      
      // تحديث معلومات القناة (محاكاة)
      setChannelInfo({
        name: 'قناة المزادات الراقية',
        subscribers: '1.3M',
        videos: '256',
        status: 'active'
      });
      
    } catch (err) {
      setError('حدث خطأ أثناء حفظ معرّف القناة');
    } finally {
      setLoading(false);
    }
  };

  const validateChannelId = (id: string) => {
    return id.startsWith('UC') && id.length === 24;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6 rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            إدارة قنوات اليوتيوب
          </h1>
          <p className="text-gray-400 mt-2">
            إدارة وتكوين قنوات البث المباشر على اليوتيوب
          </p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-3">
            <Youtube className="w-6 h-6 text-red-400" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">حالة القناة</p>
                <p className="text-2xl font-bold text-green-400 mt-1">نشطة</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">المشتركين</p>
                <p className="text-2xl font-bold text-white mt-1">{channelInfo.subscribers}</p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-xl">
                <Users className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">الفيديوهات</p>
                <p className="text-2xl font-bold text-white mt-1">{channelInfo.videos}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <Video className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">البثوث المباشرة</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">12</p>
              </div>
              <div className="bg-cyan-500/10 p-3 rounded-xl">
                <Eye className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Configuration Section */}
          <div className="xl:col-span-2">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
              {/* Form Header */}
              <div className="border-b border-gray-700/50 p-6 bg-gradient-to-r from-gray-800 to-gray-900">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-2 rounded-xl">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">إعدادات القناة الرئيسية</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      تكوين قناة اليوتيوب الرئيسية للبث المباشر
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Success/Error Messages */}
                {successMessage && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <p className="text-green-400">{successMessage}</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {/* Channel ID Input */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-200">
                    معرّف قناة اليوتيوب <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      className={`w-full bg-gray-700/50 border ${
                        validateChannelId(channelId) 
                          ? 'border-green-500/50' 
                          : 'border-gray-600'
                      } rounded-xl py-4 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300`}
                      placeholder="UCxiLyu5z-T0FanDNotwTJcg"
                      dir="ltr"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Link2 className="w-5 h-5 text-gray-400" />
                    </div>
                    {validateChannelId(channelId) && (
                      <div className="absolute left-10 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    يجب أن يبدأ المعرّف بـ <code className="bg-gray-700 px-1 rounded">UC</code> ويتكون من 24 حرفاً
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href={`https://www.youtube.com/channel/${channelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300 py-3 px-4 rounded-xl text-center flex items-center justify-center space-x-2 space-x-reverse"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>فتح القناة على اليوتيوب</span>
                  </a>
                  
                  <button
                    onClick={handleSave}
                    disabled={loading || !validateChannelId(channelId)}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>حفظ التغييرات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Information Card */}
            <div className="mt-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                <Info className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">كيفية العثور على معرّف القناة</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>اذهب إلى صفحة القناة على يوتيوب</span>
                </div>
                <div className="flex items-start space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>انقر على &quot;حول&quot; ثم &quot;مشاركة القناة&quot;</span>
                </div>
                <div className="flex items-start space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>ستجد المعرّف في عنوان URL يبدأ بـ UC</span>
                </div>
                <div className="flex items-start space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>مثال: <code className="bg-gray-700 px-1 rounded">UCxiLyu5z-T0FanDNotwTJcg</code></span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            {/* Channel Preview */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <Eye className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">معاينة القناة</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-700/30 rounded-xl p-4 text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Youtube className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-white font-medium">{channelInfo.name}</div>
                  <div className="text-gray-400 text-sm mt-1">{channelInfo.subscribers} مشترك</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <div className="text-cyan-400 font-bold">{channelInfo.videos}</div>
                    <div className="text-gray-400">فيديو</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <div className="text-green-400 font-bold">12</div>
                    <div className="text-gray-400">بث مباشر</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Status */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <Shield className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">الحالة الأمنية</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">التوثيق</span>
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 ml-1" />
                    نشط
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">البث المباشر</span>
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 ml-1" />
                    مفعل
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">API متصل</span>
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 ml-1" />
                    متصل
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">إجراءات سريعة</h3>
              </div>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-500/10 to-cyan-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-white transition-all duration-300 py-3 px-4 rounded-xl text-right flex items-center justify-between">
                  <span>إدارة البثوث</span>
                  <Video className="w-4 h-4" />
                </button>
                <button className="w-full bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:text-white transition-all duration-300 py-3 px-4 rounded-xl text-right flex items-center justify-between">
                  <span>إحصائيات القناة</span>
                  <QrCode className="w-4 h-4" />
                </button>
                <button className="w-full bg-gradient-to-r from-green-500/10 to-emerald-600/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 hover:text-white transition-all duration-300 py-3 px-4 rounded-xl text-right flex items-center justify-between">
                  <span>الإعدادات المتقدمة</span>
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <LoadingLink
            href="/admin"
            className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300 inline-flex items-center space-x-2 space-x-reverse"
          >
            <span>العودة إلى لوحة التحكم</span>
          </LoadingLink>
        </div>
      </div>
    </div>
  );
}