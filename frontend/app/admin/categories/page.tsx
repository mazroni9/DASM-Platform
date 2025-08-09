"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Edit,
  Loader2,
  Search,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import AddCategoryForm from "../../../components/admin/AddCategoryForm";
import api from "@/lib/axios";
// Types
interface MarketCategoryData {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export default function MarketCategoriesPage() {
  const [categories, setCategories] = useState<MarketCategoryData[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<
    MarketCategoryData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get("api/admin/categories");
      // Assuming the response data is an array of categories
      const data = response.data.data.data || response.data;
      console.log(response);
      
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      toast.error("فشل في تحميل بيانات الأقسام");
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let result = [...categories];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchLower) ||
          cat.slug.toLowerCase().includes(searchLower)
      );
    }
    setFilteredCategories(result);
  };

  const handleToggleActive = (id: number) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, is_active: !cat.is_active } : cat
      )
    );
    toast.success("تم تحديث حالة القسم بنجاح");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "غير متوفر";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <span className="mr-2 text-xl">جاري تحميل بيانات الأقسام...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AddCategoryForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onCategoryAdded={(newCategory) => {
          setCategories((prev) => [newCategory, ...prev]);
          setShowAddForm(false);
        }}
      />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">أقسام السوق</h1>
        <div>
          <Button onClick={fetchCategories} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>

          <Button onClick={()=> setShowAddForm(true)} variant="outline" className={"ms-2 bg-green-600 text-white"} size="sm">
            <Plus className="w-4 h-4 ml-2" />
            اضافة قسم جديد
          </Button>
        </div>
      </div>
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow border flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="بحث بالاسم أو السلاج"
            className="pr-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {/* Categories table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السلاج
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{cat.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{cat.slug}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {cat.is_active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          مفعل
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 ml-1" />
                          غير مفعل
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cat.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                      <Button
                        onClick={() => handleToggleActive(cat.id)}
                        size="sm"
                        className={
                          cat.is_active
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }
                      >
                        {cat.is_active ? (
                          <XCircle className="w-4 h-4 ml-1" />
                        ) : (
                          <CheckCircle className="w-4 h-4 ml-1" />
                        )}
                        {cat.is_active ? "تعطيل" : "تفعيل"}
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a href={`#edit-${cat.id}`}>
                          <Edit className="w-4 h-4 ml-1" />
                          تعديل
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    لا توجد نتائج مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
