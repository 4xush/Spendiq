import { useState, useEffect } from "react";
import { TrendingUp, Users, Download } from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import P2PAnalytics from "../components/P2PAnalytics";
import {
  AnalyticsFilters,
  SummaryCards,
  TrendChart,
  CategoryTable,
} from "../components/Analytics";

function Analytics() {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    search: "",
    type: "",
    categories: [],
    amountRange: { min: null, max: null },
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  useEffect(() => {
    fetchAllCategories();
  }, []);

  const fetchAllCategories = async () => {
    try {
      const response = await api.get("/transactions/categories");
      setAllCategories(response.data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setAllCategories([]);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.search) params.append("search", filters.search);
      if (filters.type) params.append("type", filters.type);

      if (filters.categories.length > 0) {
        filters.categories.forEach((cat) => params.append("categories", cat));
      }

      if (filters.amountRange.min !== null) {
        params.append("minAmount", filters.amountRange.min);
      }
      if (filters.amountRange.max !== null) {
        params.append("maxAmount", filters.amountRange.max);
      }

      const [summaryRes, categoryRes, trendRes, topCategoriesRes] =
        await Promise.all([
          api.get(`/analytics/summary?${params}`),
          api.get(`/analytics/by-category?${params}`),
          api.get(`/analytics/by-date?${params}&groupBy=day`),
          api.get(`/analytics/top-categories?${params}&limit=12`),
        ]);

      setSummary(summaryRes.data.summary);
      setCategoryData(categoryRes.data.categories);
      setTrendData(trendRes.data.trends);
      setTopCategories(topCategoriesRes.data.topCategories);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/analytics/export?${params}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const hasActiveFilters = 
    filters.search || 
    filters.type || 
    filters.categories.length > 0 || 
    filters.amountRange.min !== null || 
    filters.amountRange.max !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white top-0 z-10 shadow-sm rounded-lg pd-2 mb-2">
  <div className="container mx-auto px-4 py-4">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Analytics
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Financial insights
        </p>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md active:scale-95 text-sm font-medium shadow-sm"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </button>
    </div>

    {/* Tab Navigation - Pill Style */}
    <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
      <button
        onClick={() => setActiveTab("general")}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          activeTab === "general"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <TrendingUp className="h-4 w-4" />
        <span className="hidden sm:inline">General</span>
      </button>
      <button
        onClick={() => setActiveTab("p2p")}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          activeTab === "p2p"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline">P2P</span>
      </button>
    </div>
  </div>
</div>

      {/* Collapsible Filters */}
      <div className="bg-white border-b border-gray-200 rounded-md ">
        <div className="container mx-auto px-4 py-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700"
          >
            <span className="flex items-center gap-2">
              Filters
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  Active
                </span>
              )}
            </span>
            <span className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showFilters && (
            <div className="mt-4">
              <AnalyticsFilters
                filters={filters}
                onFiltersChange={setFilters}
                onExport={handleExport}
                categories={allCategories}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-4 sm:py-4">
        {activeTab === "general" ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards */}
            <SummaryCards
              summary={summary}
              formatCurrency={formatCurrency}
              loading={loading}
            />

            {/* Trend Chart */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <TrendChart
                trendData={trendData}
                formatCurrency={formatCurrency}
                loading={loading}
              />
            </div>

            {/* Category Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <CategoryTable
                categoryData={categoryData}
                formatCurrency={formatCurrency}
                loading={loading}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <P2PAnalytics
              dateRange={{
                startDate: filters.startDate,
                endDate: filters.endDate,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
