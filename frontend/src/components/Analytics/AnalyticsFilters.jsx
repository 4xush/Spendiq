import { useState } from "react";
import { Search, X, Filter, Download, Calendar, ChevronDown } from "lucide-react";

const AnalyticsFilters = ({
  filters,
  onFiltersChange,
  onExport,
  categories = [],
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("quick");

  const datePresets = [
    { label: "Last 7 days", value: 7 },
    { label: "Last 30 days", value: 30 },
    { label: "Last 90 days", value: 90 },
    { label: "This year", value: 365 },
  ];

  const handlePresetChange = (days) => {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    onFiltersChange({ ...filters, startDate, endDate });
  };

  const handleAmountRangeChange = (field, value) => {
    onFiltersChange({
      ...filters,
      amountRange: {
        ...filters.amountRange,
        [field]: value ? parseFloat(value) : null,
      },
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.startDate || filters.endDate) count++;
    if (filters.type) count++;
    if (filters.amountRange?.min || filters.amountRange?.max) count++;
    if (filters.categories?.length > 0) count++;
    return count;
  };

  const clearAllFilters = () => {
    onFiltersChange({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      search: "",
      type: "",
      categories: [],
      amountRange: { min: null, max: null },
    });
    setIsOpen(false);
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <>
      {/* Compact Filter Bar */}
      <div className="bg-white rounded-lg border shadow-sm p-3 flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
          />
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          {/* Date Presets */}
          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            onChange={(e) => handlePresetChange(parseInt(e.target.value))}
            value=""
          >
            <option value="">Date range</option>
            {datePresets.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            value={filters.type || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, type: e.target.value })
            }
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {/* More Filters Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Export Button */}
          <button
            onClick={onExport}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Overlay Filter Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Filter Panel */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Advanced Filters
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-6">
              <button
                onClick={() => setActiveTab("quick")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "quick"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Quick Filters
              </button>
              <button
                onClick={() => setActiveTab("advanced")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "advanced"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Advanced
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === "quick" && (
                <>
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={filters.startDate || ""}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            startDate: e.target.value,
                          })
                        }
                      />
                      <input
                        type="date"
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={filters.endDate || ""}
                        onChange={(e) =>
                          onFiltersChange({ ...filters, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Transaction Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction Type
                    </label>
                    <div className="flex gap-2">
                      {["", "income", "expense"].map((type) => (
                        <button
                          key={type}
                          onClick={() =>
                            onFiltersChange({ ...filters, type: type })
                          }
                          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                            filters.type === type
                              ? "bg-blue-50 border-blue-600 text-blue-700"
                              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {type === "" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "advanced" && (
                <>
                  {/* Amount Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Range (₹)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Min"
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={filters.amountRange?.min || ""}
                        onChange={(e) =>
                          handleAmountRangeChange("min", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={filters.amountRange?.max || ""}
                        onChange={(e) =>
                          handleAmountRangeChange("max", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categories
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                      {categories.map((category) => (
                        <label
                          key={category}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20"
                            checked={filters.categories?.includes(category)}
                            onChange={(e) => {
                              const newCategories = e.target.checked
                                ? [...(filters.categories || []), category]
                                : filters.categories?.filter((c) => c !== category);
                              onFiltersChange({
                                ...filters,
                                categories: newCategories,
                              });
                            }}
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            {category}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply filters
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AnalyticsFilters;
