"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Loader2, 
  Plus, 
  ArrowDownLeft, 
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Calendar,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import LoadingLink from "@/components/LoadingLink";

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
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const router = useLoadingRouter();
    const { isLoggedIn } = useAuth();

    // Verify user is authenticated
    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/auth/login?returnUrl=/dealer/my-wallet");
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
                                        month: "long",
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
                setTransactions([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchWalletData();
    }, [isLoggedIn]);

      // Function to get transaction type in Arabic
      const getTransactionTypeArabic = (type: string) => {
        const typeMap = {
            "deposit": "إيداع",
            "withdrawal": "سحب",
            "purchase": "شراء",
            "sale": "تحويل مبيعات",
            "commission": "عمولة",
            "refund": "استرداد",
            "bid": "مزايدة",
            "transfer": "تحويل"
        };
        
        return typeMap[type] || type;
    };
    // Filter transactions
    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             getTransactionTypeArabic(transaction.type || "")?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
        
        return matchesSearch && matchesType && matchesStatus;
    });

    // Navigate to deposit/withdraw pages
    const handleDeposit = () => {
        router.push("/dealer/my-transfers?action=deposit");
    };

    const handleWithdraw = () => {
        router.push("/dealer/my-transfers?action=withdraw");
    };

  

    // Get transaction type config
    const getTransactionTypeConfig = (type: string) => {
        const typeMap = {
            "deposit": { 
                color: "text-emerald-400",
                bg: "bg-emerald-500/20",
                border: "border-emerald-500/30",
                icon: Plus
            },
            "withdrawal": { 
                color: "text-rose-400",
                bg: "bg-rose-500/20", 
                border: "border-rose-500/30",
                icon: ArrowDownLeft
            },
            "purchase": { 
                color: "text-blue-400",
                bg: "bg-blue-500/20",
                border: "border-blue-500/30",
                icon: CreditCard
            },
            "sale": { 
                color: "text-amber-400",
                bg: "bg-amber-500/20",
                border: "border-amber-500/30",
                icon: TrendingUp
            },
            "commission": { 
                color: "text-purple-400",
                bg: "bg-purple-500/20",
                border: "border-purple-500/30",
                icon: DollarSign
            },
            "refund": { 
                color: "text-cyan-400",
                bg: "bg-cyan-500/20",
                border: "border-cyan-500/30",
                icon: ArrowUpRight
            },
            "bid": { 
                color: "text-indigo-400",
                bg: "bg-indigo-500/20",
                border: "border-indigo-500/30",
                icon: Wallet
            }
        };
        
        return typeMap[type] || { 
            color: "text-gray-400",
            bg: "bg-gray-500/20",
            border: "border-gray-500/30",
            icon: DollarSign
        };
    };

    // Get status config
    const getStatusConfig = (status: string) => {
        const statusMap = {
            "completed": {
                color: "text-emerald-400",
                bg: "bg-emerald-500/20",
                border: "border-emerald-500/30",
                icon: CheckCircle
            },
            "pending": {
                color: "text-amber-400",
                bg: "bg-amber-500/20",
                border: "border-amber-500/30",
                icon: Clock
            },
            "failed": {
                color: "text-rose-400",
                bg: "bg-rose-500/20",
                border: "border-rose-500/30",
                icon: XCircle
            }
        };
        
        return statusMap[status] || {
            color: "text-gray-400",
            bg: "bg-gray-500/20",
            border: "border-gray-500/30",
            icon: Clock
        };
    };

    // Calculate transaction stats
    const transactionStats = {
        total: transactions.length,
        deposits: transactions.filter(t => t.type === 'deposit').length,
        withdrawals: transactions.filter(t => t.type === 'withdrawal').length,
        totalAmount: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card backdrop-blur-2xl border border-border rounded-2xl p-6 shadow-2xl"
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary rounded-xl">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">
                                    محفظتي <span className="text-primary">({walletBalance.total.toLocaleString()} ريال)</span>
                                </h1>
                                <p className="text-foreground/70 text-sm mt-1">إدارة رصيدك المالي ومعاملاتك</p>
                            </div>
                        </div>

                        {/* Balance Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Total Balance */}
                            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet className="w-4 h-4 text-primary" />
                                    <span className="text-sm text-foreground/80">الرصيد الكلي</span>
                                </div>
                                <p className="text-2xl font-bold text-primary">
                                    {walletBalance.total.toLocaleString()} ريال
                                </p>
                            </div>

                            {/* Available Balance */}
                            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-foreground/80">المتاح</span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-300">
                                    {walletBalance.available.toLocaleString()} ريال
                                </p>
                            </div>

                            {/* Funded Balance */}
                            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm text-foreground/80">المحجوز</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-300">
                                    {walletBalance.funded.toLocaleString()} ريال
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleDeposit}
                            className="flex items-center gap-2 px-4 py-3 bg-secondary text-white rounded-xl border border-secondary/30 hover:scale-105 transition-all duration-300 group"
                        >
                            <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span className="font-medium">إيداع</span>
                        </button>
                        <button
                            onClick={handleWithdraw}
                            className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl border border-red-400/30 hover:scale-105 transition-all duration-300 group"
                        >
                            <ArrowDownLeft className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span className="font-medium">سحب</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Transaction Stats */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{transactionStats.total}</div>
                        <div className="text-sm text-foreground/70">إجمالي المعاملات</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">{transactionStats.deposits}</div>
                        <div className="text-sm text-foreground/70">عملية إيداع</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-rose-400">{transactionStats.withdrawals}</div>
                        <div className="text-sm text-foreground/70">عملية سحب</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-400">
                            {transactionStats.totalAmount.toLocaleString('ar-EG')}
                        </div>
                        <div className="text-sm text-foreground/70">إجمالي المبالغ</div>
                    </div>
                </div>
            </motion.div>

            {/* Filters Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/70" />
                            <input
                                type="text"
                                placeholder="ابحث في المعاملات..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-xl pl-4 pr-10 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
                        >
                            <option value="all">جميع الأنواع</option>
                            <option value="deposit">إيداع</option>
                            <option value="withdrawal">سحب</option>
                            <option value="purchase">شراء</option>
                            <option value="sale">مبيعات</option>
                            <option value="commission">عمولة</option>
                            <option value="refund">استرداد</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-colors"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="completed">مكتملة</option>
                            <option value="pending">قيد المعالجة</option>
                            <option value="failed">فاشلة</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <Filter className="w-4 h-4" />
                        <span>عرض {filteredTransactions.length} من {transactions.length} معاملة</span>
                    </div>
                </div>
            </motion.div>

            {/* Transactions List */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
            >
                {isLoading ? (
                    <div className="text-center py-16">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <Loader2 className="absolute inset-0 w-full h-full animate-spin text-primary" />
                            <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-primary animate-spin opacity-60"></div>
                        </div>
                        <p className="text-lg text-foreground/70 font-medium">جاري تحميل بيانات المحفظة...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="p-6 bg-card/30 rounded-2xl border border-border max-w-md mx-auto">
                            <Wallet className="w-16 h-16 text-foreground/50 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground/70 mb-2">
                                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                                    ? 'لا توجد نتائج' 
                                    : 'لا توجد معاملات'
                                }
                            </h3>
                            <p className="text-foreground/50 text-sm mb-4">
                                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                                    ? 'لم نتمكن من العثور على معاملات تطابق معايير البحث'
                                    : 'لم تقم بأي معاملات في محفظتك حتى الآن'
                                }
                            </p>
                            {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') ? (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setTypeFilter('all');
                                        setStatusFilter('all');
                                    }}
                                    className="px-4 py-2 bg-primary/20 text-primary rounded-lg border border-primary/30 hover:bg-primary/30 transition-colors"
                                >
                                    إعادة تعيين الفلتر
                                </button>
                            ) : (
                                <button
                                    onClick={handleDeposit}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:scale-105 transition-all duration-300"
                                >
                                    <Plus className="w-4 h-4" />
                                    إيداع أول مبلغ
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    filteredTransactions.map((transaction, index) => {
                        const typeConfig = getTransactionTypeConfig(transaction.type);
                        const TypeIcon = typeConfig.icon;
                        const statusConfig = getStatusConfig(transaction.status || 'completed');
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                            <motion.div
                                key={transaction.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border/70 hover:shadow-xl transition-all duration-300 group"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={cn(
                                            "p-3 rounded-xl border backdrop-blur-sm transition-transform duration-300 group-hover:scale-110",
                                            typeConfig.bg,
                                            typeConfig.border
                                        )}>
                                            <TypeIcon className={cn("w-5 h-5", typeConfig.color)} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                                <h3 className="text-lg font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                                                    {getTransactionTypeArabic(transaction.type)}
                                                </h3>
                                                <div className={cn(
                                                    "text-xl font-bold",
                                                    transaction.amount > 0 ? "text-emerald-400" : "text-rose-400"
                                                )}>
                                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('ar-EG')} ريال
                                                </div>
                                            </div>

                                            <p className="text-foreground/70 text-sm mb-3 leading-relaxed">
                                                {transaction.description}
                                            </p>

                                            <div className="flex flex-wrap gap-4 text-sm text-foreground/50">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{transaction.date}</span>
                                                </div>
                                                {transaction.balance && (
                                                    <div className="flex items-center gap-1">
                                                        <Wallet className="w-3 h-3" />
                                                        <span>الرصيد: {transaction.balance.toLocaleString('ar-EG')} ريال</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm",
                                            statusConfig.bg,
                                            statusConfig.border,
                                            statusConfig.color
                                        )}>
                                            <StatusIcon className="w-3 h-3" />
                                            {transaction.status === 'completed' ? 'مكتمل' : 
                                             transaction.status === 'pending' ? 'قيد المعالجة' : 
                                             transaction.status === 'failed' ? 'فشل' : 'مكتمل'}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </div>
    );
}