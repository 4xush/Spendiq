import { useState, useEffect } from "react";
import { TrendingUp, Users } from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import P2PAnalytics from "../components/P2PAnalytics";
import {
  AnalyticsFilters,
  SummaryCards,
  CategoryChart,
  TrendChart,
  TopCategoriesChart,
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

      // Date filters
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      // Search filter
      if (filters.search) params.append("search", filters.search);

      // Type filter
      if (filters.type) params.append("type", filters.type);

      // Category filter
      if (filters.categories.length > 0) {
        filters.categories.forEach((cat) => params.append("categories", cat));
      }

      // Amount range filter
      if (filters.amountRange.min !== null) {
        params.append("minAmount", filters.amountRange.min);
      }
      if (filters.amountRange.max !== null) {
        params.append("maxAmount", filters.amountRange.max);
      }

      // Fetch all analytics data with filters
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Insights into your financial patterns</p>
        </div>
      </div>

      {/* Filters */}
      <AnalyticsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
        categories={allCategories}
        loading={loading}
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("general")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "general"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>General Analytics</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("p2p")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "p2p"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>P2P Analytics</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <SummaryCards
            summary={summary}
            formatCurrency={formatCurrency}
            loading={loading}
          />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <CategoryChart
              categoryData={categoryData}
              formatCurrency={formatCurrency}
              loading={loading}
            />
            <TrendChart
              trendData={trendData}
              formatCurrency={formatCurrency}
              loading={loading}
            />
          </div>
{/* Not needed for now, leaving it for furure improvements */}
          {/* Top Categories */}
          {/* <TopCategoriesChart
            topCategories={topCategories}
            formatCurrency={formatCurrency}
            loading={loading}
          /> */}

          {/* Detailed Table */}
          <CategoryTable
            categoryData={categoryData}
            formatCurrency={formatCurrency}
            loading={loading}
          />
        </div>
      )}

      {/* P2P Analytics Tab */}
      {activeTab === "p2p" && (
        <P2PAnalytics
          dateRange={{
            startDate: filters.startDate,
            endDate: filters.endDate,
          }}
        />
      )}
    </div>
  );
}

export default Analytics;
