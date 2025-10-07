import { Receipt, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const RecentTransactionsMobile = ({
  recentTransactions,
  formatCurrency,
  formatDate,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Transactions
        </h3>
        <Link
          to="/transactions"
          className="text-blue-600 text-sm font-medium flex items-center"
        >
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {recentTransactions.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {recentTransactions.map((transaction, index) => (
            <div
              key={transaction._id}
              className={`p-4 ${index === 0 ? '' : ''} hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <div
                    className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                      transaction.type === "income"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUpRight
                        className={`h-4 w-4 ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      />
                    ) : (
                      <ArrowDownRight
                        className={`h-4 w-4 ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.description || transaction.category}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {transaction.category}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p
                    className={`text-sm font-semibold ${
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
              
              {/* Source indicator for AI-processed transactions */}
              {transaction.source && transaction.source !== 'manual' && (
                <div className="mt-2 flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    📷 {transaction.source}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">No transactions yet</p>
          <Link
            to="/transactions"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Add your first transaction
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentTransactionsMobile;