"use client";

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

export default function MoneyTransfersPage() {
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

    const router = useRouter();
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

    // Function to display balance in readable format
    const formatBalance = (balance: number) => {
        return balance.toLocaleString() + " ريال";
    };

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

    return (
        <main
            className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen"
            dir="rtl"
        >
            {/* زر العودة */}
            <BackToDashboard />

            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
                التحويلات المالية
            </h1>

            {/* Current wallet balance display */}
            <div className="mb-8 text-center">
                <p className="text-gray-600 mb-1">الرصيد الحالي للمحفظة:</p>
                {isLoading ? (
                    <div className="flex justify-center items-center">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                        <span>جاري التحميل...</span>
                    </div>
                ) : (
                    <p className="text-2xl font-bold text-gray-800">
                        {formatBalance(walletBalance)}
                    </p>
                )}
            </div>

            {/* Main content area */}
            <div className="max-w-2xl mx-auto">
                {/* Tabs for Deposit and Withdraw */}
                <Tabs
                    defaultValue={activeTab}
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="bg-white rounded-lg shadow border"
                >
                    <TabsList className="w-full p-0 bg-gray-50 rounded-t-lg border-b">
                        <TabsTrigger
                            value="deposit"
                            className="flex-1 py-3 rounded-none rounded-tl-lg data-[state=active]:bg-white"
                        >
                            <Plus className="w-4 h-4 ml-1.5" />
                            إيداع مبلغ
                        </TabsTrigger>
                        <TabsTrigger
                            value="withdraw"
                            className="flex-1 py-3 rounded-none rounded-tr-lg data-[state=active]:bg-white"
                        >
                            <ArrowDownLeft className="w-4 h-4 ml-1.5" />
                            سحب مبلغ
                        </TabsTrigger>
                    </TabsList>

                    {/* Deposit Form */}
                    <TabsContent value="deposit" className="p-6 space-y-6">
                        {/* Show successful/error transaction status */}
                        {transactionStatus.status === "success" ? (
                            <div className="text-center py-6">
                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    تم تسجيل طلب الإيداع بنجاح
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {transactionStatus.message}
                                </p>
                                {transactionStatus.transactionId && (
                                    <p className="text-sm text-gray-500 mb-6">
                                        رقم العملية:{" "}
                                        <span className="font-medium">
                                            {transactionStatus.transactionId}
                                        </span>
                                    </p>
                                )}
                                <div className="flex gap-4 justify-center">
                                    <Link
                                        href="/dashboard/my-wallet"
                                        className="px-4 py-2 border border-blue-200 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 inline ml-1" />
                                        العودة إلى المحفظة
                                    </Link>
                                    <Button
                                        onClick={() =>
                                            setTransactionStatus({
                                                status: "idle",
                                                message: "",
                                            })
                                        }
                                        variant="default"
                                    >
                                        <Plus className="w-4 h-4 inline ml-1" />
                                        إيداع مبلغ آخر
                                    </Button>
                                </div>
                            </div>
                        ) : transactionStatus.status === "error" ? (
                            <div className="text-center py-6">
                                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-10 h-10 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    فشل عملية الإيداع
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {transactionStatus.message}
                                </p>
                                <Button
                                    onClick={() =>
                                        setTransactionStatus({
                                            status: "idle",
                                            message: "",
                                        })
                                    }
                                    variant="default"
                                >
                                    المحاولة مرة أخرى
                                </Button>
                            </div>
                        ) : transactionStatus.status === "loading" ? (
                            <div className="text-center py-10">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                                <p className="text-gray-600">
                                    {transactionStatus.message}
                                </p>
                            </div>
                        ) : (
                            <form
                                onSubmit={depositForm.handleSubmit(
                                    handleDepositSubmit
                                )}
                                className="space-y-5"
                            >
                                <div>
                                    <Label
                                        htmlFor="amount"
                                        className="mb-1.5 block"
                                    >
                                        المبلغ (بالريال السعودي)*
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="amount"
                                            placeholder="أدخل المبلغ"
                                            className="pr-2"
                                            {...depositForm.register("amount")}
                                        />
                                    </div>
                                    {depositForm.formState.errors.amount && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {
                                                depositForm.formState.errors
                                                    .amount.message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label
                                        htmlFor="paymentMethod"
                                        className="mb-1.5 block"
                                    >
                                        طريقة الدفع*
                                    </Label>
                                    <Controller
                                        
                                        control={depositForm.control}
                                        name="paymentMethod"
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر طريقة الدفع" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bank_transfer">
                                                        <div className="flex items-center">
                                                            <Building className="w-4 h-4 ml-2" />
                                                            تحويل بنكي
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="credit_card">
                                                        <div className="flex items-center">
                                                            <CreditCard className="w-4 h-4 ml-2" />
                                                            بطاقة ائتمانية(my)
                                                        </div>
                                                    </SelectItem>
                                                    {/* <SelectItem value="mada">
                                                        <div className="flex items-center">
                                                            <CreditCard className="w-4 h-4 ml-2" />
                                                            بطاقة مدى
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="stcpay">
                                                        <div className="flex items-center">
                                                            <CreditCard className="w-4 h-4 ml-2" />
                                                            STC Pay
                                                        </div>
                                                    </SelectItem> */}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {depositForm.formState.errors
                                        .paymentMethod && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {
                                                depositForm.formState.errors
                                                    .paymentMethod.message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label
                                        htmlFor="notes"
                                        className="mb-1.5 block"
                                    >
                                        ملاحظات (اختياري)
                                    </Label>
                                    <Input
                                        id="notes"
                                        placeholder="أي ملاحظات إضافية"
                                        {...depositForm.register("notes")}
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" className="w-full">
                                        <Plus className="w-4 h-4 ml-1.5" />
                                        إيداع المبلغ
                                    </Button>
                                </div>
                            </form>
                        )}
                    </TabsContent>

                    {/* Withdraw Form */}
                    <TabsContent value="withdraw" className="p-6 space-y-6">
                        {/* Show successful/error transaction status */}
                        {transactionStatus.status === "success" ? (
                            <div className="text-center py-6">
                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    تم تسجيل طلب السحب بنجاح
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {transactionStatus.message}
                                </p>
                                {transactionStatus.transactionId && (
                                    <p className="text-sm text-gray-500 mb-6">
                                        رقم العملية:{" "}
                                        <span className="font-medium">
                                            {transactionStatus.transactionId}
                                        </span>
                                    </p>
                                )}
                                <div className="flex gap-4 justify-center">
                                    <Link
                                        href="/dashboard/my-wallet"
                                        className="px-4 py-2 border border-blue-200 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 inline ml-1" />
                                        العودة إلى المحفظة
                                    </Link>
                                    <Button
                                        onClick={() =>
                                            setTransactionStatus({
                                                status: "idle",
                                                message: "",
                                            })
                                        }
                                        variant="default"
                                    >
                                        <ArrowDownLeft className="w-4 h-4 inline ml-1" />
                                        سحب مبلغ آخر
                                    </Button>
                                </div>
                            </div>
                        ) : transactionStatus.status === "error" ? (
                            <div className="text-center py-6">
                                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-10 h-10 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    فشل عملية السحب
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {transactionStatus.message}
                                </p>
                                <Button
                                    onClick={() =>
                                        setTransactionStatus({
                                            status: "idle",
                                            message: "",
                                        })
                                    }
                                    variant="default"
                                >
                                    المحاولة مرة أخرى
                                </Button>
                            </div>
                        ) : transactionStatus.status === "loading" ? (
                            <div className="text-center py-10">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                                <p className="text-gray-600">
                                    {transactionStatus.message}
                                </p>
                            </div>
                        ) : (
                            <form
                                onSubmit={withdrawForm.handleSubmit(
                                    handleWithdrawSubmit
                                )}
                                className="space-y-5"
                            >
                                <div>
                                    <Label
                                        htmlFor="amount"
                                        className="mb-1.5 block"
                                    >
                                        المبلغ (بالريال السعودي)*
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="amount"
                                            placeholder="أدخل المبلغ"
                                            className="pr-2"
                                            {...withdrawForm.register("amount")}
                                        />
                                    </div>
                                    {withdrawForm.formState.errors.amount && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {
                                                withdrawForm.formState.errors
                                                    .amount.message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label
                                        htmlFor="bankName"
                                        className="mb-1.5 block"
                                    >
                                        اسم البنك*
                                    </Label>
                                    <Input
                                        id="bankName"
                                        placeholder="مثال: البنك الأهلي السعودي"
                                        {...withdrawForm.register("bankName")}
                                    />
                                    {withdrawForm.formState.errors.bankName && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {
                                                withdrawForm.formState.errors
                                                    .bankName.message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label
                                        htmlFor="accountNumber"
                                        className="mb-1.5 block"
                                    >
                                        رقم الحساب / الآيبان*
                                    </Label>
                                    <Input
                                        id="accountNumber"
                                        placeholder="أدخل رقم الحساب أو الآيبان"
                                        {...withdrawForm.register(
                                            "accountNumber"
                                        )}
                                    />
                                    {withdrawForm.formState.errors
                                        .accountNumber && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {
                                                withdrawForm.formState.errors
                                                    .accountNumber.message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label
                                        htmlFor="accountName"
                                        className="mb-1.5 block"
                                    >
                                        اسم صاحب الحساب*
                                    </Label>
                                    <Input
                                        id="accountName"
                                        placeholder="أدخل اسم صاحب الحساب"
                                        {...withdrawForm.register(
                                            "accountName"
                                        )}
                                    />
                                    {withdrawForm.formState.errors
                                        .accountName && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {
                                                withdrawForm.formState.errors
                                                    .accountName.message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label
                                        htmlFor="notes"
                                        className="mb-1.5 block"
                                    >
                                        ملاحظات (اختياري)
                                    </Label>
                                    <Input
                                        id="notes"
                                        placeholder="أي ملاحظات إضافية"
                                        {...withdrawForm.register("notes")}
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={
                                            isLoading || walletBalance === 0
                                        }
                                    >
                                        <ArrowDownLeft className="w-4 h-4 ml-1.5" />
                                        سحب المبلغ
                                    </Button>
                                    {walletBalance === 0 && (
                                        <p className="mt-2 text-sm text-red-500 text-center">
                                            لا يمكن السحب. الرصيد الحالي هو 0
                                            ريال.
                                        </p>
                                    )}
                                </div>
                            </form>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}
