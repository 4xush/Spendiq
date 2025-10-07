import { Search, Calendar, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const QUICK_FILTERS = [
  {
    type: "lastMonth",
    label: "Last 30d",
    styles: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },
  {
    type: "thisMonth",
    label: "This Month",
    styles: "bg-green-100 text-green-700 hover:bg-green-200",
  },
  {
    type: "lastYear",
    label: "Last Year",
    styles: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  },
  {
    type: "allTime",
    label: "All",
    styles: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  },
];

const TransactionFilters = ({ filters, onFiltersChange, onClearFilters }) => {
  // Local state for instant typing feedback
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  // Debounce the search - only update parent after 400ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ search: localSearch });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch]);

  // Sync local state when filters change externally (e.g., clear all)
  useEffect(() => {
    setLocalSearch(filters.search || "");
  }, [filters.search]);

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

    onFiltersChange({ startDate, endDate });
  };

  const clearFilter = (filterName) => {
    if (filterName === "search") {
      setLocalSearch(""); // Clear local state immediately
    }
    onFiltersChange({ [filterName]: "" });
  };

  const hasActiveFilters =
    filters.search || filters.type || filters.startDate || filters.endDate;

  return (
    <div className="space-y-3">
      {/* Quick Date Filters */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map(({ type, label, styles }) => (
          <button
            key={type}
            onClick={() => handleQuickDateFilter(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${styles}`}
          >
            {label}
          </button>
        ))}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Main Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search - DEBOUNCED for smooth typing */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Search
          </label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => clearFilter("search")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Type */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Type
          </label>
          <select
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none bg-white"
            value={filters.type || ""}
            onChange={(e) => onFiltersChange({ type: e.target.value })}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.5em 1.5em",
              paddingRight: "2.5rem",
            }}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        {/* Start Date */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            <span className="hidden sm:inline">Start Date</span>
            <span className="sm:hidden">From</span>
          </label>
          <div className="relative">
            <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="date"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={filters.startDate || ""}
              onChange={(e) => onFiltersChange({ startDate: e.target.value })}
            />
          </div>
        </div>

        {/* End Date */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            <span className="hidden sm:inline">End Date</span>
            <span className="sm:hidden">To</span>
          </label>
          <div className="relative">
            <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="date"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={filters.endDate || ""}
              onChange={(e) => onFiltersChange({ endDate: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
