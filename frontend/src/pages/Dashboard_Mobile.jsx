import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Receipt,
  Plus,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link } from "react-router-dom";

// Mobile-optimized components
import RecentTransactionsMobile from "./Dashboard/RecentTransactions_Mobile";
import SpendingOverviewMobile from "./Dashboard/SpendingOverview_Mobile";
import TrendChartMobile from "./Dashboard/TrendChart_Mobile";

function DashboardMobile() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [recentP2P, setRecentP2P] = useState([]);
  const [p2pSummary, setP2pSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Create date range for last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      console.log("📅 Fetching data for date range:", {
        startDateStr,
        endDateStr,
      });

      // Fetch all dashboard data
      const [
        summaryResponse,
        transactionsResponse,
        p2pTransactionsResponse,
        p2pSummaryResponse,
        categoryResponse,
        trendResponse,
      ] = await Promise.all([
        api.get("/analytics/summary"),
        api.get("/transactions?limit=5"),
        api.get("/transactions/p2p?limit=3"),
        api.get("/transactions/p2p/summary"),
        api.get("/analytics/by-category?limit=6"),
        api.get(
          `/analytics/by-date?startDate=${startDateStr}&endDate=${endDateStr}&groupBy=day`
        ),
      ]);

      console.log("📊 API Responses received:");
      console.log("Summary:", summaryResponse.data);
      console.log("Categories:", categoryResponse.data);
      console.log("Trends:", trendResponse.data);

      setSummary(summaryResponse.data.summary);
      setRecentTransactions(transactionsResponse.data.transactions || []);
      setRecentP2P(p2pTransactionsResponse.data.transactions || []);
      setP2pSummary(p2pSummaryResponse.data.summary);
      setCategoryData(categoryResponse.data.categories?.slice(0, 6) || []);
      setTrendData(trendResponse.data.trends || []);

      console.log("🎯 State updated:");
      console.log(
        "Category data length:",
        categoryResponse.data.categories?.length || 0
      );
      console.log("Trend data length:", trendResponse.data.trends?.length || 0);
    } catch (error) {
      console.error("❌ Failed to fetch dashboard data:", error);
      // Set empty arrays as fallback
      setCategoryData([]);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyCompact = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Hi, {user?.name?.split(" ")[0]}! 👋
              </h1>
              <p className="text-sm text-gray-600">Welcome back</p>
            </div>
            <Link
              to="/profile"
              className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
            >
              <span className="text-blue-600 font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards - Horizontal Scroll */}
      <div className="bg-white border-b">
        <div className="px-4 py-2">
          <div className="flex space-x-1.5 overflow-x-auto pb-1">
            {/* Net Balance - Primary Card */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md p-2 text-white min-w-[140px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">
                    Net Balance
                  </p>
                  <p className="text-lg font-bold">
                    {formatCurrencyCompact(summary?.netIncome || 0)}
                  </p>
                </div>
                <IndianRupee className="h-5 w-5 text-blue-200" />
              </div>
            </div>

            {/* Income Card */}
            <div className="flex-shrink-0 bg-white border border-gray-200 rounded-md p-2 min-w-[100px]">
              <div className="flex items-center">
                <div className="p-1 bg-green-100 rounded-sm mr-1.5">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Income</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrencyCompact(summary?.totalIncome || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="flex-shrink-0 bg-white border border-gray-200 rounded-md p-2 min-w-[100px]">
              <div className="flex items-center">
                <div className="p-1 bg-red-100 rounded-sm mr-1.5">
                  <TrendingDown className="h-3 w-3 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Expenses</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrencyCompact(summary?.totalExpenses || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions Count */}
            <div className="flex-shrink-0 bg-white border border-gray-200 rounded-md p-2 min-w-[100px]">
              <div className="flex items-center">
                <div className="p-1 bg-purple-100 rounded-sm mr-1.5">
                  <Receipt className="h-3 w-3 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Transactions
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {summary?.transactionCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="px-4">
          <div className="flex space-x-1">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "spending", label: "Spending", icon: PieChart },
              { id: "trends", label: "Trends", icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === "overview" && (
          <div className="space-y-4 p-4">
            {/* Recent Transactions */}
            <RecentTransactionsMobile
              recentTransactions={recentTransactions}
              formatCurrency={formatCurrencyCompact}
              formatDate={formatDate}
            />

            {/* P2P Summary */}
            {(recentP2P.length > 0 ||
              p2pSummary?.totalLent > 0 ||
              p2pSummary?.totalBorrowed > 0) && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    P2P Overview
                  </h3>
                  <Link
                    to="/p2p"
                    className="text-blue-600 text-sm font-medium flex items-center"
                  >
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>

                {/* P2P Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center">
                      <ArrowDownLeft className="h-4 w-4 text-green-600 mr-2" />
                      <div>
                        <p className="text-xs text-green-600 font-medium">
                          Lent
                        </p>
                        <p className="text-sm font-bold text-green-700">
                          {formatCurrencyCompact(p2pSummary?.totalLent || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 text-orange-600 mr-2" />
                      <div>
                        <p className="text-xs text-orange-600 font-medium">
                          Borrowed
                        </p>
                        <p className="text-sm font-bold text-orange-700">
                          {formatCurrencyCompact(
                            p2pSummary?.totalBorrowed || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent P2P Transactions */}
                {recentP2P.length > 0 && (
                  <div className="space-y-3">
                    {recentP2P.slice(0, 3).map((transaction) => {
                      const p2p = transaction.personToPerson;
                      const isOutgoing = [
                        "lent",
                        "gift_given",
                        "payment",
                      ].includes(p2p.type);

                      return (
                        <div
                          key={transaction._id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center flex-1">
                            <div
                              className={`p-2 rounded-lg mr-3 ${
                                isOutgoing
                                  ? "bg-red-100 text-red-600"
                                  : "bg-green-100 text-green-600"
                              }`}
                            >
                              {isOutgoing ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {p2p.personName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {p2p.type.replace("_", " ")} •{" "}
                                {formatDate(transaction.date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold ${
                                isOutgoing ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              {isOutgoing ? "-" : "+"}
                              {formatCurrencyCompact(transaction.amount)}
                            </p>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                p2p.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {p2p.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "spending" && (
          <div className="p-4">
            {categoryData.length > 0 ? (
              <SpendingOverviewMobile
                categoryData={categoryData}
                formatCurrency={formatCurrencyCompact}
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">No spending data available</p>
                <p className="text-sm text-gray-400">
                  Add some transactions to see your spending breakdown
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "trends" && (
          <div className="p-4">
            {trendData.length > 0 ? (
              <TrendChartMobile
                trendData={trendData}
                formatCurrency={formatCurrencyCompact}
                formatDate={formatDate}
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">No trend data available</p>
                <p className="text-sm text-gray-400">
                  Add some transactions to see your spending trends
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        to="/transactions?add=true"
        className="fixed bottom-20 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-50"
        title="Add Transaction"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}

export default DashboardMobile;
