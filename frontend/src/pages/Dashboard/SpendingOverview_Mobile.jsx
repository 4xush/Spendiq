import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { BarChart3, PieChart as PieChartIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const SpendingOverviewMobile = ({ categoryData, formatCurrency }) => {
  const [viewMode, setViewMode] = useState("chart");
  
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#F97316", "#06B6D4", "#84CC16"];

  console.log("💰 SpendingOverviewMobile received data:", categoryData);

  // Ensure we have valid data
  if (!categoryData || !Array.isArray(categoryData) || categoryData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <PieChartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 mb-2">No spending data available</p>
        <p className="text-sm text-gray-400">Add some transactions to see your spending breakdown</p>
      </div>
    );
  }

  // FIX: Flexible property mapping to handle different data structures
  const normalizeCategory = (cat) => {
    return {
      category: cat._id || cat.category || 'Unknown',
      // Try multiple possible property names for amount
      amount: cat.totalAmount || cat.amount || cat.total || 0,
      // Try multiple possible property names for count
      count: cat.transactionCount || cat.count || 0
    };
  };

  // Take only top 6 categories for mobile
  const topCategories = categoryData.slice(0, 6).map(normalizeCategory);
  const totalSpent = topCategories.reduce((sum, cat) => sum + cat.amount, 0);

  const chartData = topCategories.map((cat, index) => ({
    category: cat.category,
    amount: cat.amount,  // FIX: Use consistent property name
    count: cat.count,
    percentage: totalSpent > 0 ? ((cat.amount / totalSpent) * 100).toFixed(1) : 0,
    color: COLORS[index % COLORS.length]
  }));

  console.log("📊 Chart data processed:", chartData);
  console.log("📊 Total spent:", totalSpent);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.category}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(data.amount)} ({data.percentage}%)
          </p>
          <p className="text-xs text-gray-500">
            {data.count} transactions
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabelList = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for slices < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="10"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Spending Breakdown
          </h3>
          <Link
            to="/analytics"
            className="text-blue-600 text-sm font-medium flex items-center"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("chart")}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
              viewMode === "chart"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            <PieChartIcon className="h-4 w-4 mr-2" />
            Chart
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
              viewMode === "list"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            List
          </button>
        </div>
      </div>

      <div className="p-4">
        {viewMode === "chart" ? (
          <div>
            {/* Pie Chart - FIX: Changed dataKey from totalAmount to amount */}
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabelList}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3">
              {chartData.map((cat, index) => (
                <div key={`${cat.category}-${index}`} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {cat.category}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cat.percentage}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Bar Chart - FIX: Changed dataKey from totalAmount to amount */}
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'K' : value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-3">
              {chartData.map((cat, index) => (
                <div key={`${cat.category}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center flex-1">
                    <div
                      className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {cat.category}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cat.count} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(cat.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cat.percentage}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Spending */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Total Spending (Top 6)</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(totalSpent)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingOverviewMobile;
