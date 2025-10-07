const DeleteConfirmModal = ({ transaction, onConfirm, onCancel }) => {
  if (!transaction) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Delete Transaction
        </h3>
        <p className="text-gray-500 mb-4">
          Are you sure you want to delete this transaction? This action cannot
          be undone.
        </p>
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <p className="text-sm font-medium text-gray-900">
            {transaction.description || "No description"}
          </p>
          <p className="text-sm text-gray-500">
            {formatCurrency(transaction.amount)} • {transaction.category}
          </p>
          <p className="text-xs text-gray-400">
            {formatDate(transaction.date)}
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
