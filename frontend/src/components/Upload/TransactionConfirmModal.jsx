import {
  X,
  Edit3,
  Save,
  Calendar,
  DollarSign,
  Tag,
  FileTextIcon,
} from "lucide-react";
import LoadingSpinner from "../LoadingSpinner";

const TransactionConfirmModal = ({
  showConfirmModal,
  editingTransaction,
  creatingTransaction,
  onClose,
  onEditChange,
  onCreateTransaction,
}) => {
  if (!showConfirmModal || !editingTransaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Edit3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm Transaction Details
              </h2>
              <p className="text-sm text-gray-600">
                Review and edit the extracted information before creating the
                transaction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description */}
            <div className="md:col-span-2">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileTextIcon className="h-4 w-4 mr-2 text-gray-500" />
                Description
              </label>
              <input
                type="text"
                value={editingTransaction.description}
                onChange={(e) => onEditChange("description", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter transaction description"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={editingTransaction.amount}
                onChange={(e) => onEditChange("amount", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>

            {/* Date */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                Date
              </label>
              <input
                type="date"
                value={editingTransaction.date}
                onChange={(e) => onEditChange("date", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 mr-2 text-gray-500" />
                Category
              </label>
              <select
                value={editingTransaction.category}
                onChange={(e) => onEditChange("category", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="Shopping">Shopping</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Bills & Utilities">Bills & Utilities</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Travel">Travel</option>
                <option value="Education">Education</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Gifts & Donations">Gifts & Donations</option>
                <option value="Business">Business</option>
                <option value="Uncategorized">Uncategorized</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={editingTransaction.type}
                onChange={(e) => onEditChange("type", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          {/* Items (if available) */}
          {editingTransaction.items && editingTransaction.items.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Extracted Items
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {editingTransaction.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-medium text-gray-900">
                        ${item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-3">
              Transaction Preview
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Description:</span>
                <p className="text-blue-800">
                  {editingTransaction.description || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Amount:</span>
                <p className="text-blue-800">
                  ${editingTransaction.amount || "0.00"}
                </p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Date:</span>
                <p className="text-blue-800">
                  {editingTransaction.date || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Category:</span>
                <p className="text-blue-800">
                  {editingTransaction.category || "Uncategorized"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onCreateTransaction}
            disabled={
              creatingTransaction ||
              !editingTransaction.description ||
              !editingTransaction.amount
            }
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creatingTransaction ? (
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Transaction
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionConfirmModal;
