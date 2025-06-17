'use client';

import { useState, useRef, FormEvent, ChangeEvent, useEffect } from 'react';
import { Upload, FileX, Car, CheckCircle2, AlertCircle } from 'lucide-react';
import api from "@/lib/axios";
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { get } from 'http';

     
interface AuctionData {
  car_id:number;
  min_price:number,
  max_price:number,
  min_bid:number,
  max_bid:number,
  starting_bid: number;
  reserve_price: number;
  start_time: string;
  end_time: string;
  open_price:number;
  make: string;
  model: string;
  year: string;
  vin: string;
  engine: string;
  odometer: string;
  color: string;
  transmission: string;
  condition: string;
  location: string;
  description:string;
}

export default  function AuctionDataEntryForm() {
  const [formData, setFormData] = useState<AuctionData>({
    car_id:0,
  starting_bid: 0,
  reserve_price: 0,
  min_price:0,
  max_price:0,
  min_bid:0,
  max_bid:0,
  open_price:0,
  start_time: "",
  end_time:"",
  make: '',
  model:'',
  year:'',
  vin:'',
  engine: '',
  odometer:  '',
  color:  '',
  transmission:  '',
  condition:  '',
  location:  '',
  description: '',
  });
  const [carDetails, setCarDetails] = useState([]);
  const params = useParams<{ tag: string; item: string }>()
  let carId= params['id'];

  
 const fetchFavourits = async () => {
    const response = await api.get(`/api/cars/${carId}`);
    return response;
}


useEffect(() => {
        const fetchData = async () => {
            let resp=await fetchFavourits();
            if (resp.status == 200) {
                      toast.success("تم تحميل البيانات");
                      setCarDetails(resp.data.data.car);
                     
            }else{
                      toast.error("حدث خطأ")
            }
        };
        fetchData();
    }, []);

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
      
      /*
      // التحقق من البيانات المدخلة
      const requiredFields = ['starting_bid', 'min_price', 'max_price','min_bid','max_bid','open_price','start_time','end_time'];
      for (const field of requiredFields) {
        if (!formData[field as keyof FormData]) {
          throw new Error(`حقل ${field.replace('_', ' ')} مطلوب`);
        }
      }

      */
  
      // إرسال بيانات السيارة مع روابط الصور والتقارير
         try { 
          for (const [key, value] of Object.entries(formData)) {
            if(carDetails[key] != undefined) {
              formData[key] = carDetails[key];
            }
          }
          
          formData['car_id']=carDetails['id'];
          formData['dealer_id']=carDetails['dealer_id'];
          formData['user_id']=carDetails['user_id'];
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
                reserve_price: 0,
                min_price:0,
                max_price:0,
                min_bid:0,
                max_bid:0,
                open_price:0,
                start_time: "",
                end_time:"",
                make: '',
                model:'',
                year:'',
                vin:'',
                engine: '',
                odometer:  '',
                color:  '',
                transmission:  '',
                condition:  '',
                location:  '',
                description: '',
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
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto mb-10">
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
              value={carDetails['id']}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="id"
              required
              disabled
              readOnly
            />
          </div>
<div>
            <label htmlFor="الماركة" className="block text-sm font-medium text-gray-700 mb-1">الماركة *</label>
            <select
              id="make"
              name="make"
              value={carDetails['make']}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled
            >
              <option value={carDetails['make']}>{carDetails['make']}</option>
            </select>
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">الموديل *</label>
            <input
              type="text"
              id="model"
              name="model"
              value={carDetails['model']}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled
            />
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">سنة الصنع *</label>
            <select
              id="year"
              name="year"
              value={carDetails['year']}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled>
              <option value={carDetails['year']}>{carDetails['year']}</option>
            </select>
          </div>

          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">رقم التسجيل*</label>
            <input
              type="text"
              id="vin"
              name="vin"
              value={carDetails['vin']}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="رقم الهيكل"
              required
              disabled
            />
          </div>
     
          <div>
            <label htmlFor="engine" className="block text-sm font-medium text-gray-700 mb-1">نوع الوقود</label>
            <select
              id="engine"
              name="engine"
              value={carDetails['engine']}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled>
              <option value={carDetails['engine']}>{carDetails['engine']}</option>
            </select>
          </div>

          <div>
            <label htmlFor="odometer" className="block text-sm font-medium text-gray-700 mb-1">رقم العداد (كم)</label>
            <input
              type="number"
              id="odometer"
              name="odometer"
              value={carDetails['odometer']}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              disabled
            />
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">لون السيارة</label>
            <input
              type="text"
              id="color"
              name="color"
              value={carDetails['color']}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled
            />
          </div>

          <div>
            <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 mb-1">نوع ناقل الحركة</label>
            <select
              id="transmission"
              name="transmission"
              value={carDetails['transmission']}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled
            >
              <option value={carDetails['transmission']}>{carDetails['transmission']}</option>
            </select>
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">حالة السيارة</label>
            <select
              id="condition"
              name="condition"
              value={carDetails['condition']}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value={carDetails['condiotion']}>{carDetails['condition']}</option>
            </select>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
            <input
              type="text"
              id="location"
              name="location"
              value={carDetails['location']}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="المدينة / المنطقة"
            />
          </div>

          <div>
            <label htmlFor="min_price" className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى المقبول (ريال)</label>
            <input
              type="number"
              id="min_price"
              name="min_price"
              value={formData.min_price}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              placeholder="أقل سعر تقبل به للسيارة"
            />
          </div>

          <div>
            <label htmlFor="max_price" className="block text-sm font-medium text-gray-700 mb-1">الحد الأعلى المرغوب (ريال)</label>
            <input
              type="number"
              id="max_price"
              name="max_price"
              value={formData.max_price}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              placeholder="السعر المستهدف للبيع"
            />
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
              required
            />
          </div>
         <div>
            <label htmlFor="min_price" className="block text-sm font-medium text-gray-700 mb-1">أقل سعر للمزاد</label>
            <input
              type="number"
              id="min_price"
              name="min_price"
              value={formData.min_price}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
         <div>
            <label htmlFor="max_price" className="block text-sm font-medium text-gray-700 mb-1">أعلى سعر للمزاد</label>
            <input
              type="number"
              id="max_price"
              name="max_price"
              value={formData.max_price}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="min_bid" className="block text-sm font-medium text-gray-700 mb-1"> أقل مزايدة مقبولة </label>
            <input
              type="number"
              id="min_bid"
              name="min_bid"
              value={formData.min_bid}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="max_bid" className="block text-sm font-medium text-gray-700 mb-1"> أعلى مزايدة مقبولة </label>
            <input
              type="number"
              id="max_bid"
              name="max_bid"
              value={formData.max_bid}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
                              <div>
            <label htmlFor="open_price" className="block text-sm font-medium text-gray-700 mb-1"> إفتتاح المزاد</label>
            <input
              type="number"
              id="open_price"
              name="open_price"
              value={formData.open_price}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
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
              required
            />
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
              required
            />
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
                  reserve_price: 0,
                  min_price:0,
                  max_price:0,
                  min_bid:0,
                  max_bid:0,
                  open_price:0,
                  start_time: "",
                  end_time:"",
                  make: '',
                  model:'',
                  year:'',
                  vin:'',
                  engine: '',
                  odometer:  '',
                  color:  '',
                  transmission:  '',
                  condition:  '',
                  location:  '',
                  description: '',
              });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            مسح النموذج
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات السيارة'}
            <Car className="mr-2 h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 