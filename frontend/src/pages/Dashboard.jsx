import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Receipt,
  Plus,
  GripVertical,
} from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link } from "react-router-dom";
import RecentTransactions from "./Dashboard/RecentTransactions";
import SpendingByCategory from "./Dashboard/SpendingByCategory";
import SevenDayTrend from "./Dashboard/SevenDayTrend";

function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
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
      const transactionsResponse = await api.get("/transactions?limit=20");
      setRecentTransactions(transactionsResponse.data.transactions);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.totalIncome || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.totalExpenses || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IndianRupee className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Amount</p>
              <p
                className={`text-2xl font-bold ${
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

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Receipt className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
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
        {/* Left Component - Spending by Category */}
        <div
          className="transition-all duration-300 ease-out"
          style={{ width: `${leftWidth}%` }}
        >
          <SpendingByCategory
            categoryData={categoryData}
            formatCurrency={formatCurrency}
            width={leftWidth}
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

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
