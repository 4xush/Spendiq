import { useState, useMemo } from "react";
import {
  ArrowUpDown,
  TrendingUp,
  Search,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";

const CategoryTable = ({ categoryData, formatCurrency, loading = false }) => {
  const [sortBy, setSortBy] = useState("amount");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetails, setShowDetails] = useState({});

  const COLORS = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899",
    "#6B7280", "#84CC16", "#F97316", "#06B6D4", "#8B5A2B", "#DC2626",
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

      return sortOrder === "desc" ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
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
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return (
      <TrendingUp
        className={`h-3 w-3 text-blue-600 transition-transform ${
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
    const headers = ["Category", "Amount", "Percentage", "Transactions", "Average Amount"];
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
      <div className="p-4 sm:p-6">
        <div className="h-4 bg-gray-200 rounded mb-4 w-32 animate-pulse"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Category Breakdown
        </h3>
        <div className="text-center py-12 text-gray-500">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm">No category data available</p>
          <p className="text-xs text-gray-400 mt-1">Add transactions to see breakdown</p>
        </div>
      </div>
    );
  }

  const totalAmount = processedData.reduce((sum, item) => sum + item.amount, 0);
  const totalTransactions = processedData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Category Breakdown
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full sm:w-48 pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Summary - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Categories</p>
          <p className="text-base sm:text-xl font-bold text-gray-900">
            {processedData.length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Total Amount</p>
          <p className="text-base sm:text-xl font-bold text-red-600 truncate">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Transactions</p>
          <p className="text-base sm:text-xl font-bold text-blue-600">
            {totalTransactions}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Average</p>
          <p className="text-base sm:text-xl font-bold text-green-600 truncate">
            {formatCurrency(totalAmount / processedData.length || 0)}
          </p>
        </div>
      </div>

      {/* Table - Responsive */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-3 sm:px-4 py-2 text-left z-10">
                  <button
                    onClick={() => toggleSort("category")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Category</span>
                    {getSortIcon("category")}
                  </button>
                </th>
                <th className="px-3 sm:px-4 py-2 text-right">
                  <button
                    onClick={() => toggleSort("amount")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 ml-auto"
                  >
                    <span>Amount</span>
                    {getSortIcon("amount")}
                  </button>
                </th>
                <th className="hidden sm:table-cell px-3 sm:px-4 py-2 text-right">
                  <button
                    onClick={() => toggleSort("percentage")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 ml-auto"
                  >
                    <span>%</span>
                    {getSortIcon("percentage")}
                  </button>
                </th>
                <th className="px-3 sm:px-4 py-2 text-right">
                  <button
                    onClick={() => toggleSort("count")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 ml-auto"
                  >
                    <span className="hidden sm:inline">Txns</span>
                    <span className="sm:hidden">#</span>
                    {getSortIcon("count")}
                  </button>
                </th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-2 text-right">
                  <button
                    onClick={() => toggleSort("avgAmount")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 ml-auto"
                  >
                    <span>Avg</span>
                    {getSortIcon("avgAmount")}
                  </button>
                </th>
                <th className="px-3 py-2 text-center w-12">
                  <span className="text-xs font-medium text-gray-700">
                    <Eye className="h-3.5 w-3.5 mx-auto" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {processedData.map((item, index) => (
                <tr
                  key={item.category}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="sticky left-0 bg-white px-3 sm:px-4 py-2 sm:py-3 z-10">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-xs sm:text-sm text-gray-900 truncate block">
                          {item.category}
                        </span>
                        {showDetails[item.category] && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {item.percentage}% of total
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">
                    <span className="font-semibold text-xs sm:text-sm text-red-600">
                      {formatCurrency(item.amount)}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3 text-right">
                    <span className="font-medium text-xs sm:text-sm text-gray-900">
                      {item.percentage}%
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                    <span className="font-medium text-xs sm:text-sm text-blue-600">
                      {item.count}
                    </span>
                    {showDetails[item.category] && (
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {((item.count / totalTransactions) * 100).toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">
                    <span className="font-medium text-xs sm:text-sm text-green-600">
                      {formatCurrency(item.avgAmount || item.amount / item.count)}
                    </span>
                  </td>
                  <td className="px-3 py-2 sm:py-3 text-center">
                    <button
                      onClick={() => toggleDetails(item.category)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {showDetails[item.category] ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mt-4 text-xs sm:text-sm text-gray-600 text-center">
          Showing {processedData.length} categories matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default CategoryTable;
