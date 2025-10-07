import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Eye, EyeOff, Lightbulb } from "lucide-react";

const COLORS = [
  "#6366F1",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#84CC16",
  "#F97316",
  "#3B82F6",
  "#A855F7",
  "#14B8A6",
];

const CategoryChart = ({ categoryData, formatCurrency, loading = false }) => {
  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  const [activeIndex, setActiveIndex] = useState(null);
  const [showCenterHint, setShowCenterHint] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="h-6 bg-gray-100 rounded-lg mb-6 w-48 animate-pulse"></div>
        <div className="h-96 bg-gray-50 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Spending by Category
        </h3>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
            </div>
            <p className="text-gray-900 font-medium mb-1">
              No category data yet
            </p>
            <p className="text-sm text-gray-500">
              Add transactions to see spending insights
            </p>
          </div>
        </div>
      </div>
    );
  }

  const visibleData = categoryData.filter(
    (item) => !hiddenCategories.has(item.category)
  );

  // Recalculate percentages for visible data only and preserve original indices
  const visibleTotal = visibleData.reduce((sum, item) => sum + item.amount, 0);
  const recalculatedVisibleData = visibleData.map((item) => {
    // Find the original index of this category in the full array
    const originalIndex = categoryData.findIndex(
      (cat) => cat.category === item.category
    );
    return {
      ...item,
      originalIndex, // Preserve original index for consistent color mapping
      percentage:
        visibleTotal > 0 ? ((item.amount / visibleTotal) * 100).toFixed(2) : 0,
    };
  });

  const toggleCategory = (category) => {
    const newHidden = new Set(hiddenCategories);
    if (newHidden.has(category)) {
      newHidden.delete(category);
    } else {
      newHidden.add(category);
    }
    setHiddenCategories(newHidden);
  };

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl">
          <p className="font-semibold text-gray-900 mb-2">{data.category}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-8">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(data.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-8">
              <span className="text-sm text-gray-500">Share</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.percentage}%
              </span>
            </div>
            <div className="flex justify-between items-center gap-8">
              <span className="text-sm text-gray-500">Count</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.count}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
    category,
  }) => {
    const numericPercentage = parseFloat(percentage) || 0;
    if (numericPercentage < 5) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${numericPercentage.toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Spending by Category
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {visibleData.length} of {categoryData.length} categories shown
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">Total Visible</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(visibleTotal)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pie Chart */}
        <div className="lg:col-span-2 relative">
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie
                data={recalculatedVisibleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="amount"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {recalculatedVisibleData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.originalIndex}`}
                    fill={COLORS[entry.originalIndex % COLORS.length]}
                    stroke={activeIndex === index ? "#1F2937" : "white"}
                    strokeWidth={activeIndex === index ? 3 : 2}
                  />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Hover Info */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "120px",
              height: "120px",
            }}
          >
            <div
              className="pointer-events-auto cursor-pointer w-full h-full rounded-full flex items-center justify-center transition-all duration-200"
              onMouseEnter={() => setShowCenterHint(true)}
              onMouseLeave={() => setShowCenterHint(false)}
            >
              {showCenterHint ? (
                <div className="text-center px-4 animate-in fade-in duration-200">
                  <Lightbulb className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-600 leading-tight">
                    Hover segments for details
                  </p>
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
              )}
            </div>
          </div>
        </div>

        {/* Legend with Toggle */}
        <div>
          <div
            className="max-h-80 overflow-y-auto space-y-1.5 pr-1"
            style={{ scrollbarWidth: "thin" }}
          >
            {categoryData.map((item, index) => {
              const isHidden = hiddenCategories.has(item.category);
              return (
                <div
                  key={item.category}
                  className={`group flex items-center justify-between p-2 lg:p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    isHidden
                      ? "bg-gray-50 opacity-60 hover:opacity-80"
                      : "bg-gray-50 hover:bg-gray-100 hover:shadow-sm"
                  }`}
                  onClick={() => toggleCategory(item.category)}
                >
                  <div className="flex items-center flex-1 min-w-0 mr-2">
                    <div
                      className="w-2.5 h-2.5 lg:w-2 lg:h-2 rounded-full mr-2 lg:mr-2.5 flex-shrink-0 transition-all duration-200"
                      style={{
                        backgroundColor: isHidden
                          ? "#D1D5DB"
                          : COLORS[index % COLORS.length],
                        boxShadow: isHidden
                          ? "none"
                          : `0 0 0 3px ${COLORS[index % COLORS.length]}20`,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs lg:text-[11px] font-medium truncate transition-colors ${
                          isHidden ? "text-gray-400" : "text-gray-900"
                        }`}
                      >
                        {item.category}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p
                          className={`text-[10px] lg:text-[10px] font-semibold transition-colors ${
                            isHidden ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    className={`ml-1.5 transition-colors ${
                      isHidden
                        ? "text-gray-300"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  >
                    {isHidden ? (
                      <EyeOff className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                    ) : (
                      <Eye className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryChart;
