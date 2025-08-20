'use client'

import { FaStar, FaRegStar, FaUserCircle, FaMedal } from "react-icons/fa"
import { useState } from "react"

function StarRating({ value, size = 5, animated = false }) {
  return (
    <div className="flex">
      {[...Array(size)].map((_, i) =>
        i < Math.round(value) ? (
          <FaStar
            key={i}
            className={`text-yellow-400 text-lg ${animated ? 'animate-bounce' : ''}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ) : (
          <FaRegStar key={i} className="text-gray-300 text-lg" />
        )
      )}
    </div>
  )
}

// شارة التقييم حسب القيمة
function RatingBadge({ value }) {
  let label = "ممتاز"
  let color = "bg-green-500"
  if (value < 4.5 && value >= 4) {
    label = "جيد جداً"
    color = "bg-blue-500"
  } else if (value < 4 && value >= 3) {
    label = "جيد"
    color = "bg-yellow-500"
  } else if (value < 3) {
    label = "متوسط"
    color = "bg-gray-400"
  }
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white shadow ${color}`}>
      <FaMedal className="text-white" /> {label}
    </span>
  )
}

// صورة رمزية ديناميكية (أول حرف من الاسم)
function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-200 to-blue-400 flex items-center justify-center text-white text-lg font-bold shadow">
      {name[0]}
    </div>
  )
}

export function ExhibitorRatings({
  platformRating = 4.7,
  customerRating = 4.3,
  reviews = [
    { name: "أحمد", comment: "خدمة ممتازة وسرعة في التعامل.", rating: 5 },
    { name: "سارة", comment: "تجربة رائعة، أنصح بالتعامل.", rating: 5 },
    { name: "خالد", comment: "الشحن تأخر قليلاً لكن الخدمة ممتازة.", rating: 4 },
    { name: "منى", comment: "دعم فني سريع واحترافي.", rating: 5 },
    { name: "عبدالله", comment: "تجربة متوسطة، تحتاج بعض التحسينات.", rating: 3 },
  ]
}) {
  const [showAll, setShowAll] = useState(false)
  const visibleReviews = showAll ? reviews : reviews.slice(0, 3)

  // حساب المتوسط العام
  const overall = ((platformRating + customerRating) / 2).toFixed(1)

  return (
    <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 overflow-hidden">
      {/* شريط تقييم عام متحرك */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 animate-pulse rounded-t-2xl"></div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
          <FaStar className="text-yellow-400" /> تقييم المعرض
        </h2>
        <span className="text-lg font-bold text-yellow-500 flex items-center gap-1">
          {overall}
          <StarRating value={overall} size={5} animated />
        </span>
        <RatingBadge value={overall} />
      </div>
      <div className="flex flex-col md:flex-row md:gap-12 gap-6 mb-8">
        {/* تقييم المنصة */}
        <div className="flex-1 flex flex-col items-center bg-gradient-to-tr from-yellow-50 to-white rounded-xl p-6 shadow-md border border-yellow-100">
          <span className="text-gray-500 text-sm mb-1">تقييم المنصة</span>
          <StarRating value={platformRating} />
          <span className="mt-2 text-yellow-500 font-bold text-lg">{platformRating}</span>
        </div>
        {/* تقييم العملاء */}
        <div className="flex-1 flex flex-col items-center bg-gradient-to-tr from-blue-50 to-white rounded-xl p-6 shadow-md border border-blue-100">
          <span className="text-gray-500 text-sm mb-1">تقييم العملاء</span>
          <StarRating value={customerRating} />
          <span className="mt-2 text-blue-500 font-bold text-lg">{customerRating}</span>
        </div>
      </div>
      {/* آراء العملاء */}
      <div>
        <h3 className="text-md font-semibold text-gray-700 mb-3">آراء العملاء</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {visibleReviews.map((review, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 bg-white/90 hover:bg-blue-50/80 transition-all duration-200 rounded-xl p-5 shadow-md hover:shadow-xl border border-gray-100 group"
            >
              <Avatar name={review.name} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-700">{review.name}</span>
                  <StarRating value={review.rating} size={5} />
                </div>
                <p className="text-gray-600 text-sm group-hover:text-blue-700 transition-colors duration-200">{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
        {/* زر عرض المزيد */}
        {reviews.length > 3 && !showAll && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setShowAll(true)}
              className="bg-gradient-to-l from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white font-bold py-2 px-8 rounded-xl shadow-lg transition-all duration-200 active:scale-95 text-lg"
            >
              عرض جميع التقييمات
            </button>
          </div>
        )}
      </div>
      {/* زخرفة سفلية */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-green-200 to-yellow-400 rounded-b-2xl opacity-60"></div>
    </div>
  )
}