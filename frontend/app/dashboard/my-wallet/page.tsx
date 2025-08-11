"use client";

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, ArrowDownLeft } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { log } from "console";

// Interface for the transaction data
interface Transaction {
    id: number;
    type: string;
    amount: number;
    balance?: number;
    description: string;
    date: string;
    created_at?: string;
    related_auction?: number | null;
    status?: string;
}

export default function MyWalletPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState({
        available: 0,
        funded: 0,
        total: 0,
    });
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    // Verify user is authenticated
    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/auth/login?returnUrl=/dashboard/my-wallet");
        }
    }, [isLoggedIn, router]);

    // Fetch wallet data
    useEffect(() => {
        async function fetchWalletData() {
            if (!isLoggedIn) return;

            setIsLoading(true);
            try {
                // Fetch wallet info
                const walletResponse = await api.get("/api/wallet");

                if (
                    walletResponse.data &&
                    walletResponse.data.status === "success"
                ) {
                    const walletData = walletResponse.data.data;

                    setWalletBalance({
                        available: walletData.available_balance || 0,
                        funded: walletData.funded_balance || 0,
                        total:
                            (walletData.available_balance || 0) +
                            (walletData.funded_balance || 0),
                    });
                }

                // Fetch transactions
                const transactionsResponse = await api.get(
                    "/api/wallet/transactions"
                );

                if (
                    transactionsResponse.data &&
                    transactionsResponse.data.status === "success"
                ) {
                    // Format transactions for display
                    const transactionData = transactionsResponse.data.data.data;
                    console.log(`transactionData`, transactionData);
                    if (Array.isArray(transactionData)) {
                        // Create a copy to manipulate
                        let formattedTransactions = [...transactionData];

                        // Sort by date (newest first)
                        formattedTransactions.sort((a, b) => {
                            return (
                                new Date(b.created_at || b.date).getTime() -
                                new Date(a.created_at || a.date).getTime()
                            );
                        });

                        // Format dates & calculate running balance if needed
                        let runningBalance = walletBalance.total;

                        const processedTransactions = formattedTransactions.map(
                            (transaction, index) => {
                                // Format date
                                const createdAt = transaction.created_at
                                    ? new Date(transaction.created_at)
                                    : new Date();

                                const dateString = createdAt.toLocaleDateString(
                                    "ar-SA",
                                    {
                                        year: "numeric",
                                        month: "numeric",
                                        day: "numeric",
                                    }
                                );
                                
                                // Calculate balance if not provided
                                if (index > 0) {
                                    runningBalance =
                                        runningBalance - transaction.amount;
                                }
                                
                                
                                return {
                                    ...transaction,
                                    date: transaction.date || dateString,
                                    balance:
                                        transaction.balance || runningBalance,
                                };
                            }
                        );

                        setTransactions(processedTransactions);
                    }
                } else {
                    // If no transactions found, or error, set to empty array
                    setTransactions([]);
                }
            } catch (error) {
                console.error("Error fetching wallet data:", error);
                toast.error("حدث خطأ أثناء تحميل بيانات المحفظة");
                // Fallback to empty data
                setTransactions([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchWalletData();
    }, [isLoggedIn]);

    // Navigate to deposit/withdraw pages
    const handleDeposit = () => {
        router.push("/dashboard/my-transfers?action=deposit");
    };

    const handleWithdraw = () => {
        router.push("/dashboard/my-transfers?action=withdraw");
    };

    // Function to get transaction type in Arabic
    const getTransactionTypeArabic = (type: string) => {
        switch (type) {
            case "deposit":
                return "إيداع";
            case "withdrawal":
                return "سحب";
            case "purchase":
                return "شراء";
            case "sale":
                return "تحويل مبيعات";
            case "commission":
                return "عمولة";
            case "refund":
                return "استرداد";
            case "bid":
                return "مزايدة";
            default:
                return type;
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
                محفظتي
            </h1>

            {/* رصيد المحفظة */}
            <section className="bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg shadow-lg p-8 mb-10 text-center">
                <h2 className="text-lg font-semibold mb-2">الرصيد الحالي</h2>

                {isLoading ? (
                    <div className="flex justify-center items-center py-4">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <p className="text-4xl font-bold">
                            {walletBalance.total.toLocaleString()} ريال
                        </p>

                        <div className="flex justify-center gap-6 mt-4 text-sm">
                            <div>
                                <span className="opacity-80">
                                    الرصيد المتاح:
                                </span>{" "}
                                <span className="font-bold">
                                    {walletBalance.available.toLocaleString()}{" "}
                                    ريال
                                </span>
                            </div>
                            <div>
                                <span className="opacity-80">
                                    الرصيد المحجوز:
                                </span>{" "}
                                <span className="font-bold">
                                    {walletBalance.funded.toLocaleString()} ريال
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                onClick={handleDeposit}
                                className="bg-white text-sky-600 hover:bg-gray-100 font-bold py-2 px-6 rounded-full transition flex items-center"
                            >
                                <Plus className="w-4 h-4 ml-1" />
                                إيداع
                            </button>
                            <button
                                onClick={handleWithdraw}
                                className="bg-white text-sky-600 hover:bg-gray-100 font-bold py-2 px-6 rounded-full transition flex items-center"
                            >
                                <ArrowDownLeft className="w-4 h-4 ml-1" />
                                سحب
                            </button>
                        </div>
                    </>
                )}
            </section>

            {/* سجل المعاملات */}
            <section className="bg-white p-6 rounded-lg shadow border">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">
                    تاريخ المعاملات
                </h2>

                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                        <span className="mr-2 text-gray-500">
                            جاري تحميل تاريخ المعاملات...
                        </span>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        لا توجد معاملات في محفظتك حتى الآن
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-gray-600">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-4 py-3">
                                        التاريخ
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        النوع
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        المبلغ
                                    </th>
                                    {/* <th scope="col" className="px-4 py-3">
                                        الرصيد
                                    </th> */}
                                    <th scope="col" className="px-4 py-3">
                                        الوصف
                                    </th>
                                    {/* Add status column if transactions have status */}
                                    {transactions.some((t) => t.status) && (
                                        <th scope="col" className="px-4 py-3">
                                            الحالة
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="border-b hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {t.date}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {getTransactionTypeArabic(t.type)}
                                        </td>
                                        <td
                                            className={`px-4 py-3 whitespace-nowrap ${
                                                t.amount > 0
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {t.amount > 0
                                                ? `+${t.amount.toLocaleString()}`
                                                : `${t.amount.toLocaleString()}`}{" "}
                                            ريال
                                        </td>
                                        {/* <td className="px-4 py-3 whitespace-nowrap">
                                            {t.balance?.toLocaleString() || "-"}{" "}
                                            ريال
                                        </td> */}
                                        <td className="px-4 py-3">
                                            {t.description}
                                        </td>
                                        {/* Add status column if transactions have status */}
                                        {transactions.some(
                                            (tx) => tx.status
                                        ) && (
                                            <td className="px-4 py-3">
                                                {t.status === "completed" ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                                                        مكتمل
                                                    </span>
                                                ) : t.status === "pending" ? (
                                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                                                        قيد المعالجة
                                                    </span>
                                                ) : t.status === "failed" ? (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                                                        فشل
                                                    </span>
                                                ) : (
                                                    t.status
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
