import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
} from "lucide-react";

const SevenDayTrend = ({ trendData, formatCurrency, formatDate, width = 50 }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  // Calculate days to show based on width (7 days at 25%, 15 days at 75%)
  const calculateDaysToShow = (widthPercent) => {
    // Linear interpolation: 25% → 7 days, 75% → 15 days
    const minWidth = 50;
    const maxWidth = 75;
    const minDays = 7;
    const maxDays = 15;
    
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, widthPercent));
    const normalized = (clampedWidth - minWidth) / (maxWidth - minWidth);
    const days = Math.round(minDays + normalized * (maxDays - minDays));
    
    return Math.min(days, trendData.length);
  };

  const daysToShow = calculateDaysToShow(width);
  const displayData = trendData.slice(-daysToShow);
  
  // Responsive breakpoints
  const isCompact = width < 35;
  const isMedium = width >= 35 && width < 50;
  const isLarge = width >= 50;

  // Calculate stats
  const stats = {
    avgIncome:
      displayData.reduce((sum, d) => sum + d.income, 0) / displayData.length || 0,
    avgExpense:
      displayData.reduce((sum, d) => sum + d.expenses, 0) / displayData.length || 0,
    totalNet: displayData.reduce((sum, d) => sum + d.netAmount, 0),
    trend: calculateTrend(displayData),
  };

  function calculateTrend(data) {
    if (data.length < 2) return 0;
    const mid = Math.floor(data.length / 2);
    const firstHalf =
      data.slice(0, mid).reduce((sum, d) => sum + d.netAmount, 0) / mid;
    const secondHalf =
      data.slice(mid).reduce((sum, d) => sum + d.netAmount, 0) /
      (data.length - mid);
    return firstHalf !== 0
      ? ((secondHalf - firstHalf) / Math.abs(firstHalf)) * 100
      : 0;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-200 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(label)}
            </p>
          </div>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-6"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}:</span>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: entry.color }}
                >
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
            {payload[0]?.payload?.netAmount !== undefined && (
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-sm text-gray-600">Net Amount:</span>
                  <span
                    className={`text-sm font-bold ${
                      payload[0].payload.netAmount >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(payload[0].payload.netAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (trendData.length === 0) {
    return (
      <div className="card h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Financial Trend
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <TrendingUp className="h-12 w-12 mb-3 opacity-50" />
          <p>No trend data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full transition-all duration-300 ease-out">
      {/* Header */}
      <div className={`flex items-center justify-between mb-4 transition-all duration-300 ${
        isCompact ? 'flex-col items-start gap-2' : ''
      }`}>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 transition-all duration-300 ${
            isCompact ? 'text-base' : 'text-lg'
          }`}>
            {isCompact ? `${daysToShow}D Trend` : `Past ${daysToShow}-Day Financial Trend`}
          </h3>
          {!isCompact && (
            <p className="text-xs text-gray-500 mt-1">
              {displayData.length > 0 && (
                <>
                  {formatDate(displayData[0].date)} - {formatDate(displayData[displayData.length - 1].date)}
                </>
              )}
            </p>
          )}
        </div>
        {!isCompact && (
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
        )}
      </div>

      {/* Stats Cards - Adaptive Layout */}
      {!isCompact && (
        <div className={`grid gap-2 mb-4 transition-all duration-300 ${
          isMedium ? 'grid-cols-2' : 'grid-cols-3'
        }`}>
          <div className={`rounded-lg transition-all duration-300 ${
            isMedium ? 'p-2 bg-green-50' : 'p-3 bg-gradient-to-br from-green-50 to-green-100'
          }`}>
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className={`text-green-600 ${isMedium ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <p className={`text-gray-600 font-medium ${isMedium ? 'text-xs' : 'text-sm'}`}>
                Avg Income
              </p>
            </div>
            <p className={`font-bold text-green-600 ${isMedium ? 'text-sm' : 'text-base'}`}>
              {formatCurrency(stats.avgIncome)}
            </p>
          </div>

          <div className={`rounded-lg transition-all duration-300 ${
            isMedium ? 'p-2 bg-red-50' : 'p-3 bg-gradient-to-br from-red-50 to-red-100'
          }`}>
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className={`text-red-600 ${isMedium ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <p className={`text-gray-600 font-medium ${isMedium ? 'text-xs' : 'text-sm'}`}>
                Avg Expense
              </p>
            </div>
            <p className={`font-bold text-red-600 ${isMedium ? 'text-sm' : 'text-base'}`}>
              {formatCurrency(stats.avgExpense)}
            </p>
          </div>

          {!isMedium && (
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 transition-all duration-300">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className={`h-4 w-4 ${
                  stats.trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
                <p className="text-sm text-gray-600 font-medium">Trend</p>
              </div>
              <p className={`text-base font-bold ${
                stats.trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="space-y-3">
        {/* Income & Expense Chart */}
        <div className="relative">
          <ResponsiveContainer 
            width="100%" 
            height={isCompact ? 180 : isMedium ? 200 : 220}
          >
            <AreaChart 
              data={displayData}
              onMouseMove={(state) => {
                if (state.isTooltipActive) {
                  setActiveIndex(state.activeTooltipIndex);
                } else {
                  setActiveIndex(null);
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: isCompact ? 10 : 11, fill: "#6B7280" }}
                angle={daysToShow > 10 ? -35 : 0}
                textAnchor={daysToShow > 10 ? "end" : "middle"}
                height={daysToShow > 10 ? 50 : 30}
              />
              <YAxis
                tickFormatter={(value) => `₹${value}`}
                tick={{ fontSize: isCompact ? 10 : 11, fill: "#6B7280" }}
                width={isCompact ? 50 : 60}
              />
              <Tooltip content={<CustomTooltip />} />
              {!isCompact && (
                <Legend
                  wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                  iconType="circle"
                  iconSize={8}
                />
              )}
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
                name="Income"
                dot={daysToShow <= 10 ? { fill: "#10B981", r: 3 } : false}
                activeDot={{ r: 5, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpense)"
                name="Expenses"
                dot={daysToShow <= 10 ? { fill: "#EF4444", r: 3 } : false}
                activeDot={{ r: 5, fill: "#EF4444", strokeWidth: 2, stroke: "#fff" }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Net Amount Chart */}
        <div className="relative pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className={`font-medium text-gray-600 ${isCompact ? 'text-xs' : 'text-sm'}`}>
              Net Amount
            </p>
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${
              stats.totalNet >= 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {formatCurrency(stats.totalNet)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={isCompact ? 120 : isMedium ? 140 : 150}>
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: isCompact ? 10 : 11, fill: "#6B7280" }}
                angle={daysToShow > 10 ? -35 : 0}
                textAnchor={daysToShow > 10 ? "end" : "middle"}
                height={daysToShow > 10 ? 50 : 30}
              />
              <YAxis 
                tickFormatter={(value) => `₹${value}`}
                tick={{ fontSize: isCompact ? 10 : 11, fill: "#6B7280" }}
                width={isCompact ? 50 : 60}
              />
              <Tooltip content={<CustomTooltip />} />
              {!isCompact && (
                <Legend
                  wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                  iconType="circle"
                  iconSize={8}
                />
              )}
              <Area
                type="monotone"
                dataKey="netAmount"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#netGradient)"
                fillOpacity={1}
                name="Net Amount"
                dot={daysToShow <= 10 ? { fill: "#3B82F6", r: 3 } : false}
                activeDot={{ r: 5, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compact View - Summary Stats */}
      {isCompact && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-gray-700">Income</span>
            </div>
            <span className="text-xs font-bold text-green-600">
              {formatCurrency(stats.avgIncome)}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-red-600" />
              <span className="text-xs font-medium text-gray-700">Expense</span>
            </div>
            <span className="text-xs font-bold text-red-600">
              {formatCurrency(stats.avgExpense)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SevenDayTrend;