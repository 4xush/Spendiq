import { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import api from "../../utils/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import P2PTransactionForm from "./P2PTransactionForm";
import toast from "react-hot-toast";

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

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "overdue":
        return "text-red-600 bg-red-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeEmoji = (type) => {
    switch (type) {
      case "lent":
        return "💸";
      case "borrowed":
        return "💰";
      case "gift_given":
        return "🎁";
      case "gift_received":
        return "🎉";
      case "payment":
        return "💳";
      case "reimbursement":
        return "💸";
      default:
        return "💰";
    }
  };

  const updateStatus = async (transactionId, newStatus) => {
    try {
      await api.patch(`/transactions/p2p/${transactionId}/status`, {
        status: newStatus,
      });
      toast.success("Status updated successfully");
      fetchData(); // Refresh data
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Person-to-Person Transactions
          </h1>
          <p className="text-gray-600">
            Track money lent, borrowed, and shared with others
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add P2P Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Lent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.totalLent || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Borrowed
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.totalBorrowed || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Amount</p>
              <p
                className={`text-2xl font-bold ${
                  (summary?.netAmount || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(summary?.netAmount || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  summary?.pendingLent + summary?.pendingBorrowed || 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent P2P Transactions
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No P2P transactions yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start tracking money between you and others
            </p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add First P2P Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getTypeEmoji(transaction.personToPerson.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {transaction.personToPerson.personName}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.personToPerson.status
                          )}`}
                        >
                          {transaction.personToPerson.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.date)}
                        </span>
                        {transaction.personToPerson.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due:{" "}
                            {formatDate(transaction.personToPerson.dueDate)}
                          </span>
                        )}
                        {transaction.personToPerson.personContact && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {transaction.personToPerson.personContact}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
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
                        >
                          ✓ Complete
                        </button>
                        <button
                          onClick={() =>
                            updateStatus(transaction._id, "cancelled")
                          }
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                        >
                          ✗ Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {transaction.personToPerson.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
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
