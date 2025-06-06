"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Car, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface CarVerificationTableProps {
  isAdmin?: boolean;
  status?: "pending" | "under_review" | "approved" | "rejected";
  userId?: number;
}

export function CarVerificationTable({ isAdmin = false, status = "pending", userId }: CarVerificationTableProps) {
  const router = useRouter();
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would be replaced with an actual API call
        // const response = await carService.getVerificationRequests({ status, userId });
        // setCars(response.data);
        
        // For now, using mock data
        setTimeout(() => {
          setCars(getMockCars(status));
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Failed to fetch car verification requests:", error);
        toast.error("فشل في تحميل طلبات التحقق من السيارات");
        setLoading(false);
      }
    };

    fetchCars();
  }, [status, userId]);

  const handleApproveVerification = async (id: number) => {
    try {
      // In a real implementation, this would be an API call
      // await carService.approveVerification(id);
      
      toast.success("تمت الموافقة على طلب التحقق بنجاح");
      setCars(cars.map(car => car.id === id ? { ...car, status: "approved" } : car));
    } catch (error) {
      console.error("Failed to approve verification:", error);
      toast.error("فشل في الموافقة على طلب التحقق");
    }
  };

  const handleRejectVerification = async (id: number) => {
    try {
      // In a real implementation, this would be an API call
      // await carService.rejectVerification(id);
      
      toast.error("تم رفض طلب التحقق");
      setCars(cars.map(car => car.id === id ? { ...car, status: "rejected" } : car));
    } catch (error) {
      console.error("Failed to reject verification:", error);
      toast.error("فشل في رفض طلب التحقق");
    }
  };

  const handleViewCarDetails = (id: number) => {
    router.push(`/admin/cars/${id}`);
  };

  const getDocumentStatusBadge = (documents: any[]) => {
    if (documents.every(doc => doc.verified)) {
      return <Badge className="bg-green-500">جميع الوثائق مكتملة</Badge>;
    } else if (documents.some(doc => doc.verified)) {
      return <Badge variant="outline" className="border-amber-500 text-amber-500">بعض الوثائق مكتملة</Badge>;
    } else {
      return <Badge variant="outline" className="border-red-500 text-red-500">لا توجد وثائق مكتملة</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PP", { locale: ar });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">لا توجد طلبات في هذه الحالة</p>
        {isAdmin && (
          <Button variant="outline" onClick={() => router.push("/admin/cars")}>
            عرض جميع السيارات
          </Button>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>رقم</TableHead>
          <TableHead>السيارة</TableHead>
          <TableHead>المالك</TableHead>
          <TableHead>تاريخ التقديم</TableHead>
          <TableHead>حالة الوثائق</TableHead>
          <TableHead>الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cars.map((car) => (
          <TableRow key={car.id}>
            <TableCell className="font-medium">#{car.id}</TableCell>
            <TableCell>
              <div className="flex items-center">
                <Car className="h-4 w-4 text-gray-500 ml-2" />
                <span>{car.make} {car.model} {car.year}</span>
              </div>
            </TableCell>
            <TableCell>{car.owner}</TableCell>
            <TableCell>{formatDate(car.submittedAt)}</TableCell>
            <TableCell>
              <div className="flex space-x-1 space-x-reverse">
                {getDocumentStatusBadge(car.documents)}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2 space-x-reverse">
                <Button variant="outline" size="sm" onClick={() => handleViewCarDetails(car.id)}>
                  <Eye className="h-4 w-4 ml-1" />
                  عرض
                </Button>
                
                {isAdmin && status === "pending" && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-500 text-red-500 hover:bg-red-50"
                      onClick={() => handleRejectVerification(car.id)}
                    >
                      <X className="h-4 w-4 ml-1" />
                      رفض
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleApproveVerification(car.id)}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      موافقة
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Helper function to get mock data for demonstration
function getMockCars(status: string) {
  const baseCars = [
    {
      id: 1,
      make: "تويوتا",
      model: "كامري",
      year: 2021,
      owner: "أحمد محمد",
      submittedAt: "2023-07-15T12:00:00Z",
      status: status,
      documents: [
        { id: 1, type: "registration", verified: true },
        { id: 2, type: "insurance", verified: status !== "rejected" },
      ]
    },
    {
      id: 2,
      make: "نيسان",
      model: "التيما",
      year: 2020,
      owner: "سارة أحمد",
      submittedAt: "2023-07-14T10:30:00Z",
      status: status,
      documents: [
        { id: 3, type: "registration", verified: true },
        { id: 4, type: "insurance", verified: status === "approved" },
      ]
    },
    {
      id: 3,
      make: "مرسيدس",
      model: "c200",
      year: 2022,
      owner: "خالد عبدالله",
      submittedAt: "2023-07-13T09:45:00Z",
      status: status,
      documents: [
        { id: 5, type: "registration", verified: status !== "pending" },
        { id: 6, type: "insurance", verified: status === "approved" },
      ]
    }
  ];

  return baseCars;
} 