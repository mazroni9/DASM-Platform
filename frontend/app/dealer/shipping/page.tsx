"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Truck,
  Package,
  MapPin,
  DollarSign,
  Weight,
  Ruler,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Zap,
  Globe,
  Building,
} from "lucide-react";
import { toast } from "react-hot-toast";
import LoadingLink from "@/components/LoadingLink";

// قائمة المدن السعودية
const saudiCities = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الظهران",
  "الأحساء",
  "القطيف",
  "حفر الباطن",
  "الطائف",
  "بريدة",
  "عنيزة",
  "حائل",
  "أبها",
  "خميس مشيط",
  "نجران",
  "جازان",
  "تبوك",
  "الجبيل",
  "ينبع",
];

// قائمة دول الخليج
const gccCountries = [
  "السعودية",
  "الإمارات",
  "البحرين",
  "الكويت",
  "عمان",
  "قطر",
];

// قائمة شركات الشحن
const shippingCompanies = [
  {
    id: "aramex",
    name: "أرامكس",
    hasInternational: true,
    hasHeavy: true,
    minWeight: 0,
    maxWeight: 300,
    deliveryTime: "1-3 أيام",
    reliability: 4.8,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
  },
  {
    id: "smsa",
    name: "SMSA Express",
    hasInternational: true,
    hasHeavy: true,
    minWeight: 0,
    maxWeight: 150,
    deliveryTime: "2-4 أيام",
    reliability: 4.5,
    color: "text-green-400",
    bg: "bg-green-500/20",
    border: "border-green-500/30",
  },
  {
    id: "dhl",
    name: "DHL",
    hasInternational: true,
    hasHeavy: true,
    minWeight: 0,
    maxWeight: 1000,
    deliveryTime: "1-2 أيام",
    reliability: 4.9,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/30",
  },
  {
    id: "albasami",
    name: "البسامي للشحن",
    hasInternational: false,
    hasHeavy: true,
    minWeight: 5,
    maxWeight: 10000,
    deliveryTime: "3-5 أيام",
    reliability: 4.3,
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    border: "border-purple-500/30",
  },
  {
    id: "spl",
    name: "البريد السعودي",
    hasInternational: true,
    hasHeavy: false,
    minWeight: 0,
    maxWeight: 30,
    deliveryTime: "2-4 أيام",
    reliability: 4.2,
    color: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/30",
  },
];

// تصنيفات الشحن
const shippingCategories = [
  {
    id: "small",
    name: "شحنة صغيرة",
    maxWeight: 10,
    icon: Package,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
  },
  {
    id: "medium",
    name: "شحنة متوسطة",
    maxWeight: 50,
    icon: Package,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
  },
  {
    id: "large",
    name: "شحنة كبيرة",
    maxWeight: 200,
    icon: Truck,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
  },
  {
    id: "very_large",
    name: "شحنة ضخمة",
    maxWeight: 10000,
    icon: Truck,
    color: "text-rose-400",
    bg: "bg-rose-500/20",
    border: "border-rose-500/30",
  },
];

