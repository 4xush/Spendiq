import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  TrendingDown,
  Percent,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

const P2P_COLORS = {
  lent: "#10B981",
  borrowed: "#EF4444",
  gift_given: "#F59E0B",
  gift_received: "#8B5CF6",
  payment: "#3B82F6",
  reimbursement: "#EC4899",
};

const SpendingAndP2POverview = ({
  categoryData,
  formatCurrency,
  width = 50,
  p2pSummary,
  recentP2P,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const totalAmount = categoryData.reduce((sum, item) => sum + item.amount, 0);
  const isCompact = width < 25;
  const isMedium = width >= 25 && width < 36;
  const showLabels = width >= 30;

  // Process P2P data for visualization
  const getP2PChartData = () => {
    if (!p2pSummary?.breakdown) return [];

    return p2pSummary.breakdown
      .map((item) => ({
        type: item._id.replace("_", " ").toUpperCase(),
        amount: item.totalAmount,
        count: item.count,
        pendingAmount: item.pendingAmount,
        fill: P2P_COLORS[item._id] || "#6B7280",
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const p2pChartData = getP2PChartData();
  const p2pTotal = p2pChartData.reduce((sum, item) => sum + item.amount, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-200 backdrop-blur-sm"
          style={{
            position: "relative",
            zIndex: 9999,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.fill }}
            />
            <p className="text-sm font-semibold text-gray-900">
              {data.category || data.type}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-600">Amount:</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(data.amount)}
              </span>
            </div>
            {data.percentage && (
              <div className="flex justify-between gap-4">
                <span className="text-xs text-gray-600">Percentage:</span>
                <span className="text-sm font-bold text-blue-600">
                  {data.percentage}%
                </span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-600">Count:</span>
              <span className="text-sm font-bold text-gray-700">
                {data.count} transactions
              </span>
            </div>
            {data.pendingAmount > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-xs text-gray-600">Pending:</span>
                <span className="text-sm font-bold text-orange-600">
                  {formatCurrency(data.pendingAmount)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
    setHoveredSlice(categoryData[index]);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
    setHoveredSlice(null);
  };

  const renderCustomLabel = (entry) => {
    if (!showLabels) return null;

    const RADIAN = Math.PI / 180;
    const radius = isCompact ? 75 : isMedium ? 85 : 95;
    const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
    const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);

    const sliceColor = entry.fill || COLORS[entry.index % COLORS.length];

    return (
      <text
        x={x}
        y={y}
        fill={sliceColor}
        textAnchor={x > entry.cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        <tspan x={x} dy="-0.2em" className="text-xs font-bold">
          {entry.category}
        </tspan>
        <tspan x={x} dy="1.2em" className="text-xs" style={{ opacity: 0.8 }}>
          {formatCurrency(entry.amount)}
        </tspan>
      </text>
    );
  };

  if (categoryData.length === 0 && p2pChartData.length === 0) {
    return (
      <div className="card h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Spending & P2P Overview
        </h3>
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-gray-200 flex items-center justify-center">
              <TrendingDown className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <p className="mt-4 font-medium">No data available</p>
          <p className="text-sm text-gray-400 mt-1">
            Start tracking your expenses and P2P transactions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full transition-all duration-300 ease-out">
      <style>{`
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
          animation: fadeIn 0.3s ease-out;
        }
        .recharts-tooltip-wrapper {
          z-index: 9999 !important;
          pointer-events: none;
        }
        .recharts-wrapper {
          position: relative;
          z-index: 10;
        }
      `}</style>

      {/* Header */}
      <div
        className={`flex items-center justify-between mb-4 transition-all duration-300 ${
          isCompact ? "flex-col items-start gap-2" : ""
        }`}
      >
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-gray-900 transition-all duration-300 ${
              isCompact ? "text-base" : "text-lg"
            }`}
          >
            {isCompact ? "Overview" : "Spending & P2P Overview"}
          </h3>
        </div>
        {!isCompact && (
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <Percent className="h-5 w-5 text-purple-600" />
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Upper Half - Spending by Category */}
        {categoryData.length > 0 && (
          <div className="relative" style={{ isolation: "isolate" }}>
            <div className="mb-3">
              <h4
                className={`font-medium text-gray-800 ${
                  isCompact ? "text-sm" : "text-base"
                }`}
              >
                Spending by Category
              </h4>
              <p className="text-xs text-gray-500">
                Total: {formatCurrency(totalAmount)}
              </p>
            </div>

            <ResponsiveContainer
              width="100%"
              height={isCompact ? 160 : isMedium ? 180 : 200}
            >
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isCompact ? 35 : isMedium ? 40 : 45}
                  outerRadius={isCompact ? 55 : isMedium ? 65 : 75}
                  fill="#8884d8"
                  dataKey="amount"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  animationBegin={0}
                  animationDuration={800}
                  label={showLabels ? renderCustomLabel : false}
                  labelLine={showLabels}
                  outerLabel={true}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      opacity={
                        activeIndex === null || activeIndex === index ? 1 : 0.3
                      }
                      style={{
                        filter:
                          activeIndex === index
                            ? "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                            : "none",
                        transform:
                          activeIndex === index ? "scale(1.05)" : "scale(1)",
                        transformOrigin: "center",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={{ zIndex: 9999 }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Circle for Spending */}
            <div
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none"
            style={{ zIndex: 1 }}
            >
            <div className="flex flex-col items-center gap-1 animate-fadeIn mt-10">
                <svg className="w-4 h-4 text-gray-400 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Hover
                </p>
                <p className="text-[9px] text-gray-400 opacity-70">
                for details
                </p>
            </div>
            </div>
          </div>
        )}

        {/* Lower Half - P2P Overview */}
        {p2pChartData.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4
                  className={`font-medium text-gray-800 ${
                    isCompact ? "text-sm" : "text-base"
                  }`}
                >
                  P2P Transactions
                </h4>
                <p className="text-xs text-gray-500">
                  Total: {formatCurrency(p2pTotal)}
                </p>
              </div>
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>

            <ResponsiveContainer
              width="100%"
              height={isCompact ? 120 : isMedium ? 140 : 160}
            >
              <BarChart
                data={p2pChartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="type"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[2, 2, 0, 0]} fill="#3B82F6">
                  {p2pChartData.map((entry, index) => (
                    <Cell key={`p2p-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* P2P Quick Stats */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <div>
                    <p className="text-xs text-green-700 font-medium">Lent</p>
                    <p className="text-sm font-bold text-green-800">
                      {formatCurrency(p2pSummary?.totalLent || 0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-2 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <ArrowDownLeft className="h-3 w-3 text-red-600 mr-1" />
                  <div>
                    <p className="text-xs text-red-700 font-medium">Borrowed</p>
                    <p className="text-sm font-bold text-red-800">
                      {formatCurrency(p2pSummary?.totalBorrowed || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingAndP2POverview;
