'use client';

import { useState, useRef, FormEvent, ChangeEvent, useEffect } from 'react';
import { Upload, FileX, Car, CheckCircle2, AlertCircle, Link, ArrowLeft } from 'lucide-react';
import api from "@/lib/axios";
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { get } from 'http';
import { BackToDashboard } from '@/components/dashboard/BackToDashboard';

     
interface AuctionData {
  car_id:number;
  starting_bid: number;
  start_time: string;
  end_time: string;
}

export default  function AuctionDataEntryForm() {
  const [formData, setFormData] = useState<AuctionData>({
    car_id:0,
  starting_bid: 0,
  start_time: "",
  end_time:"",
  });
  const params = useParams<{ tag: string; item: string }>()
  let carId= params['id'];

  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

 

  // التعامل مع تغيير قيم حقول النموذج
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // تقديم النموذج
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      
     
      // التحقق من البيانات المدخلة
      const requiredFields = ['starting_bid', 'start_time','end_time'];
      for (const field of requiredFields) {
        if (!formData[field as keyof FormData]) {
          throw new Error(`حقل ${field.replace('_', ' ')} مطلوب`);
        }
      }

     
  
      // إرسال بيانات السيارة مع روابط الصور والتقارير
         try { 
          
          formData['car_id']=carId;
          const response = await api.post('/api/auctions', formData, {
              headers: {
                'Content-Type': 'application/json'
              }
            })

            if (response.data.status === "success") {
                toast.success("تم إضافة السيارة بنجاح");
                
                 // تم الحفظ بنجاح
                setSubmitResult({
                  success: true,
                  message: 'تم إضافة السيارة بنجاح'
                });
            // إعادة تعيين النموذج
            setFormData({
                car_id:0,
  starting_bid: 0,
  start_time: "",
  end_time:"",
            });
            
            } else {
                toast.error("فشل في إضافة السيارة");
            }
        } catch (error) {
            console.error("Error in adding car user:", error);
             toast.error("فشل في إضافة السيارة");
        }
    
    } catch (error: any) {
      console.error('خطأ في حفظ البيانات:', error);
      setSubmitResult({
        success: false,
        message: error.message || 'حدث خطأ أثناء حفظ البيانات'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto mb-10">
      <a  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline" href='/dashboard/mycars'>العودة إلى سيارتي</a>
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">نموذج إدخال بيانات السيارة</h1>
        <p className="text-gray-600 mt-1">يرجى تعبئة جميع البيانات المطلوبة لإضافة سيارتك</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* بيانات السيارة الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">رقم مميز</label>
            <input
              type="text"
              id="id"
              name="id"
              value={carId}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="id"
              required
              disabled
              readOnly />
          </div>
          <div>
            <label htmlFor="starting_bid" className="block text-sm font-medium text-gray-700 mb-1">سعر بدأ المزاد</label>
            <input
              type="number"
              id="starting_bid"
              name="starting_bid"
              value={formData.starting_bid}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required />
          </div>
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">  وقت بدأالمزاد</label>
            <input
              type="date"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required />
          </div>

          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">  وقت نهاية المزاد</label>
            <input
              type="date"
              id="end_time"
              name="end_time"
              value={formData.end_time}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required />
          </div>
        </div>

        {/* رسائل النظام */}
        {submitResult && (
          <div className={`p-4 rounded-md ${submitResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start">
              {submitResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
              )}
              <p className={submitResult.success ? 'text-green-700' : 'text-red-700'}>
                {submitResult.message}
              </p>
            </div>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              setFormData({
                car_id: 0,
                starting_bid: 0,
                start_time: "",
                end_time: "",
              });
            } }
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            مسح النموذج
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات السيارة'}
            <Car className="mr-2 h-5 w-5" />
          </button>
        </div>
      </form>
         
    
    </div>
    </>

  );
} 