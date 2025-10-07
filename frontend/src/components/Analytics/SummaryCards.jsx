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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="flex items-center">
              <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
              <div className="ml-3 flex-1">
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${colorClasses[card.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      textColorClasses[card.color]
                    }`}
                  >
                    {card.isCount ? card.value : formatCurrency(card.value)}
                  </p>
                </div>
              </div>

              {/* Change Indicator */}
              {card.change !== undefined && card.change !== null && (
                <div className="text-right">
                  <div
                    className={`text-xs font-medium ${
                      card.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {card.change >= 0 ? "+" : ""}
                    {card.change.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">vs last period</div>
                </div>
              )}
            </div>

            {/* Mini trend indicator */}
            {card.change !== undefined && card.change !== null && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${
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
