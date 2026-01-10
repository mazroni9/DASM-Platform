"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  Loader2,
  Eye,
  Edit,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import Switch from "@mui/material/Switch";
import EditUserForm from "@/components/admin/EditUserForm";
import Pagination from "@components/Pagination";
import PaginationItem from "@mui/material/PaginationItem";

import { log } from "console";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import dayjs from "dayjs";
// Toggle Switch Component using Material UI
const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <Switch
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      disabled={disabled}
      color="primary"
      size="small"
      sx={{
        "& .MuiSwitch-switchBase.Mui-checked": {
          color: "#2563eb", // blue-600
        },
        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
          backgroundColor: "#2563eb", // blue-600
        },
      }}
    />
  );
};

// Types
//event_type: enumUtil ]'bid_placed', 'bid_rejected', 'outbid', 'autobid_fired', 'bid_withdrawn';
interface BidsLogsData {
  id: number;
  auction_id: number;
  bidder_id: number;
  channel: number;
  bid_amount: number;
  event_type: string;
  server_ts_utc: Date;
  client_ts: Date;
  bidder: {
    first_name: string;
    last_name: string;
  };
  dealer: {
    company_name: string;
  };
}

export default function BidsLogsPage() {
  const [bidsLogs, setBidsLogs] = useState<BidsLogsData[]>([]);
  const [filteredBidsLogs, setFilteredBidsLogs] = useState<BidsLogsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, active, rejected
  const [roleFilter, setRoleFilter] = useState("all"); // all, user, dealer
  const [processingBidsLogsId, setProcessingBidsLogsId] = useState<
    number | null
  >(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // or allow user to change it
  const handleUserUpdated = (updatedUser: any) => {
    setProcessingBidsLogsId(null);
    setShowEditForm(false);
    //setUser(updatedUser);
  };

  useEffect(() => {
    if (initialLoad) {
      fetchBidsLogs();
      setInitialLoad(false);
    }
  }, [currentPage]);

  // useEffect(() => {
  //     if (!initialLoad) {
  //         filterBidsLogs();
  //     }
  // }, [users, searchTerm, statusFilter, roleFilter, initialLoad]);

  const fetchBidsLogs = async () => {
    try {
      const response = await api.get(
        `/api/admin/bids/events?page=${currentPage}`
      );

      if (response.data && response.data.status === "success") {
        // Check if data is paginated
        if (response.data.data && response.data.data.data) {
          // Handle paginated data
          setBidsLogs(response.data.data.data);
          setFilteredBidsLogs(response.data.data.data);
          setTotalCount(response.data.data.last_page);
        } else {
          // Handle non-paginated data
          setBidsLogs(response.data.data);
          setFilteredBidsLogs(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("فشل في تحميل بيانات المستخدمين");

      setBidsLogs([]);
      setFilteredBidsLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">سجلات المزايدات</h1>
        <Button
          onClick={fetchBidsLogs}
          className="bg-primary hover:bg-primary/90"
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Filters and search */}
      <div className="bg-card p-4 rounded-lg shadow border flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50"
            size={18}
          />
          <Input
            type="text"
            placeholder="بحث بالاسم، البريد الإلكتروني، أو اسم الشركة"
            className="pr-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-card rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-border/50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider"
                >
                  المستخدم(المزايد)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider"
                >
                  مصدر المزايدة
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider"
                >
                  رقم المزاد
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider"
                >
                  مبلغ المزايدة
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider"
                >
                  الحالة
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider"
                >
                  توقيت السيرفر
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider"
                >
                  توقيت الزبون
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider"
                >
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredBidsLogs.length > 0 ? (
                filteredBidsLogs.map((bidLog) => (
                  <tr key={bidLog.id} className="hover:bg-background">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-lg">
                            {bidLog.bidder.first_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-foreground">
                            {bidLog.bidder.first_name} {bidLog.bidder.last_name}
                          </div>
                          {bidLog.dealer && (
                            <div className="text-xs text-foreground/70">
                              {bidLog.dealer.company_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {bidLog.channel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {bidLog.auction_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground/80">
                        <PriceWithIcon
                          price={Number(bidLog.bid_amount).toFixed(2)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {bidLog.event_type === "bid_placed" ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/10 text-green-800">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          تمت المزايدة
                        </span>
                      ) : bidLog.event_type === "bid_rejected" ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/10 text-red-800">
                          <XCircle className="w-3 h-3 ml-1" />
                          مرفوض
                        </span>
                      ) : bidLog.event_type === "outbid" ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-500/10 text-amber-800">
                          تم التجاوز
                        </span>
                      ) : bidLog.event_type === "autobid_fired" ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/10 text-blue-800">
                          مزايدة تلقائية
                        </span>
                      ) : bidLog.event_type === "bid_withdrawn" ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-border text-foreground/80">
                          معلقة
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-border text-foreground/80">
                          معلقة
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {dayjs(bidLog.server_ts_utc).format("DD/MM/YYYY")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {dayjs(bidLog.server_ts_utc).format("HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {dayjs(bidLog.client_ts).format("DD/MM/YYYY")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {dayjs(bidLog.client_ts).format("HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        <LoadingLink href={`/admin/bids-logs/${bidLog.id}`}>
                          <Eye className="w-4 h-4 ml-1" />
                          عرض
                        </LoadingLink>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-foreground/50"
                  >
                    لا توجد نتائج مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalPages={totalCount}
          page={currentPage}
          onPageChange={(event, page) => {
            setInitialLoad(true);
            setCurrentPage(page);
          }}
        />
      </div>
    </div>
  );
}
