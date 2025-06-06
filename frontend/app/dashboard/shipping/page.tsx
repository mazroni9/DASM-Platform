'use client';

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck, Package, MapPin, DollarSign, Weight } from "lucide-react";

// قائمة المدن السعودية
const saudiCities = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "الظهران",
  "الأحساء", "القطيف", "حفر الباطن", "الطائف", "بريدة", "عنيزة", "حائل", "أبها",
  "خميس مشيط", "نجران", "جازان", "تبوك", "الجبيل", "ينبع"
];

// قائمة دول الخليج
const gccCountries = [
  "السعودية", "الإمارات", "البحرين", "الكويت", "عمان", "قطر"
];

// قائمة شركات الشحن
const shippingCompanies = [
  { id: "aramex", name: "أرامكس", hasInternational: true, hasHeavy: true, minWeight: 0, maxWeight: 300 },
  { id: "smsa", name: "SMSA Express", hasInternational: true, hasHeavy: true, minWeight: 0, maxWeight: 150 },
  { id: "dhl", name: "DHL", hasInternational: true, hasHeavy: true, minWeight: 0, maxWeight: 1000 },
  { id: "fedex", name: "FedEx", hasInternational: true, hasHeavy: true, minWeight: 0, maxWeight: 500 },
  { id: "albasami", name: "البسامي للشحن", hasInternational: false, hasHeavy: true, minWeight: 5, maxWeight: 10000 },
  { id: "uber_freight", name: "أوبر فرايت", hasInternational: false, hasHeavy: true, minWeight: 10, maxWeight: 5000 },
  { id: "zajil", name: "زاجل", hasInternational: true, hasHeavy: false, minWeight: 0, maxWeight: 50 },
  { id: "spl", name: "البريد السعودي", hasInternational: true, hasHeavy: false, minWeight: 0, maxWeight: 30 },
  { id: "saee", name: "ساعي", hasInternational: false, hasHeavy: false, minWeight: 0, maxWeight: 50 },
  { id: "fetchr", name: "فيتشر", hasInternational: false, hasHeavy: false, minWeight: 0, maxWeight: 30 },
];

// تصنيفات الشحن
const shippingCategories = [
  { id: "small", name: "شحنة صغيرة (محمولة باليد)", maxWeight: 10 },
  { id: "medium", name: "شحنة متوسطة", maxWeight: 50 },
  { id: "large", name: "شحنة كبيرة", maxWeight: 200 },
  { id: "very_large", name: "شحنة ضخمة (تحتاج ناقلات كبيرة)", maxWeight: 10000 }
];

// حساب سعر الشحن (محاكاة)
const calculateShippingCost = (
  fromCity: string,
  toCity: string,
  weight: number,
  company: string,
  isInternational: boolean
) => {
  // هذه مجرد أمثلة لحسابات تقريبية وليست دقيقة
  let baseCost = 0;
  const companyData = shippingCompanies.find(c => c.id === company);
  
  // تحديد السعر الأساسي بناءً على المسافة ونوع الشحن
  if (isInternational) {
    baseCost = 150; // سعر أساسي للشحن الدولي
  } else if (fromCity === toCity) {
    baseCost = 20; // داخل المدينة نفسها
  } else {
    baseCost = 50; // بين المدن
  }

  // تعديل السعر بناءً على الشركة
  let multiplier = 1.0;
  switch (company) {
    case "aramex":
      multiplier = 1.2;
      break;
    case "dhl":
      multiplier = 1.5;
      break;
    case "smsa":
      multiplier = 1.1;
      break;
    case "albasami":
      multiplier = 0.9;
      break;
    case "spl":
      multiplier = 0.8;
      break;
    default:
      multiplier = 1.0;
  }

  // تعديل السعر بناءً على الوزن
  const weightCost = weight * 2; // 2 ريال لكل كيلوغرام
  
  // حساب التكلفة الإجمالية
  const totalCost = (baseCost + weightCost) * multiplier;
  
  return Math.round(totalCost);
};

