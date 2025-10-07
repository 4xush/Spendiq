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
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

const TrendChart = ({ trendData, formatCurrency, loading = false }) => {
  const [chartType, setChartType] = useState("line"); // line or area
  const [visibleLines, setVisibleLines] = useState({
    income: true,
    expenses: true,
    netAmount: true,
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="h-6 bg-gray-200 rounded mb-4 w-48 animate-pulse"></div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!trendData || trendData.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Income vs Expenses Trend
        </h3>
        <div className="flex items-center justify-center h-80 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <p>No trend data available</p>
            <p className="text-sm">Add transactions over time to see trends</p>
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
          <p className="font-medium mb-2">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between space-x-4"
            >
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">{entry.name}:</span>
              </div>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
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

  const totalIncome = trendData.reduce(
    (sum, item) => sum + (item.income || 0),
    0
  );
  const totalExpenses = trendData.reduce(
    (sum, item) => sum + (item.expenses || 0),
    0
  );
  const avgDaily = {
    income: totalIncome / trendData.length,
    expenses: totalExpenses / trendData.length,
    netAmount: (totalIncome - totalExpenses) / trendData.length,
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Income vs Expenses Trend
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChartType("line")}
            className={`px-3 py-1 rounded text-sm ${
              chartType === "line"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType("area")}
            className={`px-3 py-1 rounded text-sm ${
              chartType === "area"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Area
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(lineConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Icon
                  className="h-4 w-4 mr-1"
                  style={{ color: config.color }}
                />
                <span className="text-sm font-medium">{config.name}</span>
              </div>
              <p className="text-lg font-bold" style={{ color: config.color }}>
                {formatCurrency(avgDaily[key])}
              </p>
              <p className="text-xs text-gray-500">Daily Average</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `₹${value}`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={customTooltip} />
              <Legend />
              {Object.entries(lineConfig).map(([key, config]) =>
                visibleLines[key] ? (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={config.color}
                    strokeWidth={2}
                    name={config.name}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ) : null
              )}
            </LineChart>
          ) : (
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `₹${value}`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={customTooltip} />
              <Legend />
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
      <div className="flex items-center justify-center space-x-6 mt-4">
        {Object.entries(lineConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => toggleLine(key)}
              className={`flex items-center space-x-2 px-3 py-1 rounded transition-opacity ${
                visibleLines[key] ? "opacity-100" : "opacity-50"
              }`}
            >
              <Icon className="h-4 w-4" style={{ color: config.color }} />
              <span className="text-sm font-medium">{config.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrendChart;
