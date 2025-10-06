import { Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";

const RecentTransactions = ({
  recentTransactions,
  formatCurrency,
  formatDate,
}) => {
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Transactions
        </h3>
        <Link
          to="/transactions"
          className="text-primary-600 hover:text-primary-500 text-sm font-medium"
        >
          View all
        </Link>
      </div>

      {recentTransactions.length > 0 ? (
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div
                  className={`p-2 rounded-lg ${
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
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.description || transaction.category}
                  </p>
                  <p className="text-xs text-gray-500">
                    {transaction.category} • {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-medium ${
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
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No transactions yet</p>
          <Link
            to="/transactions"
            className="text-primary-600 hover:text-primary-500 text-sm"
          >
            Add your first transaction
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