// حساب سعر الشحن (محاكاة)
const calculateShippingCost = (
  fromCity: string,
  toCity: string,
  weight: number,
  company: string,
  isInternational: boolean
) => {
  let baseCost = 0;
  const companyData = shippingCompanies.find((c) => c.id === company);

  if (isInternational) {
    baseCost = 150;
  } else if (fromCity === toCity) {
    baseCost = 20;
  } else {
    baseCost = 50;
  }

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

  const weightCost = weight * 2;
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
      height: 15,
    },
  });

  const [shippingCost, setShippingCost] = useState(0);
  const [selectedCompanies, setSelectedCompanies] = useState(shippingCompanies);
  const [isLoading, setIsLoading] = useState(false);
  const router = useLoadingRouter();
  const { isLoggedIn } = useAuth();

  // Verify user is authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dealer/shipping");
    }
  }, [isLoggedIn, router]);

  // تحديث شركات الشحن المتاحة بناءً على الوزن والنوع الدولي
  useEffect(() => {
    const isInternational = shippingData.fromCountry !== shippingData.toCountry;
    const weight = Number(shippingData.weight);

    const filtered = shippingCompanies.filter((company) => {
      const weightInRange =
        weight >= company.minWeight && weight <= company.maxWeight;
      const supportsInternational =
        !isInternational || company.hasInternational;
      const supportsHeavyWeight = weight <= 50 || company.hasHeavy;

      return weightInRange && supportsInternational && supportsHeavyWeight;
    });

    setSelectedCompanies(filtered);

    if (
      filtered.length > 0 &&
      !filtered.find((c) => c.id === shippingData.shippingCompany)
    ) {
      setShippingData((prev) => ({
        ...prev,
        shippingCompany: filtered[0].id,
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setShippingData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof shippingData] as Record<string, any>),
          [child]: value,
        },
      }));
    } else {
      setShippingData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success(`تم تأكيد طلب الشحن بتكلفة ${shippingCost} ريال`);
    setIsLoading(false);
  };

  const getCompanyConfig = (companyId: string) => {
    return (
      shippingCompanies.find((c) => c.id === companyId) || shippingCompanies[0]
    );
  };

  const isInternational = shippingData.fromCountry !== shippingData.toCountry;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">خدمات الشحن</h1>
                <p className="text-gray-400 text-sm mt-1">
                  إدارة وتتبع شحناتك بكل سهولة وأمان
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-500/20 rounded">
                    <Package className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-400">شركات متاحة</span>
                </div>
                <p className="text-lg font-bold text-white mt-1">
                  {selectedCompanies.length}
                </p>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-emerald-500/20 rounded">
                    <Globe className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-xs text-gray-400">نوع الشحن</span>
                </div>
                <p className="text-lg font-bold text-emerald-400 mt-1">
                  {isInternational ? "دولي" : "محلي"}
                </p>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-amber-500/20 rounded">
                    <Weight className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-xs text-gray-400">الوزن</span>
                </div>
                <p className="text-lg font-bold text-amber-400 mt-1">
                  {shippingData.weight} كجم
                </p>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-cyan-500/20 rounded">
                    <DollarSign className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-xs text-gray-400">التكلفة</span>
                </div>
                <p className="text-lg font-bold text-cyan-400 mt-1">
                  {shippingCost} ريال
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <LoadingLink
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-3 bg-gray-500/20 text-gray-300 rounded-xl border border-gray-500/30 hover:bg-gray-500/30 hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">العودة للرئيسية</span>
            </LoadingLink>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Shipping Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2 space-y-6"
        >
          {/* Location Section */}
          <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              مواقع الشحن
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* From Location */}
              <div className="space-y-4">
                <div
                  className={cn(
                    "p-4 rounded-xl border backdrop-blur-sm",
                    "bg-blue-500/10 border-blue-500/20"
                  )}
                >
                  <h3 className="font-bold text-blue-300 mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    موقع الاستلام
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">
                        الدولة
                      </label>
                      <select
                        name="fromCountry"
                        value={shippingData.fromCountry}
                        onChange={handleChange}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                      >
                        {gccCountries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>

                    {shippingData.fromCountry === "السعودية" && (
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">
                          المدينة
                        </label>
                        <select
                          name="fromCity"
                          value={shippingData.fromCity}
                          onChange={handleChange}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                        >
                          {saudiCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* To Location */}
              <div className="space-y-4">
                <div
                  className={cn(
                    "p-4 rounded-xl border backdrop-blur-sm",
                    "bg-emerald-500/10 border-emerald-500/20"
                  )}
                >
                  <h3 className="font-bold text-emerald-300 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    موقع التسليم
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">
                        الدولة
                      </label>
                      <select
                        name="toCountry"
                        value={shippingData.toCountry}
                        onChange={handleChange}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                      >
                        {gccCountries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>

                    {shippingData.toCountry === "السعودية" && (
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">
                          المدينة
                        </label>
                        <select
                          name="toCity"
                          value={shippingData.toCity}
                          onChange={handleChange}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        >
                          {saudiCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              تفاصيل الشحنة
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weight and Category */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    الوزن (كجم)
                  </label>
                  <div className="relative">
                    <input
                      name="weight"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={shippingData.weight}
                      onChange={handleChange}
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                    <Weight className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-3 block">
                    فئة الشحن
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {shippingCategories.map((category) => {
                      const CategoryIcon = category.icon;
                      const isDisabled =
                        Number(shippingData.weight) > category.maxWeight;
                      const isSelected =
                        shippingData.shippingCategory === category.id;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            !isDisabled &&
                            setShippingData((prev) => ({
                              ...prev,
                              shippingCategory: category.id,
                            }))
                          }
                          disabled={isDisabled}
                          className={cn(
                            "p-3 rounded-lg border text-right transition-all duration-300",
                            isSelected
                              ? `${category.bg} ${category.border} text-white shadow-lg`
                              : "bg-gray-800/30 border-gray-700/30 text-gray-400 hover:bg-gray-700/30",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <CategoryIcon
                              className={cn("w-4 h-4", category.color)}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {category.name}
                              </div>
                              <div className="text-xs opacity-80">
                                حتى {category.maxWeight} كجم
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="text-sm text-gray-300 mb-3 block">
                  الأبعاد (سم)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      الطول
                    </label>
                    <div className="relative">
                      <input
                        name="dimensions.length"
                        type="number"
                        min="1"
                        value={shippingData.dimensions.length}
                        onChange={handleChange}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      العرض
                    </label>
                    <div className="relative">
                      <input
                        name="dimensions.width"
                        type="number"
                        min="1"
                        value={shippingData.dimensions.width}
                        onChange={handleChange}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      الارتفاع
                    </label>
                    <div className="relative">
                      <input
                        name="dimensions.height"
                        type="number"
                        min="1"
                        value={shippingData.dimensions.height}
                        onChange={handleChange}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Shipping Companies & Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Shipping Companies */}
          <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              شركات الشحن
            </h2>

            {selectedCompanies.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                <p className="text-gray-300">
                  لا توجد شركات شحن متاحة للوزن والمسافة المحددة
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedCompanies.map((company) => {
                  const isSelected =
                    shippingData.shippingCompany === company.id;
                  const companyConfig = getCompanyConfig(company.id);

                  return (
                    <motion.div
                      key={company.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all duration-300 group",
                        isSelected
                          ? `${companyConfig.bg} ${companyConfig.border} shadow-lg`
                          : "bg-gray-800/30 border-gray-700/30 hover:bg-gray-700/30 hover:border-gray-600/50"
                      )}
                      onClick={() =>
                        setShippingData((prev) => ({
                          ...prev,
                          shippingCompany: company.id,
                        }))
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={cn(
                              "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
                              isSelected ? "bg-white/10" : "bg-gray-700/30"
                            )}
                          >
                            <Truck
                              className={cn("w-4 h-4", companyConfig.color)}
                            />
                          </div>

                          <div className="flex-1">
                            <h3
                              className={cn(
                                "font-bold transition-colors",
                                isSelected
                                  ? "text-white"
                                  : "text-gray-300 group-hover:text-white"
                              )}
                            >
                              {company.name}
                            </h3>

                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {company.deliveryTime}
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />⭐{" "}
                                {company.reliability}
                              </div>
                              {company.hasInternational && (
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  دولي
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shipping Summary */}
          <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              ملخص الشحن
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-700/50">
                <span className="text-gray-300">المسار:</span>
                <span className="text-white font-medium">
                  {shippingData.fromCity} → {shippingData.toCity}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-700/50">
                <span className="text-gray-300">الوزن:</span>
                <span className="text-white font-medium">
                  {shippingData.weight} كجم
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-700/50">
                <span className="text-gray-300">شركة الشحن:</span>
                <span className="text-white font-medium">
                  {getCompanyConfig(shippingData.shippingCompany).name}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-gray-300">التكلفة الإجمالية:</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {shippingCost} ريال
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={selectedCompanies.length === 0 || isLoading}
                className={cn(
                  "w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2",
                  selectedCompanies.length === 0 || isLoading
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white hover:scale-105"
                )}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    تأكيد طلب الشحن
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
