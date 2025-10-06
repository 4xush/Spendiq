import { Edit, Trash2 } from "lucide-react";

const TransactionTable = ({
  transactions,
  formatCurrency,
  formatDate,
  onRowClick,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="hidden md:block">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-700">
              Date
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">
              Description
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">
              Category
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">
              Type
            </th>
            <th className="text-right py-3 px-4 font-medium text-gray-700">
              Amount
            </th>
            <th className="text-right py-3 px-4 font-medium text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr
              key={transaction._id}
              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => onRowClick(transaction)}
            >
              <td className="py-3 px-4 text-sm text-gray-600">
                {formatDate(transaction.date)}
              </td>
              <td className="py-3 px-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.description || "No description"}
                  </p>
                  {transaction.metadata?.merchant && (
                    <p className="text-xs text-gray-500">
                      {transaction.metadata.merchant}
                    </p>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">
                {transaction.category}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    transaction.type === "income"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {transaction.type}
                </span>
              </td>
              <td
                className={`py-3 px-4 text-right font-medium ${
                  transaction.type === "income"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end space-x-2">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
