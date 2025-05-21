'use client';

import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Clock, Trash2, Plus } from 'lucide-react';

// واجهة موعد البث
interface ScheduleItem {
  id: number;
  venueId: string;
  date: string;
  time: string;
  duration: number;
  isAutoSwitch: boolean;
}

interface VenueSchedulerProps {
  className?: string;
}

export default function VenueScheduler({ className }: VenueSchedulerProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // جلب جدول البث عند تحميل المكون
  useEffect(() => {
    fetchSchedules();
  }, []);

  // جلب جدول البث
  const fetchSchedules = async () => {
    setIsLoading(true);
    
    try {
      // في التطبيق الحقيقي، سنجلب البيانات من الخادم
      // للآن، نستخدم بيانات وهمية
      const mockSchedules: ScheduleItem[] = [
        { 
          id: 1, 
          venueId: 'dasm-1', 
          date: '2025-06-10', 
          time: '18:00',
          duration: 120,
          isAutoSwitch: true
        },
        { 
          id: 2, 
          venueId: 'dasm-5', 
          date: '2025-06-11', 
          time: '19:00',
          duration: 90,
          isAutoSwitch: false
        },
        { 
          id: 3, 
          venueId: 'dasm-11', 
          date: '2025-06-12', 
          time: '20:00',
          duration: 120,
          isAutoSwitch: true
        },
      ];
      
      setSchedules(mockSchedules);
    } catch (err) {
      setError('تعذر جلب جدول البث');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة موعد بث جديد
  const addSchedule = () => {
    const newSchedule: ScheduleItem = {
      id: schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) + 1 : 1,
      venueId: '',
      date: '',
      time: '',
      duration: 120,
      isAutoSwitch: true
    };
    
    setSchedules([...schedules, newSchedule]);
  };

  // تحديث موعد بث
  const updateSchedule = (id: number, field: keyof ScheduleItem, value: any) => {
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.id === id) {
        return { ...schedule, [field]: value };
      }
      return schedule;
    });
    
    setSchedules(updatedSchedules);
  };

  // حذف موعد بث
  const deleteSchedule = (id: number) => {
    const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
    setSchedules(updatedSchedules);
    showSuccessMessage('تم حذف الموعد بنجاح');
  };

  // حفظ جدول البث
  const saveSchedules = async () => {
    // التحقق من صحة البيانات
    if (schedules.some(s => !s.venueId || !s.date || !s.time)) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // في التطبيق الحقيقي، سنرسل البيانات إلى الخادم
      console.log('Saving schedules:', schedules);
      
      // محاكاة طلب الحفظ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccessMessage('تم حفظ جدول البث بنجاح');
    } catch (err) {
      setError('تعذر حفظ جدول البث');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // عرض رسالة نجاح مؤقتة
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Calendar className="mr-2 h-5 w-5" />
        جدول البث المباشر
      </h2>
      
      {/* عرض الأخطاء إن وجدت */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4 flex items-start">
          <AlertCircle className="text-red-500 mt-0.5 ml-2 flex-shrink-0 h-5 w-5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {/* عرض رسالة النجاح إن وجدت */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-md mb-4">
          <p className="text-green-600 text-sm">{successMessage}</p>
        </div>
      )}
      
      <div className="mb-4 text-sm text-gray-600">
        <p>جدولة البث المباشر للمعارض يسمح بالتبديل التلقائي بين المعارض في أوقات محددة.</p>
      </div>
      
      {/* قائمة المواعيد */}
      <div className="mb-6">
        {schedules.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            لا توجد مواعيد بث محددة. أضف موعدًا جديدًا.
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-3 border rounded-md">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      المعرض
                    </label>
                    <select
                      value={schedule.venueId}
                      onChange={(e) => updateSchedule(schedule.id, 'venueId', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">اختر معرض...</option>
                      <option value="dasm-1">معرض dasm-1</option>
                      <option value="dasm-2">معرض dasm-2</option>
                      <option value="dasm-5">معرض dasm-5</option>
                      <option value="dasm-11">معرض dasm-11</option>
                      <option value="dasm-20">معرض dasm-20</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      التاريخ
                    </label>
                    <input
                      type="date"
                      value={schedule.date}
                      onChange={(e) => updateSchedule(schedule.id, 'date', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      الوقت
                    </label>
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(e) => updateSchedule(schedule.id, 'time', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      المدة (دقيقة)
                    </label>
                    <input
                      type="number"
                      value={schedule.duration}
                      onChange={(e) => updateSchedule(schedule.id, 'duration', parseInt(e.target.value))}
                      min="30"
                      max="360"
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center pt-6">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={schedule.isAutoSwitch}
                        onChange={(e) => updateSchedule(schedule.id, 'isAutoSwitch', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="mr-2 text-sm text-gray-700">تبديل تلقائي للمعرض التالي</span>
                    </label>
                  </div>
                  
                  <div className="flex justify-end pt-6">
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="flex items-center text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* أزرار التحكم */}
      <div className="flex justify-between">
        <button
          onClick={addSchedule}
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
        >
          <Plus className="h-4 w-4 mr-1" />
          إضافة موعد
        </button>
        
        <button
          onClick={saveSchedules}
          disabled={isLoading || schedules.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جارٍ الحفظ...' : 'حفظ الجدول'}
        </button>
      </div>
    </div>
  );
} 