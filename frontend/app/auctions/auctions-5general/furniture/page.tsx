"use client";

import React, { useState, useEffect } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
    ChevronRight,
    Sofa,
    Bed,
    Armchair,
    Building,
    Coffee,
    Lamp,
} from "lucide-react";
import Image from "next/image";
import CategoryIcon from "@/components/ui/CategoryIcon";

// Definición de tipos
interface ProductAdditionalInfo {
    roomType?: string;
    materials?: string;
    dimensions?: string;
    productionYear?: string;
}

interface Product {
    id: string | number;
    title: string;
    description: string;
    current_price: string | number;
    condition: string;
    images?: string[];
    additional_info?: string | ProductAdditionalInfo;
}

export default function FurnitureMarketPage() {
    // حالات للتحكم بتحميل البيانات وعرضها
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

    // تحميل المنتجات عند فتح الصفحة
    useEffect(() => {
        const fetchFurnitureProducts = async () => {
            try {
                setIsLoading(true);

                // استدعاء منتجات الأثاث من API
                const response = await fetch(
                    "/api/items?category=furniture&limit=8&sort=newest"
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch furniture products");
                }

                const data = await response.json();
                setFeaturedProducts(data.items || []);
            } catch (err: any) {
                console.error("Error fetching furniture products:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFurnitureProducts();
    }, []);

    // تصنيفات فرعية للأثاث
    const categories = [
        { title: "غرف المعيشة", icon: Sofa, count: 42 },
        { title: "غرف النوم", icon: Bed, count: 35 },
        { title: "غرف الطعام", icon: Armchair, count: 28 },
        { title: "المكاتب", icon: Building, count: 24 },
        { title: "طاولات وكراسي", icon: Coffee, count: 31 },
        { title: "إضاءة وديكور", icon: Lamp, count: 19 },
    ];

    // المميزات الخاصة بسوق الأثاث
    const features = [
        {
            title: "أثاث بحالة ممتازة",
            description: "جميع القطع يتم فحصها والتأكد من جودتها قبل العرض",
        },
        {
            title: "خيارات توصيل متعددة",
            description: "توصيل إلى المنزل أو إمكانية الاستلام الشخصي",
        },
        {
            title: "ضمان الرضا",
            description:
                "إمكانية الإرجاع خلال 7 أيام في حال عدم مطابقة المنتج للوصف",
        },
    ];

    // دالة لاستخراج معلومات إضافية من JSON
    const extractAdditionalInfo = (product: Product): ProductAdditionalInfo => {
        try {
            const additionalInfo = product.additional_info
                ? typeof product.additional_info === "string"
                    ? JSON.parse(product.additional_info)
                    : product.additional_info
                : {};

            return {
                roomType: additionalInfo.roomType || "",
                materials: additionalInfo.materials || "",
                dimensions: additionalInfo.dimensions || "",
                productionYear: additionalInfo.productionYear || "",
            };
        } catch (err) {
            console.error("Error parsing additional info:", err);
            return {};
        }
    };

    // دالة لتنسيق عرض الصورة
    const getItemImage = (product: Product) => {
        if (product.images && product.images.length > 0) {
            return `/uploads/${product.images[0]}`;
        }
        return "/placeholder/furniture.jpg"; // صورة بديلة في حال عدم وجود صورة
    };

    return (
        <div className="container mx-auto p-4 py-8">
            <div className="mb-6 flex justify-between items-center">
                <LoadingLink
                    href="/auctions/auctions-5general"
                    className="inline-flex items-center text-amber-600 hover:text-amber-700 transition-colors px-4 py-2 rounded-full border border-amber-200 hover:border-amber-300 bg-amber-50 hover:bg-amber-100"
                >
                    <ChevronRight className="h-4 w-4 ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
                    <span>العودة</span>
                </LoadingLink>

                <h1 className="text-3xl font-bold text-center text-amber-700">
                    سوق الأثاث المنزلي
                </h1>

                <div className="bg-white border-r-4 border-amber-500 rounded-lg shadow-sm px-3 py-1.5 flex items-center">
                    <div className="text-sm font-medium text-gray-800">
                        أثاث مستعمل بحالة ممتازة
                    </div>
                </div>
            </div>

            {/* البانر الرئيسي */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-xl shadow-lg overflow-hidden mb-10">
                <div className="p-8 text-white">
                    <h2 className="text-3xl font-bold mb-3">
                        أثاث منزلي راقي بأسعار معقولة
                    </h2>
                    <p className="text-xl opacity-90 mb-6">
                        تسوق من تشكيلة واسعة من الأثاث المنزلي المستعمل بحالة
                        ممتازة وبأسعار مناسبة
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
                            >
                                <span className="text-white">
                                    {feature.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* تصنيفات المنتجات */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                {categories.map((category, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg p-5 text-center transition-all hover:-translate-y-1 border border-gray-100"
                    >
                        <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-3">
                            <CategoryIcon category={category.title} size={24} />
                        </div>
                        <h3 className="font-medium text-gray-800">
                            {category.title}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {category.count} قطعة
                        </p>
                    </div>
                ))}
            </div>

            {/* المنتجات المميزة */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold mb-6 border-b pb-2">
                    قطع الأثاث المميزة
                </h2>

                {isLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                        حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
                    </div>
                )}

                {!isLoading && !error && featuredProducts.length === 0 && (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                        <p className="text-gray-500">
                            لا توجد منتجات متاحة حالياً. يرجى التحقق لاحقاً.
                        </p>
                        <LoadingLink
                            href="/forms/furniture-auction-request"
                            className="mt-4 inline-block px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                        >
                            إضافة أول منتج أثاث
                        </LoadingLink>
                    </div>
                )}

                {!isLoading && !error && featuredProducts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.map((product) => {
                            const additionalInfo =
                                extractAdditionalInfo(product);
                            return (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg overflow-hidden transition-transform hover:-translate-y-1 border border-gray-100"
                                >
                                    <div className="h-48 bg-gray-200 relative">
                                        <Image
                                            src={getItemImage(product)}
                                            alt={product.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-lg">
                                                {product.title}
                                            </h3>
                                            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                {additionalInfo.roomType ||
                                                    "أثاث منزلي"}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                            {product.description}
                                        </p>
                                        {additionalInfo.dimensions && (
                                            <p className="text-gray-500 text-xs mb-2">
                                                <span className="font-medium">
                                                    الأبعاد:
                                                </span>{" "}
                                                {additionalInfo.dimensions}
                                            </p>
                                        )}
                                        {additionalInfo.materials && (
                                            <p className="text-gray-500 text-xs mb-2">
                                                <span className="font-medium">
                                                    المواد:
                                                </span>{" "}
                                                {additionalInfo.materials}
                                            </p>
                                        )}
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-xl font-bold text-amber-600">
                                                {product.current_price} ريال
                                            </span>
                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                الحالة:{" "}
                                                {product.condition || "مستعمل"}
                                            </span>
                                        </div>
                                        <LoadingLink
                                            href={`/auctions/auctions-5general/furniture/${product.id}`}
                                            className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors block text-center"
                                        >
                                            عرض التفاصيل
                                        </LoadingLink>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <LoadingLink
                        href="/auctions/auctions-5general/furniture/all"
                        className="px-6 py-2 border border-amber-600 text-amber-600 hover:bg-amber-50 rounded-lg transition inline-block"
                    >
                        عرض المزيد من قطع الأثاث
                    </LoadingLink>
                </div>
            </div>

            {/* مميزات القطع */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-amber-400"
                    >
                        <h3 className="font-bold text-lg mb-2 text-amber-700">
                            {feature.title}
                        </h3>
                        <p className="text-gray-600">{feature.description}</p>
                    </div>
                ))}
            </div>

            {/* بيع الأثاث */}
            <div className="bg-gray-50 rounded-xl shadow-md p-8 border-r-4 border-amber-500 mb-10">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4 text-center">
                        هل لديك أثاث منزلي ترغب في بيعه؟
                    </h2>
                    <p className="text-gray-600 mb-6 text-center">
                        يمكنك الآن بيع قطع الأثاث المنزلي التي لم تعد بحاجة لها
                        بكل سهولة. نوفر لك منصة آمنة ونصل بك إلى آلاف المشترين
                        المهتمين.
                    </p>
                    <div className="flex justify-center">
                        <LoadingLink
                            href="/forms/furniture-auction-request"
                            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition"
                        >
                            بيع الأثاث الآن
                        </LoadingLink>
                    </div>
                </div>
            </div>

            {/* الأسئلة الشائعة */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold mb-6 border-b pb-2">
                    الأسئلة الشائعة
                </h2>
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm p-5">
                        <h3 className="font-bold text-lg mb-2">
                            كيف يتم تحديد أسعار قطع الأثاث؟
                        </h3>
                        <p className="text-gray-600">
                            يتم تحديد الأسعار بناءً على عدة عوامل منها: حالة
                            القطعة، عمرها، الماركة، المواد المستخدمة، والسعر في
                            السوق. نحن نضمن أسعاراً عادلة للبائع والمشتري.
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-5">
                        <h3 className="font-bold text-lg mb-2">
                            هل يمكنني معاينة قطع الأثاث قبل الشراء؟
                        </h3>
                        <p className="text-gray-600">
                            نعم، يمكنك تحديد موعد لمعاينة قطعة الأثاث قبل اتخاذ
                            قرار الشراء. نوفر صوراً تفصيلية وأوصافاً دقيقة، لكن
                            المعاينة الشخصية متاحة في معظم الحالات.
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-5">
                        <h3 className="font-bold text-lg mb-2">
                            ما هي خيارات التوصيل المتاحة؟
                        </h3>
                        <p className="text-gray-600">
                            نوفر خدمة توصيل إلى المنزل بتكلفة إضافية تعتمد على
                            المسافة وحجم القطعة. كما يمكن الاتفاق على الاستلام
                            الشخصي مع البائع، أو استخدام شركات شحن خارجية.
                        </p>
                    </div>
                </div>
            </div>

            {/* نصائح للمشترين */}
            <div className="mt-10 bg-amber-50 p-6 rounded-xl border border-amber-200">
                <h2 className="text-xl font-bold mb-4 text-amber-800">
                    نصائح عند شراء الأثاث المستعمل
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>تأكد من فحص جميع زوايا وأجزاء قطعة الأثاث بعناية</li>
                    <li>اسأل عن عمر القطعة وكيفية استخدامها السابق</li>
                    <li>تحقق من متانة الإطار والأرجل في قطع الجلوس</li>
                    <li>اسأل عن نوع الخشب أو المواد المستخدمة في التصنيع</li>
                    <li>
                        خذ القياسات بدقة وتأكد من مناسبة القطعة للمساحة المتوفرة
                        لديك
                    </li>
                </ul>
            </div>
        </div>
    );
}
