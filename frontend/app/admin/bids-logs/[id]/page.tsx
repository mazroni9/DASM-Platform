"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Hash,
  Clock,
  Server,
  User,
  DollarSign,
  Link as LinkIcon,
  Radio,
  AlertCircle,
  Info,
  Smartphone,
  Globe,
  Key,
  Fingerprint,
  SaudiRiyal,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import { ReactNode } from "react";

type Bidder = {
  id: number;
  name: string;
  email: string;
};

type BidEvent = {
  id: number;
  auction_id: number;
  bid_id: number;
  bidder_id: number;
  bid_amount: number;
  currency: string;
  channel: string;
  event_type: string;
  reason_code: string | null;
  server_ts_utc: string;
  client_ts: string;
  server_nano_seq: number;
  ip_addr: string;
  user_agent: string;
  session_id: string;
  hash_prev: string;
  hash_curr: string;
  bidder: Bidder;
};

const DetailItem = ({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
      {icon}
      <span className="mr-2">{label}</span>
    </div>
    <div className="text-gray-800 break-words">{children}</div>
  </div>
);

export default function BidEventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [bidEvent, setBidEvent] = useState<BidEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBidEventDetails = async () => {
      try {
        const response = await api.get(`/api/admin/bids/events/${params.id}`);
        if (response.data && response.data.status === "success") {
          setBidEvent(response.data.data);
        } else {
          toast.error("Failed to fetch bid event details");
        }
      } catch (error) {
        console.error("Error fetching bid event details:", error);
        toast.error("An error occurred while fetching bid event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBidEventDetails();
  }, [params.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZone: "UTC",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!bidEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          لم يتم العثور على تفاصيل الحدث
        </h1>
        <p className="text-gray-600 mb-6">
          تفاصيل الحدث المطلوب غير موجودة أو تم حذفها
        </p>
        <LoadingLink
          href="/admin/bids-logs"
          className="text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 inline ml-1" />
          العودة إلى قائمة سجلات المزايدات
        </LoadingLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          تفاصيل حدث المزايدة
        </h1>
        <LoadingLink
          href="/admin/bids-logs"
          className="text-primary hover:underline flex items-center"
        >
          <ArrowLeft className="w-4 h-4 ml-1" />
          العودة إلى قائمة سجلات المزايدات
        </LoadingLink>
      </div>

      <div className="bg-card rounded-lg shadow-md border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailItem
            icon={<Hash className="w-5 h-5 text-foreground/50" />}
            label="id"
          >
            {bidEvent.id}
          </DetailItem>
          <DetailItem
            icon={<User className="w-5 h-5 text-foreground/50" />}
            label="اسم المستخدم المزايد"
          >
            {bidEvent.bidder.name || "غير متوفر"}
          </DetailItem>
          <DetailItem
            icon={<Hash className="w-5 h-5 text-foreground/50" />}
            label="رقم المزاد"
          >
            {bidEvent.auction_id}
          </DetailItem>
          <DetailItem
            icon={<LinkIcon className="w-5 h-5 text-foreground/50" />}
            label="رقم المزايدة"
          >
            {bidEvent.bid_id}
          </DetailItem>
          <DetailItem
            icon={<SaudiRiyal className="w-5 h-5 text-foreground/50" />}
            label="مبلغ المزايدة"
          >
            {Number(bidEvent.bid_amount).toFixed(2)}
          </DetailItem>
          <DetailItem
            icon={<Smartphone className="w-5 h-5 text-foreground/50" />}
            label="(المصدر) قناة المزايدة"
          >
            {bidEvent.channel}
          </DetailItem>
          <DetailItem
            icon={<Info className="w-5 h-5 text-foreground/50" />}
            label="نوع الحدث"
          >
            {bidEvent.event_type}
          </DetailItem>
          <DetailItem
            icon={<Clock className="w-5 h-5 text-foreground/50" />}
            label="توقيت السيرفر"
          >
            {formatDate(bidEvent.server_ts_utc)}
          </DetailItem>
          <DetailItem
            icon={<Clock className="w-5 h-5 text-foreground/50" />}
            label="توقيت العميل"
          >
            {formatDate(bidEvent.client_ts)}
          </DetailItem>
          <DetailItem
            icon={<Server className="w-5 h-5 text-foreground/50" />}
            label="التسلسل الزمني الدقيق"
          >
            {bidEvent.server_nano_seq}
          </DetailItem>
          <DetailItem
            icon={<Globe className="w-5 h-5 text-foreground/50" />}
            label="عنوان IP"
          >
            {bidEvent.ip_addr}
          </DetailItem>
          <DetailItem
            icon={<User className="w-5 h-5 text-foreground/50" />}
            label="وكيل المستخدم"
          >
            {bidEvent.user_agent}
          </DetailItem>
          <DetailItem
            icon={<Key className="w-5 h-5 text-foreground/50" />}
            label="معرف الجلسة"
          >
            {bidEvent.session_id}
          </DetailItem>
          <DetailItem
            icon={<Fingerprint className="w-5 h-5 text-foreground/50" />}
            label="التجزئة السابقة"
          >
            {bidEvent.hash_prev}
          </DetailItem>
          <DetailItem
            icon={<Fingerprint className="w-5 h-5 text-foreground/50" />}
            label="التجزئة الحالية"
          >
            {bidEvent.hash_curr}
          </DetailItem>
          {bidEvent.reason_code && (
            <DetailItem
              icon={<AlertCircle className="w-5 h-5 text-foreground/50" />}
              label="رمز السبب"
            >
              {bidEvent.reason_code}
            </DetailItem>
          )}
        </div>
      </div>
    </div>
  );
}
