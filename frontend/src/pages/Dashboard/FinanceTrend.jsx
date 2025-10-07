import { useState, useRef, useEffect } from "react";
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
  GripVertical,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowLeftRight,
} from "lucide-react";

const SevenDayTrend = ({ trendData, formatCurrency, formatDate }) => {
  const [daysToShow, setDaysToShow] = useState(7);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startDays, setStartDays] = useState(7);
  const containerRef = useRef(null);

  const maxDays = Math.min(trendData.length, 30);
  const displayData = trendData.slice(-daysToShow);
  const isExpanded = daysToShow > 7;

  // Calculate stats
  const stats = {
    avgIncome:
      displayData.reduce((sum, d) => sum + d.income, 0) / displayData.length ||
      0,
    avgExpense:
      displayData.reduce((sum, d) => sum + d.expenses, 0) /
        displayData.length || 0,
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

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartDays(daysToShow);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaX = startX - e.clientX;
      const pixelsPerDay = 40;
      const daysDelta = Math.round(deltaX / pixelsPerDay);
      const newDays = Math.max(7, Math.min(maxDays, startDays + daysDelta));

      setDaysToShow(newDays);
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
  }, [isResizing, startX, startDays, maxDays]);

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
    <div
      ref={containerRef}
      className={`card h-full relative transition-all duration-700 ease-in-out ${
        isResizing ? "shadow-2xl ring-4 ring-blue-400 ring-opacity-50 z-10" : ""
      } ${isExpanded ? "shadow-xl" : ""}`}
      style={{
        gridColumn: isExpanded ? "1 / -1" : "auto",
        transform: isResizing ? "scale(1.01)" : "scale(1)",
      }}
    >
      {/* Resize Handle - Enhanced */}
      <div
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-ew-resize z-20 group transition-all duration-300 ${
          isHovering || isResizing
            ? "bg-gradient-to-r from-blue-500/10 to-transparent"
            : ""
        }`}
        title="Drag to show more days"
      >
        {/* Visual Handle */}
        <div
          className={`absolute left-1 h-16 w-1 bg-gray-300 rounded-full transition-all duration-300 ${
            isHovering || isResizing ? "bg-blue-500 w-1.5 h-20" : ""
          }`}
        />

        {/* Grip Icon */}
        <GripVertical
          className={`h-5 w-5 text-gray-400 absolute transition-all duration-300 ${
            isHovering || isResizing ? "text-blue-500 scale-125" : ""
          }`}
        />

        {/* Expand Indicator */}
        {(isHovering || isResizing) && (
          <div className="absolute left-8 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-slideIn flex items-center gap-1">
            <ArrowLeftRight className="h-3 w-3" />
            Drag to expand
          </div>
        )}
      </div>

      {/* Header */}
      <div
        className={`flex items-start justify-between mb-4 transition-all duration-500 ${
          isExpanded ? "pl-10" : "pl-8"
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {daysToShow}-Day Trend
            </h3>
            {isExpanded && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-fadeIn">
                Expanded View
              </span>
            )}
          </div>
          <p
            className={`text-xs transition-all duration-300 ${
              isResizing ? "text-blue-600 font-medium" : "text-gray-500"
            }`}
          >
            {isResizing
              ? "← Keep dragging left to see more data"
              : "Drag left edge to show more days"}
          </p>
        </div>

        {/* Stats Grid - Compact/Expanded */}
        <div
          className={`grid transition-all duration-500 ${
            isExpanded ? "grid-cols-3 gap-3" : "grid-cols-2 gap-2"
          }`}
        >
          <div
            className={`text-right transition-all duration-500 ${
              isExpanded ? "p-3 bg-green-50 rounded-lg" : ""
            }`}
          >
            <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
              <TrendingUp className="h-3 w-3" />
              Avg Income
            </p>
            <p className="text-sm font-bold text-green-600">
              {formatCurrency(stats.avgIncome)}
            </p>
          </div>
          <div
            className={`text-right transition-all duration-500 ${
              isExpanded ? "p-3 bg-red-50 rounded-lg" : ""
            }`}
          >
            <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
              <TrendingDown className="h-3 w-3" />
              Avg Expense
            </p>
            <p className="text-sm font-bold text-red-600">
              {formatCurrency(stats.avgExpense)}
            </p>
          </div>
          {isExpanded && (
            <div className="text-right p-3 bg-blue-50 rounded-lg animate-fadeIn">
              <p className="text-xs text-gray-500">Trend</p>
              <p
                className={`text-sm font-bold ${
                  stats.trend >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.trend >= 0 ? "+" : ""}
                {stats.trend.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className={`mb-4 transition-all duration-500 ${
          isExpanded ? "pl-10" : "pl-8"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isResizing
                  ? "bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_100%] animate-gradient"
                  : "bg-gradient-to-r from-blue-500 to-purple-500"
              }`}
              style={{ width: `${(daysToShow / maxDays) * 100}%` }}
            />
          </div>
          <span
            className={`text-xs font-medium min-w-[70px] text-right transition-all duration-300 ${
              isResizing ? "text-blue-600 scale-110" : "text-gray-600"
            }`}
          >
            {daysToShow}/{maxDays} days
          </span>
        </div>
      </div>

      {/* Main Chart */}
      <div
        className={`transition-all duration-500 ${
          isExpanded ? "pl-8" : "pl-6"
        }`}
      >
        <ResponsiveContainer width="100%" height={isExpanded ? 420 : 300}>
          <AreaChart data={displayData}>
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
              tick={{ fontSize: 11, fill: "#6B7280" }}
              angle={daysToShow > 15 ? -35 : 0}
              textAnchor={daysToShow > 15 ? "end" : "middle"}
              height={daysToShow > 15 ? 60 : 30}
            />
            <YAxis
              tickFormatter={(value) => `₹${value}`}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "15px" }}
              iconType="circle"
              iconSize={10}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorIncome)"
              name="Income"
              dot={daysToShow <= 15 ? { fill: "#10B981", r: 3 } : false}
              activeDot={{ r: 6, fill: "#10B981" }}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorExpense)"
              name="Expenses"
              dot={daysToShow <= 15 ? { fill: "#EF4444", r: 3 } : false}
              activeDot={{ r: 6, fill: "#EF4444" }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Net Amount Chart - Expanded View Only */}
      {isExpanded && (
        <div className="mt-6 pl-8 pt-6 border-t border-gray-200 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Net Amount Trend
            </h4>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                stats.totalNet >= 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              Total: {formatCurrency(stats.totalNet)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
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
                tick={{ fontSize: 11, fill: "#6B7280" }}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={(value) => `₹${value}`}
                tick={{ fontSize: 11, fill: "#6B7280" }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="netAmount"
                stroke="#6366F1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#netGradient)"
                name="Net Amount"
                dot={false}
                activeDot={{ r: 6, fill: "#6366F1" }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resize indicator overlay */}
      {isResizing && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none rounded-lg border-2 border-blue-400 border-dashed animate-pulse" />
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-gradient {
          animation: gradient 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SevenDayTrend;
