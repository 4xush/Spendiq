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

    p2pTransactions.forEach((transaction) => {
      const type = transaction.personToPerson.type;
      typeCount[type] = (typeCount[type] || 0) + 1;
      typeAmount[type] = (typeAmount[type] || 0) + transaction.amount;
    });

    return Object.keys(typeCount).map((type) => ({
      type: type.replace("_", " ").toUpperCase(),
      count: typeCount[type],
      amount: typeAmount[type],
    }));
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
        <div className="card border-l-4 border-green-500">
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

        <div className="card border-l-4 border-red-500">
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

        <div className="card border-l-4 border-blue-500">
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

        <div className="card border-l-4 border-orange-500">
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
        {/* Transaction Types Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transaction Types
          </h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {typeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No P2P transaction data available
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transaction Status
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Amount"]}
                />
                <Bar dataKey="amount" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No status data available
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyTrend.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly P2P Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip
                formatter={(value, name) => [formatCurrency(value), name]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="lent"
                stroke="#10B981"
                strokeWidth={2}
                name="Lent"
              />
              <Line
                type="monotone"
                dataKey="borrowed"
                stroke="#EF4444"
                strokeWidth={2}
                name="Borrowed"
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Net"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">
                Completed Transactions
              </p>
              <p className="text-2xl font-bold text-green-900">
                {calculatedMetrics.completedTransactions || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">
                Pending Transactions
              </p>
              <p className="text-2xl font-bold text-orange-900">
                {calculatedMetrics.pendingTransactions || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Unique Contacts
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {personWiseData.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default P2PAnalytics;
/*
{
  "totalLent": 26500,
  "totalBorrowed": 37000,
  "netAmount": -10500,
  "pendingLent": 8000,
  "pendingBorrowed": 0,
  "breakdown": [
    {
      "_id": "gift_given",
      "totalAmount": 7000,
      "count": 2,
      "pendingAmount": 0
    },
    {
      "_id": "borrowed",
      "totalAmount": 37000,
      "count": 2,
      "pendingAmount": 0
    },
    {
      "_id": "lent",
      "totalAmount": 26500,
      "count": 3,
      "pendingAmount": 8000
    },
    {
      "_id": "gift_received",
      "totalAmount": 17500,
      "count": 2,
      "pendingAmount": 0
    },
    {
      "_id": "payment",
      "totalAmount": 4200,
      "count": 2,
      "pendingAmount": 0
    },
    {
      "_id": "reimbursement",
      "totalAmount": 3300,
      "count": 2,
      "pendingAmount": 800
    }
  ]
}
*/
