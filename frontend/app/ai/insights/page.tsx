'use client';

import React from 'react';
import LoadingLink from "@/components/LoadingLink";
import { 
  Car, 
  BarChart4, 
  Search, 
  Lightbulb, 
  Zap, 
  TrendingUp, 
  ShieldCheck,
  Image,
  Brain
} from 'lucide-react';

// مكون بطاقة التحليل
function InsightCard({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  link,
  comingSoon = false
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType; 
  color: string;
  link: string;
  comingSoon?: boolean;
}) {
  const CardWrapper = comingSoon 
    ? ({ children }: { children: React.ReactNode }) => (
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden opacity-70 cursor-default">
          {children}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-30 text-white font-bold">
            قريباً
          </div>
        </div>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <LoadingLink href={link} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden block">
          {children}
        </LoadingLink>
      );

  return (
    <div className="relative">
      <CardWrapper>
        <div className={`p-6 border-t-4 ${color}`}>
          <div className="flex items-start">
            <div className={`p-3 rounded-full ${color.replace('border', 'bg').replace('500', '100')} ${color.replace('border', 'text')}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
              <p className="text-gray-600 text-sm">{description}</p>
            </div>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
}

export default function AIInsightsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* العنوان */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full mb-4">
          <Brain className="h-10 w-10 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تحليلات الذكاء الاصطناعي</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          استفد من قوة الذكاء الاصطناعي لفهم أفضل للسيارات، اتجاهات السوق، والحصول على رؤى متقدمة تساعدك في اتخاذ قرارات أفضل
        </p>
      </div>
      
      {/* شريط البحث */}
      <div className="max-w-xl mx-auto mb-12">
        <div className="relative">
          <input 
            type="text" 
            placeholder="ابحث عن سيارة للتحليل..."
            className="w-full px-4 py-3 pl-12 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute right-4 top-3.5 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      {/* بطاقات التحليلات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* تحليل السيارة */}
        <InsightCard 
          title="تحليل حالة السيارة" 
          description="تقييم شامل لحالة السيارة وصحتها العامة باستخدام الذكاء الاصطناعي"
          icon={Car}
          color="border-blue-500"
          link="/ai/insights/car/123" // تم استخدام معرف وهمي، سيتم تغييره لاحقاً بناءً على البحث
        />
        
        {/* تقييم قيمة السيارة */}
        <InsightCard 
          title="تقييم قيمة السيارة" 
          description="تحليل القيمة السوقية للسيارة ومقارنتها بسيارات مماثلة"
          icon={Coins}
          color="border-green-500"
          link="/ai/insights/car/123" // نفس صفحة تحليل السيارة، ستعرض كلا التحليلين
        />
        
        {/* اكتشاف القيمة الخفية */}
        <InsightCard 
          title="كشف القيمة الخفية" 
          description="اكتشاف السيارات ذات القيمة المخفية والفرص الاستثمارية"
          icon={Lightbulb}
          color="border-yellow-500"
          link="/ai/market/hidden-value"
        />
        
        {/* تحسين الصور */}
        <InsightCard 
          title="تحسين صور السيارات" 
          description="استخدام الذكاء الاصطناعي لتحسين صور السيارات وإبراز التفاصيل"
          icon={Image}
          color="border-indigo-500"
          link="/ai/tools/image-enhancer"
        />
        
        {/* تحليل اتجاهات السوق */}
        <InsightCard 
          title="تحليل اتجاهات السوق" 
          description="رؤى حول اتجاهات سوق السيارات وتنبؤات بتغيرات الأسعار"
          icon={TrendingUp}
          color="border-purple-500"
          link="/ai/market/trends"
          comingSoon={true}
        />
        
        {/* كشف التلاعب */}
        <InsightCard 
          title="كشف التلاعب في المزادات" 
          description="حماية عمليات المزايدة وكشف أنماط المزايدة المشبوهة"
          icon={ShieldCheck}
          color="border-red-500"
          link="/ai/tools/auction-security"
          comingSoon={true}
        />
      </div>
      
      {/* قسم المعلومات */}
      <div className="bg-blue-50 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-shrink-0 mb-4 md:mb-0 md:ml-6">
            <div className="p-4 bg-white rounded-full">
              <Zap className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">كيف تعمل تحليلات الذكاء الاصطناعي؟</h2>
            <p className="text-gray-600">
              تستخدم منصة DASM نماذج ذكاء اصطناعي متقدمة لتحليل بيانات السيارات وصورها، مما يوفر رؤى دقيقة حول حالتها وقيمتها السوقية. يتم تدريب هذه النماذج على ملايين السيارات وبيانات المزادات لضمان دقة التقييمات والتنبؤات.
            </p>
          </div>
        </div>
      </div>
      
      {/* تفاصيل أكثر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-green-100 rounded-full ml-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800">تحليل دقيق</h3>
          </div>
          <p className="text-sm text-gray-600">
            تقييمات دقيقة بناءً على بيانات فعلية من سوق السيارات المحلي والعالمي.
          </p>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-blue-100 rounded-full ml-3">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">تحديثات مستمرة</h3>
          </div>
          <p className="text-sm text-gray-600">
            تحديث التحليلات بشكل منتظم مع تغير أسعار السوق واتجاهاته.
          </p>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-purple-100 rounded-full ml-3">
              <Lock className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800">خصوصية تامة</h3>
          </div>
          <p className="text-sm text-gray-600">
            نحمي بياناتك بمعايير أمان عالية ولا نشاركها مع أي طرف ثالث.
          </p>
        </div>
      </div>
    </div>
  );
}

// تعريف المكونات الإضافية
function Coins(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function Clock(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function Lock(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
} 