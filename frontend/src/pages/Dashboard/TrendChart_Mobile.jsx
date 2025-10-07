import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Activity, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const TrendChartMobile = ({ trendData, formatCurrency, formatDate }) => {
  const [viewMode, setViewMode] = useState("area");


  // Ensure we have valid data
  if (!trendData || !Array.isArray(trendData) || trendData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 mb-2">No trend data available</p>
        <p className="text-sm text-gray-400">Add some transactions to see your spending trends</p>
      </div>
    );
  }

  // Calculate trend summary - FIX: Use correct property names
  const totalDays = trendData.length;
  const totalIncome = trendData.reduce((sum, day) => sum + (day.income || 0), 0);
  const totalExpenses = trendData.reduce((sum, day) => sum + (day.expenses || 0), 0);
  const avgDailySpending = totalDays > 0 ? totalExpenses / totalDays : 0;

  // Find highest and lowest spending days - FIX: Use 'expenses' property
  const expenseAmounts = trendData.map(day => day.expenses || 0);
  const highestSpending = Math.max(...expenseAmounts);
  const lowestSpending = Math.min(...expenseAmounts);

  const highestSpendingDay = trendData.find(day => (day.expenses || 0) === highestSpending) || {};
  const lowestSpendingDay = trendData.find(day => (day.expenses || 0) === lowestSpending) || {};

  // Format data for charts - FIX: Use correct source property names
  const chartData = trendData.map(day => {
    let formattedDate;
    try {
      const dateObj = typeof day.date === 'string' ? new Date(day.date) : day.date;
      formattedDate = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      formattedDate = day.date || 'Unknown';
    }

    return {
      date: formattedDate,
      // FIX: Map source properties to chart-friendly names
      income: day.income || 0,
      expenses: day.expenses || 0,
      net: (day.income || 0) - (day.expenses || 0)
    };
  });


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center">
              <span 
                className="text-sm"
                style={{ color: entry.color }}
              >
                {/* FIX: Update labels to match new dataKeys */}
                {entry.dataKey === 'income' ? 'Income' : 
                 entry.dataKey === 'expenses' ? 'Expenses' : 'Net'}:
              </span>
              <span className="font-medium ml-2">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {totalDays}-Day Trends
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
            onClick={() => setViewMode("area")}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
              viewMode === "area"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            <Activity className="h-4 w-4 mr-2" />
            Area
          </button>
          <button
            onClick={() => setViewMode("line")}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
              viewMode === "line"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Lines
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-600 font-medium">Avg Daily</p>
            <p className="text-sm font-bold text-blue-700">
              {formatCurrency(avgDailySpending)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <TrendingDown className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-green-600 font-medium">Lowest</p>
            <p className="text-sm font-bold text-green-700">
              {formatCurrency(lowestSpending)}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 text-red-600 mx-auto mb-1" />
            <p className="text-xs text-red-600 font-medium">Highest</p>
            <p className="text-sm font-bold text-red-700">
              {formatCurrency(highestSpending)}
            </p>
          </div>
        </div>

        {/* Chart - FIX: Updated dataKey props */}
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "area" ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'K' : value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* FIX: Changed dataKey from totalIncome to income */}
                <Area
                  type="monotone"
                  dataKey="income"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                {/* FIX: Changed dataKey from totalExpenses to expenses */}
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'K' : value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* FIX: Changed dataKey from totalIncome to income */}
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {/* FIX: Changed dataKey from totalExpenses to expenses */}
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-6 mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Income</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Expenses</span>
          </div>
          {viewMode === "line" && (
            <div className="flex items-center">
              <div className="w-3 h-1 bg-blue-500 mr-2" style={{ borderStyle: 'dashed' }}></div>
              <span className="text-xs text-gray-600">Net</span>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">{totalDays}-Day Income</p>
              <p className="text-sm font-semibold text-green-600">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{totalDays}-Day Expenses</p>
              <p className="text-sm font-semibold text-red-600">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Net ({totalDays} days)</p>
            <p className={`text-lg font-bold ${
              (totalIncome - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendChartMobile;
