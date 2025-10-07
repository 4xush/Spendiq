import { useState, useEffect } from "react";
import {
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import api from "../utils/api";

const COLORS = [
  "#10B981", // Green for lent/given
  "#EF4444", // Red for borrowed/received
  "#F59E0B", // Orange for gifts
  "#8B5CF6", // Purple for payments
  "#3B82F6", // Blue for reimbursements
  "#EC4899", // Pink for other
];

const P2P_COLORS = {
  lent: "#10B981",
  borrowed: "#EF4444",
  gift_given: "#F59E0B",
  gift_received: "#8B5CF6",
  payment: "#3B82F6",
  reimbursement: "#EC4899",
};

const STATUS_COLORS = {
  pending: "#F59E0B",
  completed: "#10B981",
  overdue: "#EF4444",
  cancelled: "#6B7280",
};

function P2PAnalytics({ dateRange }) {
  const [p2pSummary, setP2pSummary] = useState(null);
  const [p2pTransactions, setP2pTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchP2PData();
  }, [dateRange]);

  const fetchP2PData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);

      const [summaryRes, transactionsRes] = await Promise.all([
        api.get(`/transactions/p2p/summary?${params}`),
        api.get(`/transactions/p2p?${params}`),
      ]);
      setP2pSummary(summaryRes.data.summary);
      setP2pTransactions(transactionsRes.data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch P2P data:", error);
      setP2pSummary({
        totalLent: 0,
        totalBorrowed: 0,
        netBalance: 0,
        breakdown: [],
      });
      setP2pTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Process data for charts
  const getTransactionTypeData = () => {
    const typeCount = {};
    const typeAmount = {};
    const typePending = {};

    p2pTransactions.forEach((transaction) => {
      const type = transaction.personToPerson.type;
      typeCount[type] = (typeCount[type] || 0) + 1;
      typeAmount[type] = (typeAmount[type] || 0) + transaction.amount;
      if (transaction.personToPerson.status === "pending") {
        typePending[type] = (typePending[type] || 0) + transaction.amount;
      }
    });

    return Object.keys(typeCount)
      .map((type) => ({
        type: type.replace("_", " ").toUpperCase(),
        count: typeCount[type],
        amount: typeAmount[type],
        pendingAmount: typePending[type] || 0,
        fill: P2P_COLORS[type] || "#6B7280",
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getStatusData = () => {
    const statusCount = {};
    const statusAmount = {};

    p2pTransactions.forEach((transaction) => {
      const status = transaction.personToPerson.status;
      statusCount[status] = (statusCount[status] || 0) + 1;
      statusAmount[status] = (statusAmount[status] || 0) + transaction.amount;
    });

    return Object.keys(statusCount).map((status) => ({
      status: status.toUpperCase(),
      count: statusCount[status],
      amount: statusAmount[status],
      color: STATUS_COLORS[status],
    }));
  };

  const getPersonWiseData = () => {
    const personData = {};

    p2pTransactions.forEach((transaction) => {
      const person = transaction.personToPerson.personName;
      if (!personData[person]) {
        personData[person] = {
          name: person,
          totalAmount: 0,
          transactions: 0,
          lent: 0,
          borrowed: 0,
        };
      }

      personData[person].totalAmount += transaction.amount;
      personData[person].transactions += 1;

      const type = transaction.personToPerson.type;
      if (["lent", "gift_given", "payment"].includes(type)) {
        personData[person].lent += transaction.amount;
      } else {
        personData[person].borrowed += transaction.amount;
      }
    });

    return Object.values(personData)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10); // Top 10 people
  };

  const getMonthlyTrend = () => {
    const monthlyData = {};

    p2pTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          lent: 0,
          borrowed: 0,
          net: 0,
        };
      }

      const type = transaction.personToPerson.type;
      if (["lent", "gift_given", "payment"].includes(type)) {
        monthlyData[monthKey].lent += transaction.amount;
      } else {
        monthlyData[monthKey].borrowed += transaction.amount;
      }

      monthlyData[monthKey].net =
        monthlyData[monthKey].lent - monthlyData[monthKey].borrowed;
    });

    return Object.values(monthlyData).sort((a, b) => {
      const [yearA, monthA] = a.month.split(" ");
      const [yearB, monthB] = b.month.split(" ");
      return (
        new Date(`${monthA} 1, ${yearA}`) - new Date(`${monthB} 1, ${yearB}`)
      );
    });
  };

  // Calculate derived metrics from the data
  const getCalculatedMetrics = () => {
    if (!p2pSummary?.breakdown) {
      return {
        completedTransactions: 0,
        pendingTransactions: 0,
        totalPendingAmount: 0,
      };
    }

    let totalTransactions = 0;
    let totalPendingAmount = 0;
    let pendingTransactions = 0;

    p2pSummary.breakdown.forEach((item) => {
      totalTransactions += item.count;
      if (item.pendingAmount > 0) {
        // Calculate how many transactions are pending based on pending amount vs total amount
        const pendingRatio = item.pendingAmount / item.totalAmount;
        const estimatedPendingCount = Math.round(item.count * pendingRatio);
        pendingTransactions += estimatedPendingCount;
      }
      totalPendingAmount += item.pendingAmount;
    });

    const completedTransactions = totalTransactions - pendingTransactions;

    return {
      completedTransactions,
      pendingTransactions,
      totalPendingAmount,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const typeData = getTransactionTypeData();
  const statusData = getStatusData();
  const personWiseData = getPersonWiseData();
  const monthlyTrend = getMonthlyTrend();
  const calculatedMetrics = getCalculatedMetrics();

  return (
    <div className="space-y-6">
      {/* P2P Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUpRight className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Lent</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(p2pSummary?.totalLent || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowDownLeft className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Borrowed
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(p2pSummary?.totalBorrowed || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p
                className={`text-2xl font-bold ${
                  (p2pSummary?.netBalance || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(p2pSummary?.netBalance || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Amount
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(calculatedMetrics.totalPendingAmount || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P2P Transactions */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                P2P Transactions
              </h3>
              <p className="text-sm text-gray-500">
                Total:{" "}
                {formatCurrency(
                  typeData.reduce((sum, item) => sum + item.amount, 0)
                )}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={typeData}
                margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="type"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-200 backdrop-blur-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: data.fill }}
                            />
                            <p className="text-sm font-semibold text-gray-900">
                              {data.type}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-xs text-gray-600">
                                Amount:
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(data.amount)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-xs text-gray-600">
                                Count:
                              </span>
                              <span className="text-sm font-bold text-gray-700">
                                {data.count} transactions
                              </span>
                            </div>
                            {data.pendingAmount > 0 && (
                              <div className="flex justify-between gap-4">
                                <span className="text-xs text-gray-600">
                                  Pending:
                                </span>
                                <span className="text-sm font-bold text-orange-600">
                                  {formatCurrency(data.pendingAmount)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#3B82F6">
                  {typeData.map((entry, index) => (
                    <Cell key={`p2p-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No P2P transaction data available
            </div>
          )}

          {/* P2P Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center">
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-green-700 font-medium">
                    Total Lent
                  </p>
                  <p className="text-lg font-bold text-green-800">
                    {formatCurrency(p2pSummary?.totalLent || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-center">
                <ArrowDownLeft className="h-4 w-4 text-red-600 mr-2" />
                <div>
                  <p className="text-sm text-red-700 font-medium">
                    Total Borrowed
                  </p>
                  <p className="text-lg font-bold text-red-800">
                    {formatCurrency(p2pSummary?.totalBorrowed || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Transaction Status
              </h3>
              <p className="text-sm text-gray-500">
                Total:{" "}
                {formatCurrency(
                  statusData.reduce((sum, item) => sum + item.amount, 0)
                )}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
          </div>

          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={statusData}
                margin={{ top: 5, right: 5, left: 5, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="status"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  height={40}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-200 backdrop-blur-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: data.color }}
                            />
                            <p className="text-sm font-semibold text-gray-900">
                              {data.status}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-xs text-gray-600">
                                Amount:
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(data.amount)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-xs text-gray-600">
                                Count:
                              </span>
                              <span className="text-sm font-bold text-gray-700">
                                {data.count} transactions
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#3B82F6">
                  {statusData.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No status data available
            </div>
          )}

          {/* Status Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-green-700 font-medium">
                    Completed
                  </p>
                  <p className="text-lg font-bold text-green-800">
                    {formatCurrency(
                      statusData.find(
                        (s) => s.status.toLowerCase() === "completed"
                      )?.amount || 0
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-orange-600 mr-2" />
                <div>
                  <p className="text-sm text-orange-700 font-medium">Pending</p>
                  <p className="text-lg font-bold text-orange-800">
                    {formatCurrency(
                      statusData.find(
                        (s) => s.status.toLowerCase() === "pending"
                      )?.amount || 0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Person-wise Breakdown */}
      {personWiseData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top People (By Transaction Volume)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Name
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    Total Amount
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    Transactions
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    Lent
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    Borrowed
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody>
                {personWiseData.map((person, index) => {
                  const net = person.lent - person.borrowed;
                  return (
                    <tr
                      key={person.name}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {person.name}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(person.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {person.transactions}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        {formatCurrency(person.lent)}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600">
                        {formatCurrency(person.borrowed)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-medium ${
                          net >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Stats - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-700">
                Completed Transactions
              </p>
              <p className="text-xl sm:text-2xl font-bold text-green-900 mt-1">
                {calculatedMetrics.completedTransactions || 0}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-orange-700">
                Pending Transactions
              </p>
              <p className="text-xl sm:text-2xl font-bold text-orange-900 mt-1">
                {calculatedMetrics.pendingTransactions || 0}
              </p>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 sm:p-4 sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-700">
                Unique Contacts
              </p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">
                {personWiseData.length}
              </p>
            </div>
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default P2PAnalytics;