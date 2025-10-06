'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import LoadingLink from '@/components/LoadingLink';
import { 
  ArrowRight, 
  Save, 
  Calendar,
  Volume2,
  Zap,
  Clock,
  Sparkles,
  FileText,
  Settings
} from 'lucide-react';

export default function NewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    session_date: '',
    status: 'scheduled' as 'scheduled' | 'active' | 'completed' | 'cancelled',
    type: 'live' as 'live' | 'instant' | 'silent',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.session_date) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/admin/sessions', formData);
      if (response.data.success) {
        toast.success('تم إنشاء الجلسة بنجاح');
        router.push('/admin/sessions');
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((errorMsg: any) => {
          toast.error(errorMsg[0]);
        });
      } else {
        toast.error('حدث خطأ أثناء إنشاء الجلسة');
      }
    } finally {
      setLoading(false);
    }
  };

  const sessionTypes = [
    {
      value: 'live',
      label: 'مباشر',
      description: 'مزاد مباشر مع مزايدين متواجدين',
      icon: Volume2,
      color: 'from-green-500 to-emerald-600'
    },
    {
      value: 'instant',
      label: 'فوري',
      description: 'مزاد فوري بفترات زمنية قصيرة',
      icon: Zap,
      color: 'from-amber-500 to-orange-600'
    },
    {
      value: 'silent',
      label: 'صامت',
      description: 'مزاد صامت بمزايدات مغلقة',
      icon: Clock,
      color: 'from-blue-500 to-cyan-600'
    }
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'مجدولة', color: 'text-blue-400' },
    { value: 'active', label: 'نشطة', color: 'text-green-400' },
    { value: 'completed', label: 'مكتملة', color: 'text-gray-400' },
    { value: 'cancelled', label: 'ملغاة', color: 'text-red-400' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div className="flex items-center space-x-4 space-x-reverse">
          <LoadingLink
            href="/admin/sessions"
            className="bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 p-3 rounded-xl"
          >
            <ArrowRight className="w-5 h-5" />
          </LoadingLink>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              إنشاء جلسة مزاد جديدة
            </h1>
            <p className="text-gray-400 mt-2">
              أضف جلسة مزاد جديدة مع تحديد كافة التفاصيل والمعلومات
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-3">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Form Header */}
          <div className="border-b border-gray-700/50 p-6 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">تفاصيل الجلسة</h2>
                <p className="text-gray-400 text-sm mt-1">
                  املأ المعلومات الأساسية للجلسة الجديدة
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Session Name */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-200">
                اسم الجلسة <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-4 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                  placeholder="أدخل اسم الجلسة (مثال: جلسة المزاد الأسبوعية - ديسمبر 2024)"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Settings className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Session Date */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-200">
                تاريخ ووقت الجلسة <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="session_date"
                  value={formData.session_date}
                  onChange={handleChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-4 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Session Type */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-200">
                نوع الجلسة <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sessionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.value}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ${
                        formData.type === type.value
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`bg-gradient-to-r ${type.color} p-2 rounded-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{type.label}</div>
                          <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                        </div>
                        {formData.type === type.value && (
                          <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status and Description */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-200">
                  حالة الجلسة <span className="text-red-400">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                  required
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value} className="bg-gray-800">
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-200">
                  وصف الجلسة (اختياري)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-4 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="أدخل وصفاً مختصراً للجلسة..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-gray-700/50">
              <LoadingLink
                href="/admin/sessions"
                className="px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white rounded-xl transition-all duration-300 text-center font-medium"
              >
                إلغاء
              </LoadingLink>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 font-medium flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>جاري إنشاء الجلسة...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>إنشاء الجلسة</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">نصائح سريعة</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span>اختر نوع الجلسة المناسب لنوع المزاد</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span>تأكد من صحة التاريخ والوقت قبل الحفظ</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span>استخدم أسماء واضحة ومعبرة للجلسات</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span>يمكنك تعديل الجلسة لاحقاً إذا لزم الأمر</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}