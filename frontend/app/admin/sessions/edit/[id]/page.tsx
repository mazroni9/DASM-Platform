'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface SessionData {
  id: number;
  name: string;
  session_date: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: 'live' | 'instant' | 'silent';
  description: string;
  auctions_count: number;
  created_at: string;
  updated_at: string;
}

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    session_date: '',
    status: 'scheduled' as 'scheduled' | 'active' | 'completed' | 'cancelled',
    type: 'live' as 'live' | 'instant' | 'silent',
    description: '',
  });

  const [originalData, setOriginalData] = useState<SessionData | null>(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/sessions/${sessionId}`);
      if (response.data.success) {
        const session = response.data.data;
        setOriginalData(session);
        setFormData({
          name: session.name,
          session_date: format(new Date(session.session_date), "yyyy-MM-dd'T'HH:mm"),
          status: session.status,
          type: session.type,
          description: session.description || '',
        });
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب بيانات الجلسة');
      console.error('Error fetching session:', error);
      router.push('/admin/sessions');
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);
    try {
      const response = await api.put(`/api/admin/sessions/${sessionId}`, formData);
      if (response.data.success) {
        toast.success('تم تحديث الجلسة بنجاح');
        router.push('/admin/sessions');
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((errorMsg: any) => {
          toast.error(errorMsg[0]);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('حدث خطأ أثناء تحديث الجلسة');
      }
    } finally {
      setSaving(false);
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
    { value: 'scheduled', label: 'مجدولة', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { value: 'active', label: 'نشطة', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    { value: 'completed', label: 'مكتملة', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
    { value: 'cancelled', label: 'ملغاة', color: 'text-red-400', bgColor: 'bg-red-500/20' }
  ];

  const hasChanges = originalData && (
    formData.name !== originalData.name ||
    formData.session_date !== format(new Date(originalData.session_date), "yyyy-MM-dd'T'HH:mm") ||
    formData.status !== originalData.status ||
    formData.type !== originalData.type ||
    formData.description !== (originalData.description || '')
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">جاري تحميل بيانات الجلسة...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div className="flex items-center space-x-4 space-x-reverse">
          <LoadingLink
            href="/admin/sessions"
            className="bg-card border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-300 p-3 rounded-xl"
          >
            <ArrowRight className="w-5 h-5" />
          </LoadingLink>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              تعديل جلسة المزاد
            </h1>
            <p className="text-foreground/70 mt-2">
              تعديل بيانات جلسة المزاد رقم #{sessionId}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          {hasChanges && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
          )}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Session Info Card */}
        {originalData && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="bg-primary p-3 rounded-xl">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{originalData.name}</h3>
                  <p className="text-foreground/70 text-sm">
                    تم الإنشاء في {format(new Date(originalData.created_at), 'dd MMMM yyyy', )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-foreground/70">عدد المزادات</div>
                <div className="text-2xl font-bold text-primary">{originalData.auctions_count}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Form Header */}
          <div className="border-b border-border p-6 bg-card">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-primary p-2 rounded-xl">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">تعديل بيانات الجلسة</h2>
                <p className="text-foreground/70 text-sm mt-1">
                  قم بتعديل المعلومات المطلوبة ثم حفظ التغييرات
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Session Name */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground/80">
                اسم الجلسة <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-4 px-4 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                  placeholder="أدخل اسم الجلسة (مثال: جلسة المزاد الأسبوعية - ديسمبر 2024)"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <FileText className="w-5 h-5 text-foreground/70" />
                </div>
              </div>
            </div>

            {/* Session Date */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground/80">
                تاريخ ووقت الجلسة <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="session_date"
                  value={formData.session_date}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-4 px-4 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Calendar className="w-5 h-5 text-foreground/70" />
                </div>
              </div>
            </div>

            {/* Session Type */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground/80">
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
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card/30 hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`bg-gradient-to-r ${type.color} p-2 rounded-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{type.label}</div>
                          <div className="text-xs text-foreground/70 mt-1">{type.description}</div>
                        </div>
                        {formData.type === type.value && (
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
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
                <label className="block text-sm font-medium text-foreground/80">
                  حالة الجلسة <span className="text-red-400">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-4 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                  required
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value} className="bg-card">
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground/80">
                  وصف الجلسة (اختياري)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-background/50 border border-border rounded-xl py-4 px-4 text-foreground placeholder-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="أدخل وصفاً مختصراً للجلسة..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-border">
              <LoadingLink
                href="/admin/sessions"
                className="px-6 py-3 bg-border border border-border text-foreground/80 hover:bg-border/80 hover:text-foreground rounded-xl transition-all duration-300 text-center font-medium"
              >
                إلغاء
              </LoadingLink>
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-300 font-medium flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>جاري حفظ التغييرات...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>حفظ التعديلات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">ملاحظات هامة</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/70">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>سيتم رفض التغييرات إذا كانت الجلسة تحتوي على مزادات نشطة</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>تأكد من صحة التاريخ والوقت قبل الحفظ</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>تغيير حالة الجلسة قد يؤثر على المزادات المرتبطة بها</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>يمكنك التراجع عن التغييرات باستخدام زر الإلغاء</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}