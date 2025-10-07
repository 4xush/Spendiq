import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Receipt,
  Plus,
  GripVertical,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
} from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link } from "react-router-dom";
import RecentTransactions from "./Dashboard/RecentTransactions";
import SpendingAndP2POverview from "./Dashboard/SpendingAndP2POverview";
import SevenDayTrend from "./Dashboard/SevenDayTrend";

function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [recentP2P, setRecentP2P] = useState([]);
  const [p2pSummary, setP2pSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leftWidth, setLeftWidth] = useState(35);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(35);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch summary
      const summaryResponse = await api.get("/analytics/summary");
      setSummary(summaryResponse.data.summary);

      // Fetch recent transactions
      const transactionsResponse = await api.get("/transactions?limit=3");
      setRecentTransactions(transactionsResponse.data.transactions);

      // Fetch recent P2P transactions
      const p2pTransactionsResponse = await api.get(
        "/transactions/p2p?limit=3"
      );
      setRecentP2P(p2pTransactionsResponse.data.transactions || []);

      // Fetch P2P summary
      const p2pSummaryResponse = await api.get("/transactions/p2p/summary");
      setP2pSummary(p2pSummaryResponse.data.summary);

      // Fetch category data
      const categoryResponse = await api.get("/analytics/by-category");
      setCategoryData(categoryResponse.data.categories.slice(0, 6));

      // Fetch trend data (last 30 days for expandable chart)
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const trendResponse = await api.get(
        `/analytics/by-date?startDate=${startDate}&endDate=${endDate}&groupBy=day`
      );
      setTrendData(trendResponse.data.trends);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - startXRef.current;
      const deltaPercentage = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(
        20,
        Math.min(40, startWidthRef.current + deltaPercentage)
      );

      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Here's your financial overview</p>
        </div>
        <Link to="/transactions" className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Income</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(summary?.totalIncome || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">
                Total Expenses
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(summary?.totalExpenses || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IndianRupee className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Net Amount</p>
              <p
                className={`text-lg font-bold ${
                  (summary?.netAmount || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(summary?.netAmount || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Receipt className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Transactions</p>
              <p className="text-lg font-bold text-gray-900">
                {summary?.totalTransactions || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resizable Charts Container */}
      <div
        ref={containerRef}
        className="relative flex gap-0 items-stretch"
        style={{ minHeight: "500px" }}
      >
        {/* Left Component - Spending & P2P Overview */}
        <div
          className="transition-all duration-300 ease-out"
          style={{ width: `${leftWidth}%` }}
        >
          <SpendingAndP2POverview
            categoryData={categoryData}
            formatCurrency={formatCurrency}
            width={leftWidth}
            p2pSummary={p2pSummary}
            recentP2P={recentP2P}
          />
        </div>

        {/* Draggable Divider */}
        <div
          className={`relative flex items-center justify-center cursor-col-resize group transition-all duration-200 ${
            isResizing
              ? "bg-blue-500 w-2"
              : "bg-transparent hover:bg-blue-100 w-3"
          }`}
          onMouseDown={handleMouseDown}
          style={{
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Visual Handle */}
          <div
            className={`absolute h-20 w-1 bg-gray-300 rounded-full transition-all duration-200 ${
              isResizing
                ? "bg-blue-500 w-1.5 h-24 scale-110"
                : "group-hover:bg-blue-500 group-hover:w-1.5 group-hover:h-24"
            }`}
          />

          {/* Grip Icon */}
          <GripVertical
            className={`h-5 w-5 text-gray-400 absolute transition-all duration-200 ${
              isResizing
                ? "text-blue-600 scale-125"
                : "group-hover:text-blue-600 group-hover:scale-110"
            }`}
          />

          {/* Tooltip */}
          {!isResizing && (
            <div className="absolute top-1/2 -translate-y-1/2 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                Drag to resize panels
              </div>
            </div>
          )}

          {/* Resize Indicator */}
          {isResizing && (
            <div className="absolute top-4 left-6 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-fadeIn">
              {leftWidth.toFixed(0)}% | {(100 - leftWidth).toFixed(0)}%
            </div>
          )}

          {/* Full Height Visual Line */}
          <div
            className={`absolute top-0 bottom-0 w-px transition-all duration-200 ${
              isResizing ? "bg-blue-500 opacity-30" : "bg-transparent"
            }`}
          />
        </div>

        {/* Right Component - Trend Chart */}
        <div
          className="transition-all duration-300 ease-out"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <SevenDayTrend
            trendData={trendData}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            width={100 - leftWidth}
          />
        </div>

        {/* Global Resize Overlay */}
        {isResizing && (
          <div className="fixed inset-0 bg-blue-500 bg-opacity-5 pointer-events-none z-50" />
        )}
      </div>

      {/* Recent Transactions */}
      <RecentTransactions
        recentTransactions={recentTransactions}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      {/* P2P Overview */}
      {recentP2P.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent P2P Transactions
            </h2>
            <Link
              to="/p2p"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All
            </Link>
          </div>

          {/* Recent P2P Transactions List */}
          <div className="space-y-3">
            {recentP2P.map((transaction) => {
              const p2p = transaction.personToPerson;
              const isOutgoing = ["lent", "gift_given", "payment"].includes(
                p2p.type
              );

              return (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-lg ${
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
                    <div className="ml-3">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {p2p.personName}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            p2p.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : p2p.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {p2p.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {p2p.type.replace("_", " ").toLowerCase()} •{" "}
                        {transaction.description} •
                        <span className="text-xs">
                          {formatDate(transaction.date)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        isOutgoing ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isOutgoing ? "-" : "+"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    {p2p.dueDate && p2p.status === "pending" && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Due {formatDate(p2p.dueDate)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
