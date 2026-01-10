"use client";

import LoadingLink from "@/components/LoadingLink";
import { ArrowLeft } from "lucide-react";
interface PageHeaderProps {
  title: string;
  description?: string;
  backUrl: string;
  backLabel?: string;
  gradient?: boolean;
  color?: string;
}

export default function PageHeader({
  title,
  description,
  backUrl,
  backLabel = "العودة",
  gradient = true,
  color = "blue",
}: PageHeaderProps) {
  // تحديد ألوان الخلفية المناسبة حسب اللون
  const getGradient = () => {
    if (!gradient) return `bg-${color}-500/80`;

    switch (color) {
      case "green":
        return "bg-gradient-to-r from-green-500/80 to-green-400/80";
      case "indigo":
        return "bg-gradient-to-r from-indigo-500/80 to-blue-400/80";
      case "purple":
        return "bg-gradient-to-r from-purple-500/80 to-purple-400/80";
      case "yellow":
        return "bg-gradient-to-r from-yellow-500/80 to-yellow-400/80";
      default:
        return "bg-gradient-to-r from-blue-500/80 to-blue-400/80";
    }
  };

  return (
    <div className={`py-4 h-48 ${getGradient()}`}>
      <div className="container mx-auto px-4 h-full flex flex-col justify-center">
        <div className="flex justify-between mb-2">
          {/* زر العودة في الجهة اليمنى */}
          <LoadingLink
            href={backUrl}
            className="flex items-center text-white/90 hover:text-white transition rtl:flex-row-reverse"
          >
            <ArrowLeft size={16} className="ml-1 rtl:mr-1 rtl:ml-0" />
            <span>{backLabel}</span>
          </LoadingLink>

          {/* العنوان في المنتصف */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {title}
            </h1>
            <p className=" text-white/90">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
