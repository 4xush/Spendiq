import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingDown, Percent } from "lucide-react";

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

const SpendingByCategory = ({ categoryData, formatCurrency, width = 50 }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const totalAmount = categoryData.reduce((sum, item) => sum + item.amount, 0);
  const isCompact = width < 25;
  const isMedium = width >= 25 && width < 36;
  const showLabels = width >= 30;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-200 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.fill }}
            />
            <p className="text-sm font-semibold text-gray-900">
              {data.category}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-600">Amount:</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(data.amount)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-600">Percentage:</span>
              <span className="text-sm font-bold text-blue-600">
                {data.percentage}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-600">Count:</span>
              <span className="text-sm font-bold text-gray-700">
                {data.count} transactions
              </span>
            </div>
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
    
    return (
      <text
        x={entry.x}
        y={entry.y}
        fill="#374151"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        <tspan x={entry.x} dy="-0.2em" className="text-xs font-semibold">
          {entry.category}
        </tspan>
        <tspan x={entry.x} dy="1.2em" className="text-xs text-gray-600">
          {formatCurrency(entry.amount)}
        </tspan>
      </text>
    );
  };

  if (categoryData.length === 0) {
    return (
      <div className="card h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Spending by Category
        </h3>
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-gray-200 flex items-center justify-center">
              <TrendingDown className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <p className="mt-4 font-medium">No spending data available</p>
          <p className="text-sm text-gray-400 mt-1">Start tracking your expenses</p>
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
            {isCompact ? "Spending" : "Spending by Category"}
          </h3>
          {!isCompact && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              Total: {formatCurrency(totalAmount)}
            </p>
          )}
        </div>
        {!isCompact && (
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <Percent className="h-5 w-5 text-purple-600" />
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative">
        <ResponsiveContainer
          width="100%"
          height={isCompact ? 200 : isMedium ? 240 : 280}
        >
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={isCompact ? 45 : isMedium ? 55 : 65}
              outerRadius={isCompact ? 70 : isMedium ? 80 : 90}
              fill="#8884d8"
              dataKey="amount"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationBegin={0}
              animationDuration={800}
              label={showLabels ? renderCustomLabel : false}
              labelLine={showLabels}
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
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Interactive Circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center transition-all duration-300">
            {hoveredSlice ? (
              <div className="animate-fadeIn">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: COLORS[activeIndex % COLORS.length] }}
                />
                <p className={`font-bold text-gray-900 ${isCompact ? 'text-sm' : 'text-base'}`}>
                  {formatCurrency(hoveredSlice.amount)}
                </p>
                <p className={`text-gray-600 font-medium mt-1 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                  {hoveredSlice.category}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {hoveredSlice.percentage}% of total
                </p>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Spending</p>
                <p className={`font-bold text-gray-900 ${isCompact ? 'text-base' : 'text-xl'}`}>
                  {formatCurrency(totalAmount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {categoryData.length} {categoryData.length === 1 ? 'category' : 'categories'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category List - Adaptive */}
      {!isCompact && (
        <div
          className={`mt-2 space-y-1 overflow-y-auto transition-all duration-300 ${
            isMedium ? "max-h-44" : "max-h-48"
          }`}
        >
          {categoryData.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between rounded-lg transition-all duration-300 cursor-pointer ${
                isMedium ? "p-1.5" : "p-2"
              } ${
                activeIndex === index
                  ? "bg-gradient-to-r from-gray-100 to-gray-50 shadow-md scale-[1.02]"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className={`rounded-full flex-shrink-0 transition-transform duration-300 ${
                    isMedium ? "w-2 h-2" : "w-2.5 h-2.5"
                  }`}
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                    transform:
                      activeIndex === index ? "scale(1.2)" : "scale(1)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-gray-900 truncate ${
                      isMedium ? "text-xs" : "text-sm"
                    }`}
                  >
                    {item.category}
                  </p>
                  {!isMedium && (
                    <p className="text-xs text-gray-500">
                      {item.count} transaction{item.count !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p
                  className={`font-bold text-gray-900 ${
                    isMedium ? "text-xs" : "text-sm"
                  }`}
                >
                  {formatCurrency(item.amount)}
                </p>
                <p className="text-xs text-gray-500">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats - Show for larger widths */}
      {!isCompact && !isMedium && (
        <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 transition-all duration-300">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">Top Category</p>
            <p className="text-sm font-bold text-blue-600 truncate">
              {categoryData[0]?.category}
            </p>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600">Categories</p>
            <p className="text-sm font-bold text-purple-600">
              {categoryData.length}
            </p>
          </div>
        </div>
      )}

      {/* Compact State - Show simplified list */}
      {isCompact && (
        <div className="mt-3 space-y-2">
          {categoryData.slice(0, 3).map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <p className="text-xs font-medium text-gray-900 truncate">
                  {item.category}
                </p>
              </div>
              <p className="text-xs font-bold text-gray-900 ml-2">
                {item.percentage}%
              </p>
            </div>
          ))}
          {categoryData.length > 3 && (
            <p className="text-xs text-gray-500 text-center pt-1">
              +{categoryData.length - 3} more categories
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SpendingByCategory;