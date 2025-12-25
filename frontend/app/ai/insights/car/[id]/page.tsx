'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Coins, 
  Info, 
  ArrowRight,
  ChevronLeft,
  BarChart4,
  Lightbulb,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import HealthIndexDisplay from '@/components/ai/HealthIndexDisplay';
import LoadingLink from "@/components/LoadingLink";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { CarValueAssessment, carAnalysisService, CarHealthReport } from '@/lib/ai/services/carAnalysisService';
import { imageService } from '@/lib/ai/services/imageService';

// منحنى العرض: مكون داخلي لعرض مؤشر تقييم السيارة
function ValueAssessmentDisplay({ assessment }: { assessment: CarValueAssessment }) {
  // تحديد لون مؤشر القيمة
  const getValueColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-teal-500';
    if (score >= 60) return 'text-blue-500';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-green-50 border-b border-green-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Coins className="h-6 w-6 text-green-500 ml-2" />
            <h3 className="text-lg font-semibold text-gray-800">تقييم قيمة السيارة</h3>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 ml-1">دقة التقييم</span>
            <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
              {Math.round(assessment.confidenceScore * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* القيمة السوقية المقدرة */}
        <div className="mb-6">
          <div className="text-sm text-gray-500 mb-1">القيمة السوقية المقدرة</div>
          <div className="flex items-end">
            <span className="text-3xl font-bold text-green-600">
              {assessment.estimatedMarketValue.toLocaleString()}
            </span>
            <span className="mr-1 text-lg text-gray-500 mb-0.5">ريال</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            نطاق السعر: {assessment.priceRange.min.toLocaleString()} - {assessment.priceRange.max.toLocaleString()} ريال
          </div>
        </div>

        {/* اتجاه السوق */}
        <div className="flex items-center mb-4">
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">اتجاه السوق</div>
            <div className="flex items-center">
              {assessment.marketTrend === 'rising' && (
                <span className="text-green-600 text-sm font-medium flex items-center">
                  <ArrowRight className="h-4 w-4 mr-1 transform rotate-45" />
                  في ارتفاع
                </span>
              )}
              {assessment.marketTrend === 'stable' && (
                <span className="text-blue-600 text-sm font-medium flex items-center">
                  <ArrowRight className="h-4 w-4 mr-1 transform rotate-90" />
                  مستقر
                </span>
              )}
              {assessment.marketTrend === 'falling' && (
                <span className="text-red-600 text-sm font-medium flex items-center">
                  <ArrowRight className="h-4 w-4 mr-1 transform rotate-135" />
                  في انخفاض
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">مؤشر القيمة</div>
            <div className={`text-xl font-bold ${getValueColor(assessment.valueScore)}`}>
              {assessment.valueScore}/100
            </div>
          </div>
        </div>

        {/* عوامل المقارنة */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            عوامل المقارنة
          </h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-gray-500">الماركة</div>
              <div className="font-medium">{assessment.comparisonFactors.make}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">الموديل</div>
              <div className="font-medium">{assessment.comparisonFactors.model}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">سنة الصنع</div>
              <div className="font-medium">{assessment.comparisonFactors.year}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">الحالة</div>
              <div className="font-medium">{assessment.comparisonFactors.condition}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">العداد</div>
              <div className="font-medium">{assessment.comparisonFactors.mileage.toLocaleString()} كم</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">المنطقة</div>
              <div className="font-medium">{assessment.comparisonFactors.region}</div>
            </div>
          </div>
        </div>

        {/* سيارات مشابهة */}
        {assessment.similarCars.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              سيارات مشابهة تم بيعها مؤخراً
            </h4>
            <div className="space-y-2">
              {assessment.similarCars.map((car) => (
                <div key={car.id} className="flex justify-between items-center p-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <Car className="h-4 w-4 text-gray-400 ml-2" />
                    <div>
                      <div className="text-sm">سيارة مشابهة #{car.id}</div>
                      <div className="text-xs text-gray-500">
                        {car.condition} • {car.mileage.toLocaleString()} كم
                        {car.soldDate && ` • ${new Date(car.soldDate).toLocaleDateString('ar-SA')}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{car.price.toLocaleString()} ريال</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// مكون كشف القيمة الخفية
function HiddenValueDisplay({ valueRatio, reasons }: { valueRatio: number, reasons: string[] }) {
  const isGoodValue = valueRatio > 1.05;
  
  return (
    <div className={`rounded-lg p-4 ${isGoodValue ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
      <h3 className="font-semibold text-gray-800 flex items-center mb-2">
        <Lightbulb className={`h-5 w-5 ml-2 ${isGoodValue ? 'text-green-500' : 'text-gray-500'}`} />
        {isGoodValue ? 'قيمة خفية مكتشفة!' : 'تقييم القيمة الخفية'}
      </h3>
      
      {isGoodValue ? (
        <>
          <p className="text-sm text-gray-700 mb-2">
            هذه السيارة تقدم قيمة أفضل من سعرها الحالي بنسبة <span className="font-bold text-green-600">{Math.round((valueRatio - 1) * 100)}%</span>
          </p>
          
          {reasons.length > 0 && (
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-700 mb-1">الأسباب:</div>
              <ul className="space-y-1">
                {reasons.map((reason, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <Check className="h-4 w-4 text-green-500 ml-1 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-600">
          {reasons[0] || 'قيمة هذه السيارة مناسبة لسعرها الحالي في السوق.'}
        </p>
      )}
    </div>
  );
}

// مكون صور السيارة المحسنة
function EnhancedImagesDisplay({ originalUrl, enhancedUrl }: { originalUrl: string, enhancedUrl: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-center">
          <ImageIcon className="h-6 w-6 text-indigo-500 ml-2" />
          <h3 className="text-lg font-semibold text-gray-800">صور محسنة بالذكاء الاصطناعي</h3>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">الصورة الأصلية</div>
            <div className="aspect-[4/3] overflow-hidden rounded border border-gray-200">
              <img 
                src={originalUrl} 
                alt="الصورة الأصلية" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">الصورة المحسنة</div>
            <div className="aspect-[4/3] overflow-hidden rounded border border-gray-200">
              <img 
                src={enhancedUrl} 
                alt="الصورة المحسنة" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          تم تحسين الصورة باستخدام الذكاء الاصطناعي لإبراز تفاصيل السيارة بشكل أفضل
        </div>
      </div>
    </div>
  );
}

// الصفحة الرئيسية لتحليل السيارة
export default function CarInsightsPage({ params }: { params: { id: string } }) {
  const router = useLoadingRouter();
  
  const carId = parseInt(params.id);
  
  const [carDetails, setCarDetails] = useState<any>(null);
  const [healthReport, setHealthReport] = useState<CarHealthReport | null>(null);
  const [valueAssessment, setValueAssessment] = useState<CarValueAssessment | null>(null);
  const [hiddenValue, setHiddenValue] = useState<{valueRatio: number, reasons: string[]} | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<{originalUrl: string, enhancedUrl: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // تحميل بيانات السيارة والتحليلات
  useEffect(() => {
    async function loadCarInsights() {
      try {
        setIsLoading(true);
        setError(null);

        // 1. تحميل تفاصيل السيارة
        // في بيئة التطوير، استخدام بيانات وهمية
        const mockCarDetails = {
          id: carId,
          title: 'تويوتا كامري 2020',
          make: 'تويوتا',
          model: 'كامري',
          year: 2020,
          mileage: 50000,
          color: 'أبيض',
          condition: 'جيدة',
          min_price: 75000,
          max_price: 95000,
          current_price: 82000,
          images: [
            'https://example.com/images/toyota-camry-2020-1.jpg',
            'https://example.com/images/toyota-camry-2020-2.jpg'
          ],
          description: 'سيارة تويوتا كامري موديل 2020 بحالة ممتازة، جميع الصيانات بالوكالة، مكيف ثلاج، مكينة وقير على الشرط.',
          seller: {
            id: 123,
            name: 'معرض السيارات المميزة',
            phone: '966500000000'
          }
        };
        
        setCarDetails(mockCarDetails);

        // 2. تحميل تقرير الصحة
        const health = await carAnalysisService.analyzeCarHealth(carId);
        setHealthReport(health);

        // 3. تحميل تقييم القيمة
        const value = await carAnalysisService.assessCarValue(carId);
        setValueAssessment(value);

        // 4. كشف القيمة الخفية
        const hidden = await carAnalysisService.detectHiddenValue(carId);
        setHiddenValue(hidden);

        // 5. تحسين الصورة (إذا كانت متاحة)
        if (mockCarDetails.images && mockCarDetails.images.length > 0) {
          const enhanced = await imageService.enhanceImage(mockCarDetails.images[0]);
          setEnhancedImage({
            originalUrl: mockCarDetails.images[0],
            enhancedUrl: enhanced.enhancedUrl
          });
        }
      } catch (err) {
        console.error('Error loading car insights:', err);
        setError('حدث خطأ أثناء تحميل تحليلات السيارة');
      } finally {
        setIsLoading(false);
      }
    }

    if (carId) {
      loadCarInsights();
    }
  }, [carId]);

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // عرض حالة الخطأ
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-600 font-semibold text-lg mb-2">خطأ</h2>
          <p className="text-red-700">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            onClick={() => router.back()}
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  // عدم توفر البيانات
  if (!carDetails || !healthReport || !valueAssessment) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-yellow-600 font-semibold text-lg mb-2">بيانات غير متوفرة</h2>
          <p className="text-yellow-700">لا يمكن العثور على تحليلات لهذه السيارة</p>
          <button 
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            onClick={() => router.back()}
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* شريط التنقل */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <LoadingLink href="/ai/insights" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ChevronLeft className="h-4 w-4 ml-1" />
            <span>العودة إلى التحليلات</span>
          </LoadingLink>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{carDetails.title}</h1>
        <p className="text-gray-600">{carDetails.year} • {carDetails.make} • {carDetails.model} • {carDetails.mileage.toLocaleString()} كم</p>
      </div>

      {/* نتائج كشف القيمة الخفية */}
      {hiddenValue && (
        <div className="mb-6">
          <HiddenValueDisplay valueRatio={hiddenValue.valueRatio} reasons={hiddenValue.reasons} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* مؤشر صحة السيارة */}
        <div>
          <HealthIndexDisplay carId={carId} initialReport={healthReport} />
        </div>
        
        {/* تقييم القيمة */}
        <div>
          <ValueAssessmentDisplay assessment={valueAssessment} />
        </div>
      </div>

      {/* صور محسنة */}
      {enhancedImage && (
        <div className="mb-6">
          <EnhancedImagesDisplay 
            originalUrl={enhancedImage.originalUrl} 
            enhancedUrl={enhancedImage.enhancedUrl} 
          />
        </div>
      )}

      {/* تفاصيل السيارة كاملة */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center">
            <Info className="h-6 w-6 text-gray-500 ml-2" />
            <h3 className="text-lg font-semibold text-gray-800">تفاصيل السيارة</h3>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500">الماركة</div>
              <div className="font-medium">{carDetails.make}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">الموديل</div>
              <div className="font-medium">{carDetails.model}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">سنة الصنع</div>
              <div className="font-medium">{carDetails.year}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">اللون</div>
              <div className="font-medium">{carDetails.color}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">العداد</div>
              <div className="font-medium">{carDetails.mileage.toLocaleString()} كم</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">الحالة</div>
              <div className="font-medium">{carDetails.condition}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">السعر الحالي</div>
              <div className="font-medium">{carDetails.current_price.toLocaleString()} ريال</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">البائع</div>
              <div className="font-medium">{carDetails.seller.name}</div>
            </div>
          </div>
          
          {carDetails.description && (
            <div className="mt-4 border-t pt-4">
              <div className="text-sm text-gray-500 mb-1">الوصف</div>
              <p className="text-gray-700">{carDetails.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* تصنيف الذكاء الاصطناعي */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-gray-600 text-sm">
          تم تحليل هذه السيارة باستخدام الذكاء الاصطناعي المتقدم من منصة DASM
        </div>
        <div className="text-gray-500 text-xs mt-1">
          التحليلات تقريبية وتستند إلى البيانات المتاحة. يُنصح بمعاينة السيارة شخصياً قبل الشراء.
        </div>
      </div>
    </div>
  );
} 