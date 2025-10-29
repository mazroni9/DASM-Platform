/**
 * 📝 صفحة تفاصيل السيارة بمعرف محدد
 * 📁 المسار: Frontend-local/app/carDetails/[id]/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض تفاصيل السيارة عند توفر معرف صحيح
 * - توجيه المستخدم لإضافة سيارة جديدة في حالة عدم وجود بيانات
 *
 * 🔄 الارتباط:
 * - يستخدم مكون: @/components/CarDataEntryButton
 *
 * 🎨 ملاحظات التصميم:
 * - توحيد الثيم على داكن slate مع تدرّج بنفسجي (violet → fuchsia)
 * - استبدال الأخضر/الأزرق في الأزرار والتنبيهات بالتدرّج البنفسجي
 * - دون أي تغيير على الباك إند أو المنطق
 */

"use client";

// ✅ صفحة عرض المزاد الصامت مع رابط للتفاصيل السيارة
// المسار: /pages/silent/page.tsx

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import { ChevronRight, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import api from "@/lib/axios";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import toast from "react-hot-toast";
import Pusher from "pusher-js";
import BidForm from "@/components/BidForm";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import List from "@mui/material/List";
import { motion } from "framer-motion";

function getCurrentAuctionType(): string {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 16 && hour < 19) {
    return "live"; // الحراج المباشر
  } else if (hour >= 19 && hour < 22) {
    return "immediate"; // السوق الفوري
  } else {
    return "late"; // السوق المتأخر
  }
}

interface BidingData {
  auction_id: number;
  user_id: number;
  bid_amount: number;
}

