import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const DashboardContext = createContext(null);

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyCompact = (amount) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export function DashboardProvider({ children }) {
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [recentP2P, setRecentP2P] = useState([]);
  const [p2pSummary, setP2pSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Create date range for trend data (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      // Fetch all dashboard data in parallel
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
        api.get("/analytics/by-category"),
        api.get(
          `/analytics/by-date?startDate=${startDateStr}&endDate=${endDateStr}&groupBy=day`
        ),
      ]);

      setSummary(summaryResponse.data.summary);
      setRecentTransactions(transactionsResponse.data.transactions || []);
      setRecentP2P(p2pTransactionsResponse.data.transactions || []);
      setP2pSummary(p2pSummaryResponse.data.summary);
      setCategoryData(categoryResponse.data.categories?.slice(0, 6) || []);
      setTrendData(trendResponse.data.trends || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Set empty arrays as fallback
      setCategoryData([]);
      setTrendData([]);
      setRecentTransactions([]);
      setRecentP2P([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh data function that can be called from components
  const refreshData = () => {
    fetchDashboardData();
  };

  const value = {
    summary,
    recentTransactions,
    categoryData,
    trendData,
    recentP2P,
    p2pSummary,
    loading,
    refreshData,
    // Utility functions
    formatCurrency,
    formatCurrencyCompact,
    formatDate,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === null) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export default DashboardContext;
