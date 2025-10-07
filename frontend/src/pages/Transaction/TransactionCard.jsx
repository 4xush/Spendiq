import { Edit, Trash2, ChevronRight } from "lucide-react";
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateValue = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`bg-white border rounded-lg p-3 cursor-pointer transition-all ${
        bulkSelectMode 
          ? isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300'
          : 'border-gray-200 hover:shadow-sm active:scale-[0.98]'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-2">
        {/* Selection Checkbox */}
        {bulkSelectMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect && onToggleSelect(transaction);
            }}
            className="mt-0.5"
          >
            {isSelected ? (
              <FaCheckSquare className="text-blue-600 text-base" />
            ) : (
              <FaSquare className="text-gray-400 text-base" />
            )}
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top Row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">
                {transaction.description || "No description"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-500">
                  {transaction.category}
                </p>
                {transaction.personToPerson && (
                  <>
                    <span className="text-gray-300">•</span>
                    <p className="text-xs text-blue-600 truncate">
                      {transaction.personToPerson.personName}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {/* Type Badge */}
            <span
              className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0 ${
                transaction.type === "income"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {transaction.type === "income" ? "In" : "Out"}
            </span>
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              {formatDate ? formatDate(transaction.date) : formatDateValue(transaction.date)}
            </p>
            
            <div className="flex items-center gap-2">
              {/* Amount */}
              <p
                className={`font-semibold text-sm ${
                  transaction.type === "income" ? "text-green-600" : "text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency ? formatCurrency(transaction.amount) : formatCurrencyValue(transaction.amount)}
              </p>
              
              {/* Action Buttons */}
              {!bulkSelectMode && (
                <div className="flex items-center gap-1">
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
              )}
            </div>
          </div>
        </div>

        {/* View Details Arrow - Only when not in bulk mode */}
        {!bulkSelectMode && (
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
        )}
      </div>
    </div>
  );
};

export default TransactionCard;
