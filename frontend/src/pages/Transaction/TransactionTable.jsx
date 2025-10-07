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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateValue = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {bulkSelectMode && (
              <th className="text-left py-2 px-3 font-medium text-xs text-gray-600 w-10">
                <FaCheckSquare className="text-gray-400 text-sm" />
              </th>
            )}
            <th className="text-left py-2 px-3 font-medium text-xs text-gray-600">
              Date
            </th>
            <th className="text-left py-2 px-3 font-medium text-xs text-gray-600">
              Description
            </th>
            <th className="text-left py-2 px-3 font-medium text-xs text-gray-600 hidden md:table-cell">
              Category
            </th>
            <th className="text-left py-2 px-3 font-medium text-xs text-gray-600 hidden sm:table-cell">
              Type
            </th>
            <th className="text-right py-2 px-3 font-medium text-xs text-gray-600">
              Amount
            </th>
            {!bulkSelectMode && (
              <th className="text-right py-2 px-3 font-medium text-xs text-gray-600 w-20">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr
              key={transaction._id}
              className={`border-b border-gray-100 cursor-pointer transition-colors ${
                bulkSelectMode && isSelected(transaction)
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50 active:bg-gray-100'
              } ${index === transactions.length - 1 ? 'border-b-0' : ''}`}
              onClick={() => handleRowClick(transaction)}
            >
              {bulkSelectMode && (
                <td className="py-2 px-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect && onToggleSelect(transaction);
                    }}
                  >
                    {isSelected(transaction) ? (
                      <FaCheckSquare className="text-blue-600 text-sm" />
                    ) : (
                      <FaSquare className="text-gray-400 text-sm" />
                    )}
                  </button>
                </td>
              )}
              
              <td className="py-2 px-3 text-xs text-gray-600 whitespace-nowrap">
                {formatDate ? formatDate(transaction.date) : formatDateValue(transaction.date)}
              </td>
              
              <td className="py-2 px-3">
                <div className="max-w-[200px]">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {transaction.description || "No description"}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {/* Show category on mobile in description */}
                    <p className="text-xs text-gray-500 md:hidden">
                      {transaction.category}
                    </p>
                    {transaction.personToPerson && (
                      <>
                        <span className="text-gray-300 text-xs md:hidden">•</span>
                        <p className="text-xs text-blue-600 truncate">
                          {transaction.personToPerson.personName}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </td>
              
              <td className="py-2 px-3 text-xs text-gray-600 hidden md:table-cell">
                {transaction.category}
              </td>
              
              <td className="py-2 px-3 hidden sm:table-cell">
                <span
                  className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                    transaction.type === "income"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {transaction.type === "income" ? "In" : "Out"}
                </span>
              </td>
              
              <td
                className={`py-2 px-3 text-right font-semibold text-sm whitespace-nowrap ${
                  transaction.type === "income"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency ? formatCurrency(transaction.amount) : formatCurrencyValue(transaction.amount)}
              </td>
              
              {!bulkSelectMode && (
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit && onEdit(transaction);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete && onDelete(transaction);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {transactions.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          No transactions found
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
