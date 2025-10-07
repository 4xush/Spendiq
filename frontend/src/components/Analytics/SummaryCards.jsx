import { TrendingUp, TrendingDown, IndianRupee, Calendar } from "lucide-react";

const SummaryCards = ({ summary, formatCurrency, loading = false }) => {
  const cards = [
    {
      title: "Total Income",
      value: summary?.totalIncome || 0,
      icon: TrendingUp,
      color: "green",
      change: summary?.incomeChange,
    },
    {
      title: "Total Expenses",
      value: summary?.totalExpenses || 0,
      icon: TrendingDown,
      color: "red",
      change: summary?.expenseChange,
    },
    {
      title: "Net Amount",
      value: summary?.netAmount || 0,
      icon: IndianRupee,
      color: (summary?.netAmount || 0) >= 0 ? "green" : "red",
      change: summary?.netChange,
    },
    {
      title: "Transactions",
      value: summary?.totalTransactions || 0,
      icon: Calendar,
      color: "purple",
      change: summary?.transactionChange,
      isCount: true,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-3 sm:p-4 animate-pulse">
            <div className="flex flex-col">
              <div className="p-2 bg-gray-200 rounded-lg w-8 h-8 sm:w-10 sm:h-10 mb-2"></div>
              <div className="h-2.5 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-5 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const colorClasses = {
          green: "bg-green-100 text-green-600",
          red: "bg-red-100 text-red-600",
          blue: "bg-blue-100 text-blue-600",
          purple: "bg-purple-100 text-purple-600",
        };

        const textColorClasses = {
          green: "text-green-600",
          red: "text-red-600",
          blue: "text-blue-600",
          purple: "text-purple-600",
        };

        return (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            {/* Icon */}
            <div className={`p-2 rounded-lg ${colorClasses[card.color]} inline-flex mb-2 sm:mb-3`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            {/* Title */}
            <p className="text-[10px] sm:text-xs font-medium text-gray-600 mb-1">
              {card.title}
            </p>

            {/* Value */}
            <p className={`text-base sm:text-xl font-bold ${textColorClasses[card.color]} truncate`}>
              {card.isCount ? card.value.toLocaleString() : formatCurrency(card.value)}
            </p>

            {/* Change Indicator */}
            {card.change !== undefined && card.change !== null && (
              <div className="mt-2 sm:mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] sm:text-xs font-semibold ${
                      card.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {card.change >= 0 ? "↑" : "↓"} {Math.abs(card.change).toFixed(1)}%
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-gray-500">vs last</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all ${
                      card.change >= 0 ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(Math.abs(card.change), 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
