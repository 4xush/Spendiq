import { Edit, Trash2 } from "lucide-react";
import { FaCheckSquare, FaSquare } from 'react-icons/fa';

const TransactionTable = ({
  transactions,
  formatCurrency,
  formatDate,
  onRowClick,
  onEdit,
  onDelete,
  onViewDetails,
  selectedTransactions = [],
  onToggleSelect,
  bulkSelectMode = false
}) => {
  
  const handleRowClick = (transaction) => {
    if (bulkSelectMode) {
      onToggleSelect && onToggleSelect(transaction);
    } else {
      onRowClick ? onRowClick(transaction) : onViewDetails && onViewDetails(transaction);
    }
  };

  const isSelected = (transaction) => {
    return selectedTransactions.some(t => t._id === transaction._id);
  };

  const formatCurrencyValue = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDateValue = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr className="border-b border-gray-200">
            {bulkSelectMode && (
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-12">
                <FaCheckSquare className="text-gray-400" />
              </th>
            )}
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
            {!bulkSelectMode && (
              <th className="text-right py-3 px-4 font-medium text-gray-700">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr
              key={transaction._id}
              className={`border-b border-gray-100 cursor-pointer transition-colors ${
                bulkSelectMode && isSelected(transaction)
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleRowClick(transaction)}
            >
              {bulkSelectMode && (
                <td className="py-3 px-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect && onToggleSelect(transaction);
                    }}
                    className="text-lg"
                  >
                    {isSelected(transaction) ? (
                      <FaCheckSquare className="text-blue-600" />
                    ) : (
                      <FaSquare className="text-gray-400" />
                    )}
                  </button>
                </td>
              )}
              
              <td className="py-3 px-4 text-sm text-gray-600">
                {formatDate ? formatDate(transaction.date) : formatDateValue(transaction.date)}
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
                  {transaction.personToPerson && (
                    <p className="text-xs text-blue-600">
                      {transaction.personToPerson.type} - {transaction.personToPerson.personName}
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
                {formatCurrency ? formatCurrency(transaction.amount) : formatCurrencyValue(transaction.amount)}
              </td>
              
              {!bulkSelectMode && (
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit && onEdit(transaction);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit transaction"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete && onDelete(transaction);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No transactions found
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