// ========== قسم السيارات المميزة ==========
const FeaturedCars = ({ cars }) => {
  return (
    <section className="bg-slate-950 text-slate-100 mt-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-right text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4"
          >
            سيارات مشابهة
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 py-10">
          {cars &&
            cars.map((car, index) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <img
                    src={car.images[0]}
                    alt={car.make + " " + car.model + " " + car.year}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 line-clamp-2">
                    {car.make + " " + car.model + " " + car.year}
                  </h3>
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <span className="text-fuchsia-300 font-bold text-base sm:text-lg">
                      {car.active_auction.current_bid} ر.س
                    </span>
                    <span className="text-slate-400 text-xs sm:text-sm">
                      {car.total_bids} مزايدة
                    </span>
                  </div>
                  <LoadingLink href={`/carDetails/${car.id}`} className="w-full">
                    <button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-300 text-sm sm:text-base">
                      شارك في المزاد
                    </button>
                  </LoadingLink>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default function CarDetailPage() {
  console.log("Pusher Key:", process.env.NEXT_PUBLIC_PUSHER_APP_KEY);

  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastbid, setLastBid] = useState(0);
  const [formData, setFormData] = useState<BidingData>({
    auction_id: 0,
    user_id: 0,
    bid_amount: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useLoadingRouter();
  const params = useParams<{ id: string }>();
  let carId = params["id"];
  const [isOwner, setIsOwner] = useState(false);
  const [showBid, setShowBid] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      if (!formData.auction_id || formData.auction_id === 0) {
        throw new Error("هذه السيارة غير متاحة للمزايدة حالياً");
      }

      const requiredFields = ["bid_amount"];
      for (const field of requiredFields) {
        if (!formData[field as keyof BidingData]) {
          throw new Error(`حقل ${field.replace("_", " ")} مطلوب`);
        }
      }

      formData.bid_amount = roundToNearest5or0(formData.bid_amount);

      const response = await api.post("/api/auctions/bid", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        setSubmitResult({
          success: true,
          message: "تم تقديم العرض بنجاح",
        });
        setFormData({
          auction_id: formData.auction_id,
          user_id: formData.user_id,
          bid_amount: 0,
        });
      } else {
        toast.error("فشل في تقديم العرض");
      }
    } catch (error: any) {
      console.log(error);
      console.error("خطأ في حفظ البيانات:", error?.response?.data?.message);
      setSubmitResult({
        success: false,
        message: error?.response?.data?.message || "حدث خطأ أثناء حفظ البيانات",
      });
      toast.error(error?.response?.data?.message || "فشل في تقديم العرض");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const roundToNearest5or0 = (number: number): number => {
    return Math.round(number / 5) * 5;
  };

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      // router.push("/auth/login?returnUrl=/dashboard/profile");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (authLoading) return;

    setLoading(true);
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
    });

    async function fetchAuctions() {
      try {
        const response = await api.get(`/api/car/${carId}`);
        if (response.data.data) {
          const carsData = response.data.data.data || response.data.data;
          setLastBid(
            roundToNearest5or0(carsData.active_auction?.current_bid || 0) + 100
          );
          setItem(carsData);

          if (carsData.active_auction && carsData.active_auction.id) {
            setFormData((prev) => ({
              ...prev,
              auction_id: carsData.active_auction.id,
              user_id: user?.id || 0,
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              user_id: user?.id || 0,
            }));
          }

          let car_user_id = carsData.car.user_id;
          let current_user_id = user?.id;
          let dealer_user_id = carsData.car.dealer;

          if (dealer_user_id != null) {
            dealer_user_id = carsData.car.dealer.user_id;
          }

          if (current_user_id == car_user_id) {
            setIsOwner(true);
          } else if (dealer_user_id == current_user_id) {
            setIsOwner(true);
          } else {
            setIsOwner(false);
          }

          const auctionId = carsData.id;
          var channel = pusher.subscribe(`auction.${auctionId}`);

          channel.bind("NewBidEvent", (event) => {
            setItem((prevItem) => ({
              ...prevItem,
              active_auction: event.data.active_auction,
              total_bids: event.data.total_bids,
            }));
            setLastBid(
              roundToNearest5or0(event.data.active_auction.current_bid) + 100
            );
          });
        }
      } catch (error) {
        console.error("فشل تحميل بيانات المزاد الصامت", error);
        setItem(null);
        setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
      } finally {
        setLoading(false);
      }
    }
    fetchAuctions();
  }, [authLoading, isLoggedIn, carId, user]);

  const images =
    item ? (item["car"]?.images?.length > 0 ? item["car"]?.images : []) : [];
  const currentImage = images[selectedImageIndex];

  const goToNextImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };
  const goToPreviousImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  return (
    <>
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4">
        {showImageModal && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative w-full max-w-4xl mx-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageModal(false);
                }}
                className="absolute top-0 right-0 m-4 text-white text-2xl z-10 hover:text-slate-300"
              >
                ✖
              </button>
              <img
                src={currentImage}
                alt={item?.title ?? ""}
                className="max-w-full max-h-[80vh] mx-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
                }}
              />
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(idx);
                    }}
                    className={`w-3 h-3 rounded-full ${
                      idx === selectedImageIndex ? "bg-white" : "bg-slate-400"
                    }`}
                    aria-label={`عرض الصورة ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {/* زر العودة + تأكيد البيع */}
          <div className="flex justify-between items-center mb-6">
            <LoadingLink
              href="/auctions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-slate-800 bg-slate-900/70 text-slate-100 hover:bg-slate-900/90 transition-colors"
            >
              <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
              <span>العودة إلى الأسواق</span>
            </LoadingLink>

            {isOwner && (
              <button
                onClick={() => router.push(`/sales/confirm/${carId}`)}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-2 px-6 rounded-lg shadow"
              >
                تأكيد البيع
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-md overflow-hidden p-6">
            {/* رسائل النظام */}
            {submitResult && (
              <div
                className={`p-4 rounded-md mb-3 ${
                  submitResult.success
                    ? "bg-fuchsia-500/10 border border-fuchsia-400/30"
                    : "bg-rose-500/10 border border-rose-400/30"
                }`}
              >
                <div className="flex items-start">
                  {submitResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-fuchsia-400 ml-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-rose-400 ml-2" />
                  )}
                  <p className={submitResult.success ? "text-fuchsia-200" : "text-rose-200"}>
                    {submitResult.message}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* الصور */}
              <div className="rounded-lg flex-direction-column items-center">
                <div className="order-2 lg:order-1">
                  {/* الصورة الرئيسية */}
                  <div
                    className="bg-slate-900 rounded-lg overflow-hidden relative cursor-pointer border border-slate-800"
                    onClick={() => setShowImageModal(true)}
                  >
                    <img
                      src={currentImage}
                      alt={item?.title}
                      className="w-full h-96 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
                      }}
                    />

                    {/* أزرار التنقل بين الصور */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToPreviousImage();
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/70"
                          aria-label="الصورة السابقة"
                        >
                          &lt;
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToNextImage();
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/70"
                          aria-label="الصورة التالية"
                        >
                          &gt;
                        </button>
                      </>
                    )}
                  </div>

                  {/* شريط الصور المصغرة */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`cursor-pointer border-2 rounded-md overflow-hidden ${
                          idx === selectedImageIndex
                            ? "border-fuchsia-500 ring-2 ring-fuchsia-300/40"
                            : "border-slate-700 hover:border-slate-500"
                        }`}
                        onClick={() => setSelectedImageIndex(idx)}
                      >
                        <img
                          src={img}
                          alt={`صورة ${idx + 1}`}
                          className="w-full h-16 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* معلومات السعر للشاشات الصغيرة */}
                  <div className="mt-6 block lg:hidden">
                    <div className="mb-6 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                      <div className="text-2xl font-bold text-fuchsia-300">
                        السعر الحالي:{" "}
                        <PriceWithIcon
                          price={item?.active_auction?.current_bid?.toLocaleString() || 0}
                        />
                      </div>
                      {item?.auction_result && (
                        <p className="text-lg text-fuchsia-300/90 mt-2">
                          {item.auction_result}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* زر قدم عرضك أو نموذج المزايدة */}
                {!isOwner && item?.active_auction && (
                  !showBid ? (
                    <button
                      hidden={isOwner}
                      onClick={() => setShowBid(!isOwner)}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-2 rounded-lg hover:from-violet-700 hover:to-fuchsia-700 font-bold text-xl border border-fuchsia-700/40 shadow-lg transform hover:scale-105 mt-2"
                    >
                      <span className="flex items-center justify-center">
                        <Plus className="h-5 w-5 mr-1.5" />
                        قدم عرضك
                      </span>
                    </button>
                  ) : (
                    <div className="max-w-md mx-auto mt-2 bg-slate-900/60 p-6 rounded-3xl shadow-lg border border-slate-800" dir="rtl">
                      <BidForm
                        auction_id={parseInt(item.active_auction.id)}
                        bid_amount={parseInt(
                          (item.active_auction.current_bid == 0
                            ? item.active_auction.opening_price || 0
                            : item.active_auction.current_bid || 0
                          )
                            .toString()
                            .replace(/,/g, "")
                        )}
                        onSuccess={() => {
                          toast.success("تم تقديم العرض بنجاح");
                        }}
                      />
                    </div>
                  )
                )}

                {/* آخر المزايدين */}
                {item?.active_auction && (
                  <div className="mt-3 border-t border-slate-800 pt-3">
                    <h4 className="text-lg font-bold text-slate-200 mb-2">آخر المزايدين</h4>

                    {/* ✅ ضبط ألوان MUI لمنع الخلفية البيضاء + ستايل داكن متناسق */}
                    <List
                      dir="rtl"
                      sx={{
                        width: "100%",
                        maxWidth: 460,
                        bgcolor: "transparent", // كان background.paper (أبيض)
                        color: "inherit",
                        position: "relative",
                        overflow: "auto",
                        maxHeight: 400,
                        px: 0,
                        // Scrollbar داكن
                        "::-webkit-scrollbar": { width: "8px" },
                        "::-webkit-scrollbar-thumb": {
                          background:
                            "linear-gradient(180deg, rgba(139,92,246,0.45), rgba(244,114,182,0.35))",
                          borderRadius: "8px",
                          border: "2px solid rgba(2,6,23,0.7)",
                        },
                        "::-webkit-scrollbar-track": { background: "transparent" },
                        // عناصر القائمة
                        "& .MuiListItem-root": { padding: 0, marginBottom: 8 },
                        "& .MuiListItemButton-root": {
                          gap: 12,
                          alignItems: "center",
                          borderRadius: 12,
                          padding: "10px 12px",
                          backgroundColor: "rgba(2,6,23,0.6)", // slate-950/60
                          border: "1px solid rgba(51,65,85,0.6)", // slate-700/60
                          transition: "all .2s ease",
                          "&:hover": {
                            backgroundColor: "rgba(15,23,42,0.8)", // slate-900/80
                            borderColor: "rgba(79,70,229,0.5)", // violet-600/50
                            boxShadow: "0 8px 24px -12px rgba(139,92,246,0.35)",
                            transform: "translateY(-1px)",
                          },
                        },
                        "& .MuiListItemText-root .MuiTypography-root": {
                          color: "inherit",
                        },
                      }}
                    >
                      {item.active_auction.bids.map((bid) => {
                        return (
                          <ListItem key={bid.id} component="div" disablePadding>
                            <ListItemButton>
                              <ListItemText
                                dir="rtl"
                                sx={{ textAlign: "right", m: 0 }}
                                primary={`#${bid.user_id}`}
                              />
                              <ListItemText
                                dir="rtl"
                                sx={{ textAlign: "right", m: 0 }}
                                primary={
                                  new Date(bid.created_at).toLocaleString("ar-SA")
                                }
                              />
                              <div className="ml-auto text-fuchsia-300 font-semibold">
                                <PriceWithIcon className="text-right font-bold" price={bid.bid_amount} />
                              </div>
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </div>
                )}

                {!isOwner && !item?.active_auction && (
                  <div className="max-w-md mx-auto bg-slate-900/60 p-6 rounded-3xl shadow-lg border border-slate-800" dir="rtl">
                    <h2 className="text-xl font-bold text-center mb-2 text-slate-200">
                      غير متاح للمزايدة
                    </h2>
                    <p className="text-center text-slate-400">
                      هذه السيارة غير مدرجة في مزاد حالياً. يرجى المراجعة لاحقاً
                      أو تصفح السيارات المتاحة للمزاد.
                    </p>
                  </div>
                )}
              </div>

              {/* بيانات السيارة */}
              <div>
                {item?.active_auction ? (
                  <div className="mb-6 bg-fuchsia-500/10 p-4 rounded-lg border border-fuchsia-400/30">
                    <p className="text-slate-300">آخر سعر:</p>
                    <div className="text-2xl font-bold text-fuchsia-300">
                      <PriceWithIcon
                        price={item?.active_auction?.current_bid?.toLocaleString() || "-"}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 bg-amber-500/10 p-4 rounded-lg border border-amber-400/30">
                    <p className="text-xl font-bold text-amber-200">
                      هذه السيارة غير متاحة للمزايدة حالياً
                    </p>
                    <p className="text-sm text-amber-300 mt-1">
                      السيارة متاحة للعرض فقط أو في انتظار الموافقة للمزاد
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">الماركة</p>
                      <p className="font-semibold">{item?.car?.make}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">الموديل</p>
                      <p className="font-semibold">{item?.car?.model}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">سنة الصنع</p>
                      <p className="font-semibold">{item?.car?.year}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">رقم اللوحة</p>
                      <p className="font-semibold">{item?.car?.plate}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">رقم العداد</p>
                      <p className="font-semibold">
                        {item?.car?.odometer?.toLocaleString() || "-"} كم
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">نوع الوقود</p>
                      <p className="font-semibold">{item?.car?.engine || "-"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">حالة السيارة</p>
                      <p className="font-semibold">{item?.car?.condition || "-"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">لون السيارة</p>
                      <p className="font-semibold">{item?.car?.color || "-"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">صورة كرت التسجيل</p>
                      <p className="font-semibold">
                        {item?.car?.registration_card_image ? (
                          <a
                            href={item?.car?.registration_card_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={item?.car?.registration_card_image}
                              alt="صورة كرت التسجيل"
                              className="w-20 h-auto rounded border border-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ) : (
                          "-"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">تقارير الفحص</p>
                      <p className="font-semibold">
                        {item?.car?.report_images.map((file: any) => (
                          <div key={file.id}>
                            <a
                              href={file.image_path}
                              className="text-fuchsia-300 hover:text-fuchsia-200 underline-offset-4 hover:underline"
                            >
                              {file.image_path.split("/").pop()}
                            </a>
                          </div>
                        )) || "-"}
                      </p>
                    </div>
                  </div>

                  {item?.active_auction ? (
                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-slate-400 text-sm mb-2">معلومات المزاد</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-400 text-sm">سعر الإفتتاح</p>
                          <p className="font-semibold">
                            <PriceWithIcon
                              price={
                                item?.active_auction?.minimum_bid?.toLocaleString() ||
                                "-"
                              }
                            />
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">أقل سعر</p>
                          <p className="font-semibold">
                            <PriceWithIcon
                              price={
                                item?.active_auction?.minimum_bid?.toLocaleString() ||
                                "-"
                              }
                            />
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">أعلى سعر</p>
                          <p className="font-semibold">
                            <PriceWithIcon
                              price={
                                item?.active_auction?.maximum_bid?.toLocaleString() ||
                                "-"
                              }
                            />
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">المزايدات المقدمة</p>
                          <p className="font-semibold">{item?.total_bids || "0"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">مبلغ المزايدة</p>
                          <p className="font-semibold text-fuchsia-300">
                            {(() => {
                              const bids = item?.active_auction?.bids || [];
                              const lastBid = bids.length > 0 ? bids[bids.length - 1] : null;
                              return lastBid ? lastBid.increment : 0;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-slate-400 text-sm mb-2">حالة السيارة</p>
                      <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <p className="text-sm text-slate-400">
                          هذه السيارة غير مدرجة في مزاد حالياً. قد تكون متاحة
                          للعرض أو في انتظار الموافقة للمزاد.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <FeaturedCars cars={item?.similar_cars} />
        </div>
      </div>
    </>
  );
}
