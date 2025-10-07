import { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Filter,
  Calendar,
  Phone,
} from "lucide-react";
import api from "../../utils/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import P2PTransactionForm from "./P2PTransactionForm";
import toast from "react-hot-toast";

// Status color mappings
const STATUS_COLORS = {
  completed: "text-green-600 bg-green-100",
  pending: "text-yellow-600 bg-yellow-100",
  overdue: "text-red-600 bg-red-100",
  cancelled: "text-gray-600 bg-gray-100",
};

// Type emoji mappings
const TYPE_EMOJIS = {
  lent: "💸",
  borrowed: "💰",
  gift_given: "🎁",
  gift_received: "🎉",
  payment: "💳",
  reimbursement: "💸",
};

const P2PDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, transactionsRes] = await Promise.all([
        api.get("/transactions/p2p/summary"),
        api.get("/transactions/p2p", { params: filters }),
      ]);

      setSummary(summaryRes.data.summary);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      console.error("Failed to fetch P2P data:", error);
      toast.error("Failed to load P2P data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const updateStatus = async (transactionId, newStatus) => {
    try {
      await api.patch(`/transactions/p2p/${transactionId}/status`, {
        status: newStatus,
      });
      toast.success("Status updated successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Summary cards configuration
  const summaryCards = [
    {
      label: "Total Lent",
      value: summary?.totalLent || 0,
      icon: TrendingUp,
      colorClass: "bg-green-100",
      iconColorClass: "text-green-600",
    },
    {
      label: "Total Borrowed",
      value: summary?.totalBorrowed || 0,
      icon: TrendingDown,
      colorClass: "bg-blue-100",
      iconColorClass: "text-blue-600",
    },
    {
      label: "Net Amount",
      value: summary?.netAmount || 0,
      icon: Users,
      colorClass: "bg-purple-100",
      iconColorClass: "text-purple-600",
      isNetAmount: true,
    },
    {
      label: "Pending",
      value: (summary?.pendingLent || 0) + (summary?.pendingBorrowed || 0),
      icon: Clock,
      colorClass: "bg-yellow-100",
      iconColorClass: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Person-to-Person Transactions
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Track money lent, borrowed, and shared with others
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add P2P Transaction</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map(({ label, value, icon: Icon, colorClass, iconColorClass, isNetAmount }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 ${colorClass} rounded-md flex-shrink-0`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColorClass}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">
                  {label}
                </p>
                <p
                  className={`text-base sm:text-lg lg:text-xl font-bold truncate ${
                    isNetAmount
                      ? value >= 0
                        ? "text-green-600"
                        : "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {formatCurrency(value)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
                page: 1,
              }))
            }
            className="flex-1 sm:flex-none min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, type: e.target.value, page: 1 }))
            }
            className="flex-1 sm:flex-none min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="lent">Lent</option>
            <option value="borrowed">Borrowed</option>
            <option value="gift_given">Gift Given</option>
            <option value="gift_received">Gift Received</option>
            <option value="payment">Payment</option>
            <option value="reimbursement">Reimbursement</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Recent P2P Transactions
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No P2P transactions yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Start tracking money between you and others
            </p>
            <button 
              onClick={() => setShowForm(true)} 
              className="btn-primary w-full sm:w-auto"
            >
              Add First P2P Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="text-xl sm:text-2xl flex-shrink-0 mt-0.5 sm:mt-0">
                      {TYPE_EMOJIS[transaction.personToPerson.type] || "💰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                          {transaction.personToPerson.personName}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            STATUS_COLORS[transaction.personToPerson.status] ||
                            STATUS_COLORS.cancelled
                          }`}
                        >
                          {transaction.personToPerson.status}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 line-clamp-2">
                        {transaction.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.date)}
                        </span>
                        {transaction.personToPerson.dueDate && (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            Due: {formatDate(transaction.personToPerson.dueDate)}
                          </span>
                        )}
                        {transaction.personToPerson.personContact && (
                          <span className="flex items-center gap-1 min-w-0 flex-shrink">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {transaction.personToPerson.personContact}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm sm:text-base lg:text-lg font-bold whitespace-nowrap ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>

                    {transaction.personToPerson.status === "pending" && (
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() =>
                            updateStatus(transaction._id, "completed")
                          }
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                          title="Mark as Complete"
                        >
                          <span className="hidden sm:inline">✓ Complete</span>
                          <span className="sm:hidden">✓</span>
                        </button>
                        <button
                          onClick={() =>
                            updateStatus(transaction._id, "cancelled")
                          }
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                          title="Cancel Transaction"
                        >
                          <span className="hidden sm:inline">✗ Cancel</span>
                          <span className="sm:hidden">✗</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {transaction.personToPerson.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">Notes:</span>{" "}
                      {transaction.personToPerson.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* P2P Transaction Form Modal */}
      <P2PTransactionForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
};

export default P2PDashboard;