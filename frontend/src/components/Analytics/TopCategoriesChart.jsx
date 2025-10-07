import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ArrowUpDown, TrendingUp } from "lucide-react";

const TopCategoriesChart = ({
  topCategories,
  formatCurrency,
  loading = false,
}) => {
  const [sortBy, setSortBy] = useState("amount"); // amount, count, avgAmount
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="h-6 bg-gray-200 rounded mb-4 w-48 animate-pulse"></div>
        <div className="h-96 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }
console.log(topCategories)
  if (!topCategories || topCategories.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Spending Categories
        </h3>
        <div className="flex items-center justify-center h-96 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No category data available</p>
            <p className="text-sm">Add some expenses to see top categories</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort data based on selected criteria
  const sortedData = [...topCategories].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case "count":
        aVal = a.count || 0;
        bVal = b.count || 0;
        break;
      case "avgAmount":
        aVal = a.avgAmount || 0;
        bVal = b.avgAmount || 0;
        break;
      default:
        aVal = a.amount || 0;
        bVal = b.amount || 0;
    }

    return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
  });

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg min-w-48">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="font-medium text-red-600">
                {formatCurrency(data.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Transactions:</span>
              <span className="font-medium">{data.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average:</span>
              <span className="font-medium">
                {formatCurrency(data.avgAmount || 0)}
              </span>
            </div>
            {data.percentage && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">% of Total:</span>
                <span className="font-medium">{data.percentage}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const toggleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field)
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return (
      <TrendingUp
        className={`h-4 w-4 transition-transform ${
          sortOrder === "asc" ? "rotate-180" : ""
        }`}
      />
    );
  };

  const getBarColor = (index) => {
    const colors = [
      "#3B82F6", // Blue
      "#EF4444", // Red
      "#10B981", // Green
      "#F59E0B", // Amber
      "#8B5CF6", // Purple
      "#EC4899", // Pink
      "#6B7280", // Gray
      "#84CC16", // Lime
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Top Spending Categories
        </h3>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <button
            onClick={() => toggleSort("amount")}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
              sortBy === "amount"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>Amount</span>
            {getSortIcon("amount")}
          </button>
          <button
            onClick={() => toggleSort("count")}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
              sortBy === "count"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>Count</span>
            {getSortIcon("count")}
          </button>
          <button
            onClick={() => toggleSort("avgAmount")}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
              sortBy === "avgAmount"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>Avg</span>
            {getSortIcon("avgAmount")}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Categories</p>
          <p className="text-xl font-bold text-blue-700">{sortedData.length}</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600 font-medium">Highest Spend</p>
          <p className="text-xl font-bold text-red-700">
            {formatCurrency(Math.max(...sortedData.map((d) => d.amount)))}
          </p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-medium">
            Total Transactions
          </p>
          <p className="text-xl font-bold text-green-700">
            {sortedData.reduce((sum, d) => sum + (d.count || 0), 0)}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="horizontal" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              tickFormatter={(value) =>
                sortBy === "count" ? value : `₹${value}`
              }
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={customTooltip} />
            <Bar dataKey={sortBy} radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 3 Categories Quick View */}
      <div className="mt-6 border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Top 3 Categories</h4>
        <div className="grid grid-cols-3 gap-4">
          {sortedData.slice(0, 3).map((category, index) => (
            <div
              key={category.category}
              className="text-center p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-center mb-2">
                <div className="text-2xl font-bold text-gray-400 mr-2">
                  #{index + 1}
                </div>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getBarColor(index) }}
                />
              </div>
              <p className="font-medium text-gray-900 truncate">
                {category.category}
              </p>
              <p className="text-sm text-red-600 font-medium">
                {formatCurrency(category.amount)}
              </p>
              <p className="text-xs text-gray-500">
                {category.count} transactions
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopCategoriesChart;
