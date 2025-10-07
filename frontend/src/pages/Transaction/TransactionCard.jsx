import { Edit, Trash2 } from "lucide-react";
import { FaCheckSquare, FaSquare } from 'react-icons/fa';

const TransactionCard = ({
  transaction,
  formatCurrency,
  formatDate,
  onClick,
  onEdit,
  onDelete,
  onViewDetails,
  isSelected = false,
  onToggleSelect,
  bulkSelectMode = false
}) => {
  
  const handleCardClick = (e) => {
    if (bulkSelectMode) {
      e.preventDefault();
      onToggleSelect && onToggleSelect(transaction);
    } else {
      onClick ? onClick(transaction) : onViewDetails && onViewDetails(transaction);
    }
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
    <div
      className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
        bulkSelectMode 
          ? isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-gray-300'
          : 'border-gray-200 hover:bg-gray-50'
      }`}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox */}
      {bulkSelectMode && (
        <div className="flex items-center mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect && onToggleSelect(transaction);
            }}
            className="text-lg"
          >
            {isSelected ? (
              <FaCheckSquare className="text-blue-600" />
            ) : (
              <FaSquare className="text-gray-400" />
            )}
          </button>
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-medium text-gray-900 truncate">
            {transaction.description || "No description"}
          </p>
          <p className="text-sm text-gray-500">{transaction.category}</p>
        </div>
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ml-2 ${
            transaction.type === "income"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {transaction.type}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {formatDate ? formatDate(transaction.date) : formatDateValue(transaction.date)}
        </p>
        <div className="flex items-center space-x-3">
          <p
            className={`font-medium ${
              transaction.type === "income" ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.type === "income" ? "+" : "-"}
            {formatCurrency ? formatCurrency(transaction.amount) : formatCurrencyValue(transaction.amount)}
          </p>
          
          {/* Action Buttons - Only show when not in bulk select mode */}
          {!bulkSelectMode && (
            <div className="flex items-center space-x-1">
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
          )}
        </div>
      </div>

      {/* Additional Info for P2P transactions */}
      {transaction.personToPerson && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            {transaction.personToPerson.type} - {transaction.personToPerson.personName}
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
