'use client';

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin, Shield, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProfilePage() {
  // بيانات وهمية مؤقتة
  const [formData, setFormData] = useState({
    name: "محمد أحمد الزهراني",
    email: "zahrma0p@yahoo.com",
    phone: "0123456789",
    city: "الرياض",
    address: "حي النزهة، شارع العليا",
    password: "",
    confirmPassword: "",
    subscription: "تاجر 200%",
    status: "مفعل ✅",
    joinDate: "2023-05-15",
    notifyEmail: true,
    notifySMS: false,
    twoFactorAuth: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("تم إرسال البيانات:", formData);
    // هنا تضع كود استدعاء API لحفظ التعديلات
    alert("تم حفظ التعديلات بنجاح");
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen" dir="rtl">
      
      {/* زر العودة للوحة التحكم */}
      <BackToDashboard />

      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">الملف الشخصي</h1>

      <div className="max-w-4xl mx-auto">
        {/* بطاقة معلومات العضوية */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <User size={36} />
              </div>
              <button className="absolute -bottom-1 -left-1 bg-gray-100 rounded-full p-1 shadow-sm hover:bg-gray-200 border">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
            </div>
            
            <div className="flex-grow text-center sm:text-right">
              <h2 className="text-xl font-bold text-gray-800">{formData.name}</h2>
              <p className="text-gray-500 mb-2">{formData.email}</p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
                  <span>{formData.subscription}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  <span>العضوية: {formData.status}</span>
                </span>
              </div>
              
              <p className="text-gray-500 text-sm">تاريخ الانضمام: {formData.joinDate}</p>
            </div>
          </div>
        </div>

        {/* تبويبات الإعدادات */}
        <Tabs defaultValue="personal" className="bg-white rounded-lg shadow border">
          <TabsList className="w-full p-0 bg-gray-50 rounded-t-lg border-b">
            <TabsTrigger value="personal" className="flex-1 py-3 rounded-none rounded-tl-lg data-[state=active]:bg-white">
              <User className="w-4 h-4 ml-1.5" />
              المعلومات الشخصية
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 py-3 rounded-none data-[state=active]:bg-white">
              <Shield className="w-4 h-4 ml-1.5" />
              الأمان
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 py-3 rounded-none rounded-tr-lg data-[state=active]:bg-white">
              <Bell className="w-4 h-4 ml-1.5" />
              الإشعارات
            </TabsTrigger>
          </TabsList>

          {/* معلومات شخصية */}
          <TabsContent value="personal" className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="name" className="mb-1.5">الاسم الكامل</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pr-9"
                      required
                    />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="mb-1.5">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="mb-1.5">رقم الهاتف</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pr-9"
                      required
                    />
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="city" className="mb-1.5">المدينة</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address" className="mb-1.5">العنوان</Label>
                  <div className="relative">
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="pr-9"
                    />
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit">حفظ التعديلات</Button>
              </div>
            </form>
          </TabsContent>

          {/* إعدادات الأمان */}
          <TabsContent value="security" className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="current-password" className="mb-1.5">كلمة المرور الحالية</Label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  placeholder="أدخل كلمة المرور الحالية"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="password" className="mb-1.5">كلمة المرور الجديدة</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="أدخل كلمة المرور الجديدة"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="mb-1.5">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                  />
                </div>
              </div>
              
              <div className="flex items-start space-x-2 space-x-reverse">
                <Checkbox 
                  id="twoFactorAuth" 
                  checked={formData.twoFactorAuth} 
                  onCheckedChange={(checked) => handleCheckboxChange('twoFactorAuth', checked === true)}
                  className="mt-1 mr-1"
                />
                <div>
                  <Label htmlFor="twoFactorAuth" className="text-base font-medium">المصادقة الثنائية</Label>
                  <p className="text-sm text-gray-500">تأمين حسابك بشكل أفضل باستخدام رمز إضافي عند تسجيل الدخول</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit">تحديث إعدادات الأمان</Button>
              </div>
            </form>
          </TabsContent>

          {/* إعدادات الإشعارات */}
          <TabsContent value="notifications" className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="flex items-start space-x-2 space-x-reverse">
                  <Checkbox 
                    id="notifyEmail" 
                    checked={formData.notifyEmail} 
                    onCheckedChange={(checked) => handleCheckboxChange('notifyEmail', checked === true)}
                    className="mt-1 mr-1"
                  />
                  <div>
                    <Label htmlFor="notifyEmail" className="text-base font-medium">إشعارات البريد الإلكتروني</Label>
                    <p className="text-sm text-gray-500">استلام إشعارات عبر البريد الإلكتروني عند حدوث نشاط في حسابك</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 space-x-reverse">
                  <Checkbox 
                    id="notifySMS" 
                    checked={formData.notifySMS} 
                    onCheckedChange={(checked) => handleCheckboxChange('notifySMS', checked === true)}
                    className="mt-1 mr-1"
                  />
                  <div>
                    <Label htmlFor="notifySMS" className="text-base font-medium">إشعارات الرسائل النصية</Label>
                    <p className="text-sm text-gray-500">استلام إشعارات عبر الرسائل النصية عند حدوث نشاط في حسابك</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit">حفظ تفضيلات الإشعارات</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
