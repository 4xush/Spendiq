import { Search } from "lucide-react";

const TransactionFilters = ({ filters, onFilterChange }) => {
  const handleQuickDateFilter = (type) => {
    const today = new Date();
    let startDate = "";
    let endDate = today.toISOString().split("T")[0];

    switch (type) {
      case "lastMonth":
        startDate = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          today.getDate()
        )
          .toISOString()
          .split("T")[0];
        break;
      case "thisMonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        break;
      case "lastYear":
        startDate = new Date(
          today.getFullYear() - 1,
          today.getMonth(),
          today.getDate()
        )
          .toISOString()
          .split("T")[0];
        break;
      case "allTime":
        startDate = "";
        endDate = "";
        break;
    }

    onFilterChange("startDate", startDate);
    onFilterChange("endDate", endDate);
  };

  return (
    <div className="card">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            className="input"
            value={filters.type}
            onChange={(e) => onFilterChange("type", e.target.value)}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            className="input"
            value={filters.startDate}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            className="input"
            value={filters.endDate}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
          />
        </div>
      </div>

      {/* Quick Date Filters */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => handleQuickDateFilter("lastMonth")}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          Last 30 Days
        </button>
        <button
          onClick={() => handleQuickDateFilter("thisMonth")}
          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
        >
          This Month
        </button>
        <button
          onClick={() => handleQuickDateFilter("lastYear")}
          className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
        >
          Last Year
        </button>
        <button
          onClick={() => handleQuickDateFilter("allTime")}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          All Time
        </button>
      </div>
    </div>
  );
};

export default TransactionFilters;