export default function ShippingPage() {
  const [shippingData, setShippingData] = useState({
    fromCountry: "السعودية",
    toCountry: "السعودية",
    fromCity: "الرياض",
    toCity: "جدة",
    weight: 5,
    shippingCompany: "aramex",
    shippingCategory: "small",
    dimensions: {
      length: 30,
      width: 20,
      height: 15
    }
  });

  const [shippingCost, setShippingCost] = useState(0);
  const [selectedCompanies, setSelectedCompanies] = useState(shippingCompanies);

  // تحديث شركات الشحن المتاحة بناءً على الوزن والنوع الدولي
  useEffect(() => {
    const isInternational = shippingData.fromCountry !== shippingData.toCountry;
    const weight = Number(shippingData.weight);
    
    const filtered = shippingCompanies.filter(company => {
      const weightInRange = weight >= company.minWeight && weight <= company.maxWeight;
      const supportsInternational = !isInternational || company.hasInternational;
      const supportsHeavyWeight = weight <= 50 || company.hasHeavy;
      
      return weightInRange && supportsInternational && supportsHeavyWeight;
    });
    
    setSelectedCompanies(filtered);
    
    // إذا كانت الشركة المحددة حاليًا غير متاحة، اختر الشركة الأولى المتاحة
    if (filtered.length > 0 && !filtered.find(c => c.id === shippingData.shippingCompany)) {
      setShippingData(prev => ({
        ...prev,
        shippingCompany: filtered[0].id
      }));
    }
  }, [shippingData.weight, shippingData.fromCountry, shippingData.toCountry]);

  // حساب سعر الشحن عند تغيير أي من البيانات
  useEffect(() => {
    const isInternational = shippingData.fromCountry !== shippingData.toCountry;
    const cost = calculateShippingCost(
      shippingData.fromCity,
      shippingData.toCity,
      Number(shippingData.weight),
      shippingData.shippingCompany,
      isInternational
    );
    
    setShippingCost(cost);
  }, [shippingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setShippingData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof shippingData] as Record<string, any>,
          [child]: value
        }
      }));
    } else {
      setShippingData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`تم تأكيد طلب الشحن بتكلفة ${shippingCost} ريال`);
  };

  // تحديد الفئة المناسبة بناءً على الوزن
  const getRecommendedCategory = (weight: number) => {
    for (const category of shippingCategories) {
      if (weight <= category.maxWeight) {
        return category.id;
      }
    }
    return shippingCategories[shippingCategories.length - 1].id;
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen" dir="rtl">
      
      {/* زر العودة للوحة التحكم */}
      <BackToDashboard />

      <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">خدمات الشحن</h1>
      <p className="text-center text-gray-500 mb-8">اختر طريقة شحن المنتجات المباعة عبر المنصة</p>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* موقع الشحن */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <MapPin className="inline-block ml-2 w-5 h-5 text-blue-500" />
                  موقع الاستلام
                </h3>
                
                <div>
                  <Label htmlFor="fromCountry">الدولة</Label>
                  <select
                    id="fromCountry"
                    name="fromCountry"
                    value={shippingData.fromCountry}
                    onChange={handleChange}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {gccCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                
                {shippingData.fromCountry === "السعودية" && (
                  <div>
                    <Label htmlFor="fromCity">المدينة</Label>
                    <select
                      id="fromCity"
                      name="fromCity"
                      value={shippingData.fromCity}
                      onChange={handleChange}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {saudiCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <MapPin className="inline-block ml-2 w-5 h-5 text-red-500" />
                  موقع التسليم
                </h3>
                
                <div>
                  <Label htmlFor="toCountry">الدولة</Label>
                  <select
                    id="toCountry"
                    name="toCountry"
                    value={shippingData.toCountry}
                    onChange={handleChange}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {gccCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                
                {shippingData.toCountry === "السعودية" && (
                  <div>
                    <Label htmlFor="toCity">المدينة</Label>
                    <select
                      id="toCity"
                      name="toCity"
                      value={shippingData.toCity}
                      onChange={handleChange}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {saudiCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            {/* معلومات الشحنة */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Package className="inline-block ml-2 w-5 h-5 text-blue-500" />
                معلومات الشحنة
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="weight">الوزن (كجم)</Label>
                    <div className="relative mt-1">
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={shippingData.weight}
                        onChange={handleChange}
                        className="pl-8"
                      />
                      <Weight className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="shippingCategory">فئة الشحن</Label>
                    <select
                      id="shippingCategory"
                      name="shippingCategory"
                      value={shippingData.shippingCategory}
                      onChange={handleChange}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {shippingCategories.map(category => (
                        <option 
                          key={category.id} 
                          value={category.id}
                          disabled={Number(shippingData.weight) > category.maxWeight}
                        >
                          {category.name} (حتى {category.maxWeight} كجم)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dimensions">الأبعاد (سم)</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Input
                        id="length"
                        name="dimensions.length"
                        placeholder="الطول"
                        type="number"
                        min="1"
                        value={shippingData.dimensions.length}
                        onChange={handleChange}
                      />
                      <Input
                        id="width"
                        name="dimensions.width"
                        placeholder="العرض"
                        type="number"
                        min="1"
                        value={shippingData.dimensions.width}
                        onChange={handleChange}
                      />
                      <Input
                        id="height"
                        name="dimensions.height"
                        placeholder="الارتفاع"
                        type="number"
                        min="1"
                        value={shippingData.dimensions.height}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* شركات الشحن */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Truck className="inline-block ml-2 w-5 h-5 text-blue-500" />
                اختر شركة الشحن
              </h3>
              
              {selectedCompanies.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-700">
                  لا توجد شركات شحن متاحة للوزن والمسافة المحددة. يرجى تعديل معلومات الشحنة.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCompanies.map(company => (
                    <div 
                      key={company.id}
                      className={`
                        border rounded-md p-4 cursor-pointer transition-all
                        ${shippingData.shippingCompany === company.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}
                      `}
                      onClick={() => setShippingData(prev => ({...prev, shippingCompany: company.id}))}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-white p-2 rounded-md border">
                          <Truck className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="mr-3">
                          <h4 className="font-medium">{company.name}</h4>
                          <p className="text-sm text-gray-500">
                            {company.hasInternational ? 'شحن دولي متاح' : 'شحن محلي فقط'} &bull; 
                            {company.hasHeavy ? ' يدعم الأوزان الثقيلة' : ' للشحنات الخفيفة'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* تفاصيل التكلفة والتأكيد */}
            <div className="border-t pt-6 mt-6">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-md border">
                <div>
                  <h3 className="text-lg font-medium flex items-center">
                    <DollarSign className="inline-block ml-2 w-5 h-5 text-green-500" />
                    تكلفة الشحن
                  </h3>
                  <p className="text-sm text-gray-500">
                    السعر التقريبي لشحن {shippingData.weight} كجم من {shippingData.fromCity} إلى {shippingData.toCity}
                  </p>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {shippingCost} ريال
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button 
                  type="submit" 
                  disabled={selectedCompanies.length === 0}
                  className="px-8"
                >
                  تأكيد طلب الشحن
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
} 