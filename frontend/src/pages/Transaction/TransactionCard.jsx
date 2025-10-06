import { Edit, Trash2 } from "lucide-react";

const TransactionCard = ({
  transaction,
  formatCurrency,
  formatDate,
  onClick,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
      onClick={() => onClick(transaction)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium text-gray-900">
            {transaction.description || "No description"}
          </p>
          <p className="text-sm text-gray-500">{transaction.category}</p>
        </div>
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            transaction.type === "income"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {transaction.type}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
        <div className="flex items-center space-x-3">
          <p
            className={`font-medium ${
              transaction.type === "income" ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.type === "income" ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </p>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(transaction);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit transaction"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(transaction);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete transaction"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
