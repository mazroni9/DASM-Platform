"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import SuspenseLoader from '@/components/SuspenseLoader';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuth } from "@/hooks/useAuth";
import {
    Loader2,
    ArrowDownLeft,
    Plus,
    CreditCard,
    Building,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Wallet,
    DollarSign,
    Banknote,
    Shield,
    Clock,
    Sparkles
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingLink from "@/components/LoadingLink";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Form validation schemas
const depositSchema = z.object({
    amount: z
        .string()
        .min(1, { message: "المبلغ مطلوب" })
        .refine((val) => !isNaN(Number(val)), {
            message: "يجب أن يكون المبلغ رقماً",
        })
        .refine((val) => Number(val) >= 10, {
            message: "الحد الأدنى للإيداع هو 10 ريال",
        }),
    paymentMethod: z.enum(["bank_transfer", "credit_card", "mada", "stcpay"], {
        required_error: "يرجى اختيار طريقة الدفع",
    }),
    notes: z.string().optional(),
});

const withdrawSchema = z.object({
    amount: z
        .string()
        .min(1, { message: "المبلغ مطلوب" })
        .refine((val) => !isNaN(Number(val)), {
            message: "يجب أن يكون المبلغ رقماً",
        })
        .refine((val) => Number(val) >= 100, {
            message: "الحد الأدنى للسحب هو 100 ريال",
        }),
    bankName: z.string().min(2, { message: "اسم البنك مطلوب" }),
    accountNumber: z
        .string()
        .min(5, { message: "رقم الحساب يجب أن يكون على الأقل 5 أرقام" }),
    accountName: z.string().min(2, { message: "اسم صاحب الحساب مطلوب" }),
    notes: z.string().optional(),
});

type DepositFormValues = z.infer<typeof depositSchema>;
type WithdrawFormValues = z.infer<typeof withdrawSchema>;

interface TransactionStatus {
    status: "idle" | "loading" | "success" | "error";
    message: string;
    transactionId?: string | number;
}

function MoneyTransfersContent() {
    const searchParams = useSearchParams();
    const initialAction =
        searchParams?.get("action") === "withdraw" ? "withdraw" : "deposit";

    const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">(
        initialAction
    );
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [transactionStatus, setTransactionStatus] =
        useState<TransactionStatus>({
            status: "idle",
            message: "",
        });

    const router = useLoadingRouter();
    const { isLoggedIn } = useAuth();

    // Deposit form handling
    const depositForm = useForm<DepositFormValues>({
        resolver: zodResolver(depositSchema),
        defaultValues: {
            amount: "",
            paymentMethod: "bank_transfer",
            notes: "",
        },
    });

    // Withdraw form handling
    const withdrawForm = useForm<WithdrawFormValues>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: {
            amount: "",
            bankName: "",
            accountNumber: "",
            accountName: "",
            notes: "",
        },
    });

    // Verify user is authenticated
    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/auth/login?returnUrl=/dashboard/my-transfers");
        }
    }, [isLoggedIn, router]);

    // Handle URL query params to set the active tab
    useEffect(() => {
        const action = searchParams?.get("action");
        if (action === "withdraw") {
            setActiveTab("withdraw");
        } else if (action === "deposit") {
            setActiveTab("deposit");
        }
    }, [searchParams]);

    // Fetch wallet balance
    useEffect(() => {
        async function fetchWalletBalance() {
            if (!isLoggedIn) return;

            setIsLoading(true);
            try {
                const response = await api.get("/api/wallet");

                if (response.data && response.data.status === "success") {
                    const walletData = response.data.data;
                    const totalBalance =
                        (walletData.available_balance || 0) +
                        (walletData.funded_balance || 0);
                    setWalletBalance(totalBalance);
                }
            } catch (error) {
                console.error("Error fetching wallet balance:", error);
                toast.error("حدث خطأ أثناء تحميل رصيد المحفظة");
            } finally {
                setIsLoading(false);
            }
        }

        fetchWalletBalance();
    }, [isLoggedIn]);

    // Handle deposit form submission
    const handleDepositSubmit = async (data: DepositFormValues) => {
        setTransactionStatus({
            status: "loading",
            message: "جاري معالجة طلب الإيداع...",
        });

        try {
            // Convert amount to number
            const amount = Number(data.amount);

            // Prepare data for API call
            const depositData = {
                amount,
                payment_method: data.paymentMethod,
                notes: data.notes || undefined,
            };

            // Make API call to deposit endpoint
            const response = await api.post("/api/wallet/deposit", depositData);

            if (response.data && response.data.status === "success") {
                if (data.paymentMethod === "credit_card") {
                    window.location.href = response.data.payment_url;
                } else {
                    setTransactionStatus({
                        status: "success",
                        message:
                            "تم تسجيل طلب الإيداع بنجاح. ستتلقى تأكيداً قريباً.",
                        transactionId:
                            response.data.transaction_id || response.data.id,
                    });
                }
                // Reset form
                depositForm.reset();
                // Show success toast
                toast.success("تم تسجيل طلب الإيداع بنجاح");
            } else {
                throw new Error(
                    response.data?.message || "حدث خطأ أثناء معالجة طلب الإيداع"
                );
            }
        } catch (error: any) {
            console.error("Error processing deposit:", error);

            setTransactionStatus({
                status: "error",
                message:
                    error.response?.data?.message ||
                    "حدث خطأ أثناء معالجة طلب الإيداع. يرجى المحاولة مرة أخرى.",
            });

            toast.error("حدث خطأ أثناء معالجة طلب الإيداع");
        }
    };

    // Handle withdraw form submission
    const handleWithdrawSubmit = async (data: WithdrawFormValues) => {
        setTransactionStatus({
            status: "loading",
            message: "جاري معالجة طلب السحب...",
        });

        try {
            // Convert amount to number
            const amount = Number(data.amount);

            // Check if withdrawal amount exceeds wallet balance
            if (amount > walletBalance) {
                setTransactionStatus({
                    status: "error",
                    message: "رصيد المحفظة غير كافي لإتمام عملية السحب",
                });
                return;
            }

            // Prepare data for API call
            const withdrawData = {
                amount,
                bank_name: data.bankName,
                account_number: data.accountNumber,
                account_name: data.accountName,
                notes: data.notes || undefined,
            };

            // Make API call to withdraw endpoint
            const response = await api.post(
                "/api/wallet/withdraw",
                withdrawData
            );

            if (response.data && response.data.status === "success") {
                setTransactionStatus({
                    status: "success",
                    message:
                        "تم تسجيل طلب السحب بنجاح. ستتم معالجة الطلب خلال 1-3 أيام عمل.",
                    transactionId:
                        response.data.transaction_id || response.data.id,
                });

                // Reset form
                withdrawForm.reset();

                // Show success toast
                toast.success("تم تسجيل طلب السحب بنجاح");
            } else {
                throw new Error(
                    response.data?.message || "حدث خطأ أثناء معالجة طلب السحب"
                );
            }
        } catch (error: any) {
            console.error("Error processing withdrawal:", error);

            setTransactionStatus({
                status: "error",
                message:
                    error.response?.data?.message ||
                    "حدث خطأ أثناء معالجة طلب السحب. يرجى المحاولة مرة أخرى.",
            });

            toast.error("حدث خطأ أثناء معالجة طلب السحب");
        }
    };

    // Reset transaction status on tab change
    useEffect(() => {
        setTransactionStatus({
            status: "idle",
            message: "",
        });
    }, [activeTab]);

    // Helper function to handle tab change and update URL
    const handleTabChange = (value: string) => {
        if (value === "deposit" || value === "withdraw") {
            setActiveTab(value);

            // Update URL with query parameter
            const url = `/dashboard/my-transfers?action=${value}`;
            // Use replace to avoid adding to browser history stack
            router.replace(url, { scroll: false });

            // Reset transaction status
            setTransactionStatus({
                status: "idle",
                message: "",
            });
        }
    };

    // Get payment method config
    const getPaymentMethodConfig = (method: string) => {
        const methodMap = {
            "bank_transfer": { 
                name: "تحويل بنكي", 
                icon: Building,
                color: "text-blue-400",
                bg: "bg-blue-500/20",
                border: "border-blue-500/30"
            },
            "credit_card": { 
                name: "بطاقة ائتمانية", 
                icon: CreditCard,
                color: "text-purple-400",
                bg: "bg-purple-500/20",
                border: "border-purple-500/30"
            },
            "mada": { 
                name: "بطاقة مدى", 
                icon: CreditCard,
                color: "text-green-400",
                bg: "bg-green-500/20",
                border: "border-green-500/30"
            },
            "stcpay": { 
                name: "STC Pay", 
                icon: Banknote,
                color: "text-red-400",
                bg: "bg-red-500/20",
                border: "border-red-500/30"
            }
        };
        
        return methodMap[method] || { 
            name: method, 
            icon: CreditCard,
            color: "text-gray-400",
            bg: "bg-gray-500/20",
            border: "border-gray-500/30"
        };
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 shadow-2xl"
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    التحويلات المالية
                                </h1>
                                <p className="text-gray-400 text-sm mt-1">إيداع وسحب الأموال من محفظتك</p>
                            </div>
                        </div>

                        {/* Balance Card */}
                        <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl p-4 border border-amber-500/30 backdrop-blur-sm max-w-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wallet className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm text-gray-300">الرصيد الحالي</span>
                                    </div>
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                                            <span className="text-gray-400">جاري التحميل...</span>
                                        </div>
                                    ) : (
                                        <p className="text-2xl font-bold text-amber-300">
                                            {walletBalance.toLocaleString('ar-EG')} ريال
                                        </p>
                                    )}
                                </div>
                                <Shield className="w-8 h-8 text-amber-400/50" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <LoadingLink
                            href="/dashboard/my-wallet"
                            className="flex items-center gap-2 px-4 py-3 bg-gray-500/20 text-gray-300 rounded-xl border border-gray-500/30 hover:bg-gray-500/30 hover:scale-105 transition-all duration-300"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-medium">العودة للمحفظة</span>
                        </LoadingLink>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Tabs Navigation */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="xl:col-span-1"
                >
                    <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            نوع العملية
                        </h2>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => handleTabChange("deposit")}
                                className={cn(
                                    "w-full p-4 rounded-xl border transition-all duration-300 text-right flex items-center gap-3 group",
                                    activeTab === "deposit" 
                                        ? "bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-300 shadow-lg"
                                        : "bg-gray-800/30 border-gray-700/30 text-gray-400 hover:bg-gray-700/30 hover:border-gray-600/50"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
                                    activeTab === "deposit" 
                                        ? "bg-emerald-500/20" 
                                        : "bg-gray-700/30"
                                )}>
                                    <Plus className={cn(
                                        "w-5 h-5",
                                        activeTab === "deposit" ? "text-emerald-400" : "text-gray-400"
                                    )} />
                                </div>
                                <div className="flex-1 text-right">
                                    <div className="font-bold text-lg">إيداع مبلغ</div>
                                    <div className="text-sm opacity-80">إضافة أموال إلى محفظتك</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleTabChange("withdraw")}
                                className={cn(
                                    "w-full p-4 rounded-xl border transition-all duration-300 text-right flex items-center gap-3 group",
                                    activeTab === "withdraw" 
                                        ? "bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300 shadow-lg"
                                        : "bg-gray-800/30 border-gray-700/30 text-gray-400 hover:bg-gray-700/30 hover:border-gray-600/50"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
                                    activeTab === "withdraw" 
                                        ? "bg-rose-500/20" 
                                        : "bg-gray-700/30"
                                )}>
                                    <ArrowDownLeft className={cn(
                                        "w-5 h-5",
                                        activeTab === "withdraw" ? "text-rose-400" : "text-gray-400"
                                    )} />
                                </div>
                                <div className="flex-1 text-right">
                                    <div className="font-bold text-lg">سحب مبلغ</div>
                                    <div className="text-sm opacity-80">سحب الأموال من محفظتك</div>
                                </div>
                            </button>
                        </div>

                        {/* Info Cards */}
                        <div className="mt-6 space-y-3">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-blue-400 text-sm">
                                    <Shield className="w-4 h-4" />
                                    <span className="font-medium">آمن ومحمي</span>
                                </div>
                                <p className="text-blue-300 text-xs mt-1">
                                    جميع المعاملات مشفرة وآمنة
                                </p>
                            </div>
                            
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-amber-400 text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-medium">معالجة سريعة</span>
                                </div>
                                <p className="text-amber-300 text-xs mt-1">
                                    الإيداع فوري والسحب خلال 1-3 أيام
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Forms Section */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="xl:col-span-2"
                >
                    <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
                        {/* Deposit Form */}
                        {activeTab === "deposit" && (
                            <div className="space-y-6">
                                {transactionStatus.status === "success" ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            تم تسجيل طلب الإيداع بنجاح
                                        </h3>
                                        <p className="text-gray-300 mb-6">
                                            {transactionStatus.message}
                                        </p>
                                        {transactionStatus.transactionId && (
                                            <p className="text-sm text-gray-400 mb-6">
                                                رقم العملية:{" "}
                                                <span className="font-medium text-emerald-300">
                                                    {transactionStatus.transactionId}
                                                </span>
                                            </p>
                                        )}
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <LoadingLink
                                                href="/dashboard/my-wallet"
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg border border-gray-500/30 hover:bg-gray-500/30 transition-all duration-300"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                العودة إلى المحفظة
                                            </LoadingLink>
                                            <button
                                                onClick={() => setTransactionStatus({ status: "idle", message: "" })}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-300"
                                            >
                                                <Plus className="w-4 h-4" />
                                                إيداع مبلغ آخر
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : transactionStatus.status === "error" ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <div className="mx-auto w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-500/30">
                                            <AlertCircle className="w-10 h-10 text-rose-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            فشل عملية الإيداع
                                        </h3>
                                        <p className="text-gray-300 mb-6">
                                            {transactionStatus.message}
                                        </p>
                                        <button
                                            onClick={() => setTransactionStatus({ status: "idle", message: "" })}
                                            className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30 hover:bg-rose-500/30 transition-all duration-300 mx-auto"
                                        >
                                            المحاولة مرة أخرى
                                        </button>
                                    </motion.div>
                                ) : transactionStatus.status === "loading" ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12"
                                    >
                                        <div className="relative w-16 h-16 mx-auto mb-4">
                                            <Loader2 className="absolute inset-0 w-full h-full animate-spin text-blue-500" />
                                            <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-blue-500 animate-spin opacity-60"></div>
                                        </div>
                                        <p className="text-gray-300 text-lg">
                                            {transactionStatus.message}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onSubmit={depositForm.handleSubmit(handleDepositSubmit)}
                                        className="space-y-6"
                                    >
                                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                            <Plus className="w-5 h-5 text-emerald-400" />
                                            إيداع مبلغ جديد
                                        </h2>

                                        <div>
                                            <Label htmlFor="amount" className="text-gray-300 mb-2 block">
                                                المبلغ (بالريال السعودي)*
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="amount"
                                                    placeholder="أدخل المبلغ"
                                                    className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-emerald-500/50 pr-12"
                                                    {...depositForm.register("amount")}
                                                />
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                                    ر.س
                                                </div>
                                            </div>
                                            {depositForm.formState.errors.amount && (
                                                <p className="mt-2 text-sm text-rose-400">
                                                    {depositForm.formState.errors.amount.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="paymentMethod" className="text-gray-300 mb-2 block">
                                                طريقة الدفع*
                                            </Label>
                                            <Controller
                                                control={depositForm.control}
                                                name="paymentMethod"
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white focus:border-emerald-500/50">
                                                            <SelectValue placeholder="اختر طريقة الدفع" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                                            {["bank_transfer", "credit_card"].map((method) => {
                                                                const config = getPaymentMethodConfig(method);
                                                                const Icon = config.icon;
                                                                return (
                                                                    <SelectItem 
                                                                        key={method} 
                                                                        value={method} 
                                                                        className="focus:bg-gray-700 focus:text-white text-black"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Icon className="w-4 h-4" />
                                                                            {config.name}
                                                                        </div>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {depositForm.formState.errors.paymentMethod && (
                                                <p className="mt-2 text-sm text-rose-400">
                                                    {depositForm.formState.errors.paymentMethod.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="notes" className="text-gray-300 mb-2 block">
                                                ملاحظات (اختياري)
                                            </Label>
                                            <Input
                                                id="notes"
                                                placeholder="أي ملاحظات إضافية"
                                                className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-emerald-500/50"
                                                {...depositForm.register("notes")}
                                            />
                                        </div>

                                        <Button 
                                            type="submit" 
                                            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 border-0 text-white py-3 text-lg font-bold transition-all duration-300 hover:scale-105"
                                        >
                                            <Plus className="w-5 h-5 ml-2" />
                                            إيداع المبلغ
                                        </Button>
                                    </motion.form>
                                )}
                            </div>
                        )}

                        {/* Withdraw Form */}
                        {activeTab === "withdraw" && (
                            <div className="space-y-6">
                                {transactionStatus.status === "success" ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            تم تسجيل طلب السحب بنجاح
                                        </h3>
                                        <p className="text-gray-300 mb-6">
                                            {transactionStatus.message}
                                        </p>
                                        {transactionStatus.transactionId && (
                                            <p className="text-sm text-gray-400 mb-6">
                                                رقم العملية:{" "}
                                                <span className="font-medium text-emerald-300">
                                                    {transactionStatus.transactionId}
                                                </span>
                                            </p>
                                        )}
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <LoadingLink
                                                href="/dashboard/my-wallet"
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg border border-gray-500/30 hover:bg-gray-500/30 transition-all duration-300"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                العودة إلى المحفظة
                                            </LoadingLink>
                                            <button
                                                onClick={() => setTransactionStatus({ status: "idle", message: "" })}
                                                className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30 hover:bg-rose-500/30 transition-all duration-300"
                                            >
                                                <ArrowDownLeft className="w-4 h-4" />
                                                سحب مبلغ آخر
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : transactionStatus.status === "error" ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <div className="mx-auto w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-500/30">
                                            <AlertCircle className="w-10 h-10 text-rose-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            فشل عملية السحب
                                        </h3>
                                        <p className="text-gray-300 mb-6">
                                            {transactionStatus.message}
                                        </p>
                                        <button
                                            onClick={() => setTransactionStatus({ status: "idle", message: "" })}
                                            className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30 hover:bg-rose-500/30 transition-all duration-300 mx-auto"
                                        >
                                            المحاولة مرة أخرى
                                        </button>
                                    </motion.div>
                                ) : transactionStatus.status === "loading" ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12"
                                    >
                                        <div className="relative w-16 h-16 mx-auto mb-4">
                                            <Loader2 className="absolute inset-0 w-full h-full animate-spin text-rose-500" />
                                            <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-rose-500 animate-spin opacity-60"></div>
                                        </div>
                                        <p className="text-gray-300 text-lg">
                                            {transactionStatus.message}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onSubmit={withdrawForm.handleSubmit(handleWithdrawSubmit)}
                                        className="space-y-6"
                                    >
                                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                            <ArrowDownLeft className="w-5 h-5 text-rose-400" />
                                            سحب مبلغ من المحفظة
                                        </h2>

                                        <div>
                                            <Label htmlFor="amount" className="text-gray-300 mb-2 block">
                                                المبلغ (بالريال السعودي)*
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="amount"
                                                    placeholder="أدخل المبلغ"
                                                    className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-rose-500/50 pr-12"
                                                    {...withdrawForm.register("amount")}
                                                />
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                                    ر.س
                                                </div>
                                            </div>
                                            {withdrawForm.formState.errors.amount && (
                                                <p className="mt-2 text-sm text-rose-400">
                                                    {withdrawForm.formState.errors.amount.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="bankName" className="text-gray-300 mb-2 block">
                                                    اسم البنك*
                                                </Label>
                                                <Input
                                                    id="bankName"
                                                    placeholder="مثال: البنك الأهلي السعودي"
                                                    className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-rose-500/50"
                                                    {...withdrawForm.register("bankName")}
                                                />
                                                {withdrawForm.formState.errors.bankName && (
                                                    <p className="mt-2 text-sm text-rose-400">
                                                        {withdrawForm.formState.errors.bankName.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="accountNumber" className="text-gray-300 mb-2 block">
                                                    رقم الحساب / الآيبان*
                                                </Label>
                                                <Input
                                                    id="accountNumber"
                                                    placeholder="أدخل رقم الحساب أو الآيبان"
                                                    className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-rose-500/50"
                                                    {...withdrawForm.register("accountNumber")}
                                                />
                                                {withdrawForm.formState.errors.accountNumber && (
                                                    <p className="mt-2 text-sm text-rose-400">
                                                        {withdrawForm.formState.errors.accountNumber.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="accountName" className="text-gray-300 mb-2 block">
                                                اسم صاحب الحساب*
                                            </Label>
                                            <Input
                                                id="accountName"
                                                placeholder="أدخل اسم صاحب الحساب"
                                                className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-rose-500/50"
                                                {...withdrawForm.register("accountName")}
                                            />
                                            {withdrawForm.formState.errors.accountName && (
                                                <p className="mt-2 text-sm text-rose-400">
                                                    {withdrawForm.formState.errors.accountName.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="notes" className="text-gray-300 mb-2 block">
                                                ملاحظات (اختياري)
                                            </Label>
                                            <Input
                                                id="notes"
                                                placeholder="أي ملاحظات إضافية"
                                                className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-rose-500/50"
                                                {...withdrawForm.register("notes")}
                                            />
                                        </div>

                                        <Button 
                                            type="submit" 
                                            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 border-0 text-white py-3 text-lg font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                            disabled={isLoading || walletBalance === 0}
                                        >
                                            <ArrowDownLeft className="w-5 h-5 ml-2" />
                                            سحب المبلغ
                                        </Button>
                                        
                                        {walletBalance === 0 && (
                                            <p className="text-center text-rose-400 text-sm">
                                                لا يمكن السحب. الرصيد الحالي هو 0 ريال.
                                            </p>
                                        )}
                                    </motion.form>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function MoneyTransfersPage() {
    return (
        <Suspense fallback={<SuspenseLoader />}>
            <MoneyTransfersContent />
        </Suspense>
    );
}