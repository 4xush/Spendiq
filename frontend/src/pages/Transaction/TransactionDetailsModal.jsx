import { Edit } from "lucide-react";

const TransactionDetailsModal = ({
  show,
  transaction,
  onClose,
  onEdit,
  formatCurrency,
  formatDate,
}) => {
  if (!show || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Transaction Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <p className="text-gray-900">
                {transaction.description || "No description"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <p
                className={`font-semibold ${
                  transaction.type === "income"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <p className="text-gray-900">{transaction.category}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <p className="text-gray-900">{formatDate(transaction.date)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Source
              </label>
              <p className="text-gray-900 capitalize">{transaction.source}</p>
            </div>
          </div>

          {/* Merchant Info */}
          {transaction.metadata?.merchant && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Merchant
              </label>
              <p className="text-gray-900">{transaction.metadata.merchant}</p>
            </div>
          )}

          {/* Items from Receipt */}
          {transaction.metadata?.items &&
            transaction.metadata.items.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {transaction.metadata.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.name}
                          </p>
                          {item.quantity && (
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-gray-900">Total</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Receipt Link */}
          {transaction.receiptUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Receipt
              </label>
              <a
                href={`${import.meta.env.VITE_BACKEND_URL}${
                  transaction.receiptUrl
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Original Receipt
              </a>
            </div>
          )}

          {/* Confidence Score */}
          {transaction.metadata?.confidence && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                AI Confidence
              </label>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${transaction.metadata.confidence * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">
                  {Math.round(transaction.metadata.confidence * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              onClose();
              onEdit(transaction);
            }}
            className="btn-secondary flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
