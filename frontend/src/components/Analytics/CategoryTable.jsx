import { useState, useMemo } from "react";
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Eye,
} from "lucide-react";

const CategoryTable = ({ categoryData, formatCurrency, loading = false }) => {
  const [sortBy, setSortBy] = useState("amount");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetails, setShowDetails] = useState({});

  const COLORS = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#6B7280",
    "#84CC16",
    "#F97316",
    "#06B6D4",
    "#8B5A2B",
    "#DC2626",
  ];

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!categoryData) return [];

    let filtered = categoryData.filter((item) =>
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aVal = a[sortBy] || 0;
      let bVal = b[sortBy] || 0;

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === "desc") {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });
  }, [categoryData, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return (
      <TrendingUp
        className={`h-4 w-4 text-blue-600 transition-transform ${
          sortOrder === "asc" ? "rotate-180" : ""
        }`}
      />
    );
  };

  const toggleDetails = (category) => {
    setShowDetails((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const exportToCSV = () => {
    const headers = [
      "Category",
      "Amount",
      "Percentage",
      "Transactions",
      "Average Amount",
    ];
    const csvContent = [
      headers.join(","),
      ...processedData.map((row) =>
        [
          row.category,
          row.amount,
          row.percentage,
          row.count,
          row.avgAmount || row.amount / row.count,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "category-breakdown.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="h-6 bg-gray-200 rounded mb-4 w-48 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Category Breakdown
        </h3>
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p>No category data available for the selected date range</p>
          <p className="text-sm mt-1">
            Add some transactions to see detailed breakdown
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Category Breakdown
        </h3>
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Categories</p>
          <p className="text-xl font-bold text-gray-900">
            {processedData.length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(
              processedData.reduce((sum, item) => sum + item.amount, 0)
            )}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="text-xl font-bold text-blue-600">
            {processedData.reduce((sum, item) => sum + item.count, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Avg per Category</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(
              processedData.reduce((sum, item) => sum + item.amount, 0) /
                processedData.length || 0
            )}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => toggleSort("category")}
                  className="flex items-center space-x-1 font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>Category</span>
                  {getSortIcon("category")}
                </button>
              </th>
              <th className="text-right py-3 px-4">
                <button
                  onClick={() => toggleSort("amount")}
                  className="flex items-center space-x-1 font-medium text-gray-700 hover:text-gray-900 ml-auto"
                >
                  <span>Amount</span>
                  {getSortIcon("amount")}
                </button>
              </th>
              <th className="text-right py-3 px-4">
                <button
                  onClick={() => toggleSort("percentage")}
                  className="flex items-center space-x-1 font-medium text-gray-700 hover:text-gray-900 ml-auto"
                >
                  <span>%</span>
                  {getSortIcon("percentage")}
                </button>
              </th>
              <th className="text-right py-3 px-4">
                <button
                  onClick={() => toggleSort("count")}
                  className="flex items-center space-x-1 font-medium text-gray-700 hover:text-gray-900 ml-auto"
                >
                  <span>Transactions</span>
                  {getSortIcon("count")}
                </button>
              </th>
              <th className="text-right py-3 px-4">
                <button
                  onClick={() => toggleSort("avgAmount")}
                  className="flex items-center space-x-1 font-medium text-gray-700 hover:text-gray-900 ml-auto"
                >
                  <span>Avg Amount</span>
                  {getSortIcon("avgAmount")}
                </button>
              </th>
              <th className="text-center py-3 px-4">
                <span className="font-medium text-gray-700">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((item, index) => (
              <tr
                key={item.category}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                    <div>
                      <span className="font-medium text-gray-900">
                        {item.category}
                      </span>
                      {showDetails[item.category] && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last updated: {new Date().toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-semibold text-red-600">
                    {formatCurrency(item.amount)}
                  </span>
                  {showDetails[item.category] && (
                    <div className="text-xs text-gray-500 mt-1">
                      {(
                        (item.amount /
                          processedData.reduce((sum, d) => sum + d.amount, 0)) *
                        100
                      ).toFixed(1)}
                      % of total
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-gray-900">
                    {item.percentage}%
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-blue-600">
                    {item.count}
                  </span>
                  {showDetails[item.category] && (
                    <div className="text-xs text-gray-500 mt-1">
                      {(
                        (item.count /
                          processedData.reduce((sum, d) => sum + d.count, 0)) *
                        100
                      ).toFixed(1)}
                      % of total
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-green-600">
                    {formatCurrency(item.avgAmount || item.amount / item.count)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => toggleDetails(item.category)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination info */}
      {searchTerm && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {processedData.length} categories matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default CategoryTable;
