"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Dialog, DialogContent } from "@mui/material";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, authModalInitialTab } =
    useAuthStore();
  const [activeTab, setActiveTab] = useState(authModalInitialTab);

  useEffect(() => {
    setActiveTab(authModalInitialTab);
  }, [authModalInitialTab, isAuthModalOpen]);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register state
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirmation, setRegPasswordConfirmation] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const handleTabChange = (newValue: "login" | "register") => {
    setActiveTab(newValue);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    const result = await login(loginEmail, loginPassword);

    if (result.success) {
      toast.success("تم تسجيل الدخول بنجاح!");
      closeAuthModal();
      resetForms();
    } else {
      if (result.needsVerification) {
        setLoginError("يرجى التحقق من بريدك الإلكتروني أولاً لتفعيل حسابك.");
      } else if (result.pendingApproval) {
        setLoginError(result.error || "حسابك قيد مراجعة الإدارة.");
      } else {
        setLoginError(result.error || "فشل تسجيل الدخول. يرجى التحقق من بياناتك.");
      }
    }

    setLoginLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);

    if (regPassword !== regPasswordConfirmation) {
      setRegError("كلمتا المرور غير متطابقتين.");
      setRegLoading(false);
      return;
    }

    try {
      await api.post("/api/register", {
        first_name: regFirstName,
        last_name: regLastName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        password_confirmation: regPasswordConfirmation,

        // ✅ backend expects account_type
        account_type: "user",
      });

      toast.success("تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.");

      // Move to login tab and prefill email
      setActiveTab("login");
      setLoginEmail(regEmail);
      setLoginPassword("");

      // Keep modal open to allow user to login later
      // closeAuthModal();
      // resetForms();
    } catch (err: any) {
      const message = err.response?.data?.message || "حدث خطأ أثناء التسجيل.";
      setRegError(message);
    } finally {
      setRegLoading(false);
    }
  };

  const resetForms = () => {
    setLoginEmail("");
    setLoginPassword("");
    setLoginError(null);

    setRegFirstName("");
    setRegLastName("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
    setRegPasswordConfirmation("");
    setRegError(null);
  };

  const handleClose = () => {
    closeAuthModal();
    setTimeout(resetForms, 300);
  };

  return (
    <Dialog
      open={isAuthModalOpen}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: "transparent",
          boxShadow: "none",
          overflow: "visible",
        },
      }}
    >
      <DialogContent className="bg-card text-foreground p-0" style={{ overflow: "visible" }}>
        <div className="relative flex min-h-[550px]">
          <button
            aria-label="close"
            onClick={handleClose}
            className="absolute left-4 top-4 text-foreground/60 hover:text-foreground z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Right Side - Branding */}
          <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-background p-8 text-center">
            <img src="/logo.jpg" alt="DASM Platform Logo" className="w-[150px] mb-5" />
            <h2 className="text-2xl font-bold">مرحباً بك في منصة DASM</h2>
            <p className="mt-2 text-foreground/80">انضم إلى أكبر سوق للمزادات في المنطقة.</p>
          </div>

          {/* Left Side - Forms */}
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
            <div className="flex border-b border-border mb-6">
              <button
                onClick={() => handleTabChange("login")}
                className={cn(
                  "flex-1 pb-3 text-center font-medium",
                  activeTab === "login"
                    ? "text-primary border-b-2 border-primary"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => handleTabChange("register")}
                className={cn(
                  "flex-1 pb-3 text-center font-medium",
                  activeTab === "register"
                    ? "text-primary border-b-2 border-primary"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                إنشاء حساب
              </button>
            </div>

            {activeTab === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="login-email">البريد الإلكتروني</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="login-password">كلمة المرور</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    dir="ltr"
                  />
                </div>

                {loginError && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={loginLoading} className="w-full">
                  {loginLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                      جاري الدخول...
                    </span>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </form>
            )}

            {activeTab === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="reg-first-name">الاسم الأول</Label>
                    <Input
                      id="reg-first-name"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-last-name">الاسم الأخير</Label>
                    <Input
                      id="reg-last-name"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-phone">رقم الجوال</Label>
                  <Input
                    id="reg-phone"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-password">كلمة المرور</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-password-confirm">تأكيد كلمة المرور</Label>
                  <Input
                    id="reg-password-confirm"
                    type="password"
                    required
                    value={regPasswordConfirmation}
                    onChange={(e) => setRegPasswordConfirmation(e.target.value)}
                    dir="ltr"
                  />
                </div>

                {regError && (
                  <Alert variant="destructive">
                    <AlertDescription>{regError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={regLoading} className="w-full">
                  {regLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                      جاري الإنشاء...
                    </span>
                  ) : (
                    "إنشاء حساب"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
