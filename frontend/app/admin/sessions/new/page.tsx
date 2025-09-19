'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import LoadingLink from '@/components/LoadingLink';
import { ArrowRight, Save } from 'lucide-react';

export default function NewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    session_date: '',
    status: 'scheduled',
    type: 'live',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        // Handle validation errors
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4 mb-6">
            <LoadingLink
              href="/admin/sessions"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowRight size={24} />
            </LoadingLink>
            <h1 className="text-2xl font-bold text-gray-800">إضافة جلسة جديدة</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                اسم الجلسة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="مثال: جلسة المزاد الأسبوعية"
                required
              />
            </div>

            <div>
              <label htmlFor="session_date" className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ الجلسة <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="session_date"
                name="session_date"
                value={formData.session_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                الحالة <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
              >
                <option value="scheduled">مجدولة</option>
                <option value="active">نشطة</option>
                <option value="completed">مكتملة</option>
                <option value="cancelled">ملغاة</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                نوع الجلسة <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
              >
                <option value="live">الحراج المباشر</option>
                <option value="instant">مزاد فوري</option>
                <option value="silent">مزاد صامت</option>
              </select>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <LoadingLink
                href="/admin/sessions"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                إلغاء
              </LoadingLink>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2  text-white rounded-md bg-blue-600 hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    حفظ الجلسة
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
