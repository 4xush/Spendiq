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
import { TrendingUp, TrendingDown, BarChart3, ChevronDown } from "lucide-react";

const TrendChart = ({ trendData, formatCurrency, loading = false }) => {
  const [chartType, setChartType] = useState("area");
  const [dayFilter, setDayFilter] = useState(30);
  const [visibleLines, setVisibleLines] = useState({
    income: true,
    expenses: true,
    netAmount: true,
  });

  // Filter data based on selected days
  const getFilteredData = () => {
    if (!trendData || trendData.length === 0) return [];

    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - dayFilter);

    return trendData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  };

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="h-4 bg-gray-200 rounded mb-4 w-32 animate-pulse"></div>
        <div className="h-64 sm:h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!trendData || trendData.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Trend Analysis
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-sm">No trend data available</p>
            <p className="text-xs text-gray-400">Add transactions to see trends</p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Trend Analysis
          </h3>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-sm">No data for last {dayFilter} days</p>
            <p className="text-xs text-gray-400">Try a different period</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-sm mb-2">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs">{entry.name}:</span>
              </div>
              <span className="font-medium text-xs">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const toggleLine = (lineKey) => {
    setVisibleLines((prev) => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }));
  };

  const lineConfig = {
    income: { color: "#10B981", name: "Income", icon: TrendingUp },
    expenses: { color: "#EF4444", name: "Expenses", icon: TrendingDown },
    netAmount: { color: "#3B82F6", name: "Net Amount", icon: BarChart3 },
  };

  const totalIncome = filteredData.reduce((sum, item) => sum + (item.income || 0), 0);
  const totalExpenses = filteredData.reduce((sum, item) => sum + (item.expenses || 0), 0);
  const avgDaily = {
    income: totalIncome / filteredData.length,
    expenses: totalExpenses / filteredData.length,
    netAmount: (totalIncome - totalExpenses) / filteredData.length,
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Trend Analysis
        </h3>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Selector */}
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(parseInt(e.target.value))}
            className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 sm:flex-none"
          >
            <option value={7}>7d</option>
            <option value={14}>14d</option>
            <option value={30}>30d</option>
            <option value={60}>60d</option>
            <option value={90}>90d</option>
            <option value={365}>1y</option>
          </select>

          {/* Chart Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
                chartType === "line"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
                chartType === "area"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Area
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {Object.entries(lineConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div
              key={key}
              className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-center mb-1">
                <Icon
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  style={{ color: config.color }}
                />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-0.5 truncate">
                {config.name}
              </p>
              <p
                className="text-sm sm:text-base font-bold truncate"
                style={{ color: config.color }}
              >
                {formatCurrency(avgDaily[key])}
              </p>
              <p className="text-[9px] sm:text-xs text-gray-500">avg/day</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                tick={{ fontSize: 10 }}
                width={50}
              />
              <Tooltip content={customTooltip} />
              {Object.entries(lineConfig).map(([key, config]) =>
                visibleLines[key] ? (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={config.color}
                    strokeWidth={2}
                    name={config.name}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ) : null
              )}
            </LineChart>
          ) : (
            <AreaChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                tick={{ fontSize: 10 }}
                width={50}
              />
              <Tooltip content={customTooltip} />
              {Object.entries(lineConfig).map(([key, config]) =>
                visibleLines[key] ? (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={config.color}
                    fill={config.color}
                    fillOpacity={0.6}
                    name={config.name}
                  />
                ) : null
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend with Toggle */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {Object.entries(lineConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => toggleLine(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                visibleLines[key]
                  ? "bg-gray-100 opacity-100"
                  : "opacity-40 hover:opacity-60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
              <span className="text-xs sm:text-sm font-medium">{config.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrendChart;
