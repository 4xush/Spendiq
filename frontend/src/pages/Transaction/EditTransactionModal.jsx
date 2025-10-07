import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../utils/api";

const EditTransactionModal = ({
  transaction,
  onSave,
  onCancel,
  isSubmitting = false,
}) => {
  const categories = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Education",
    "Travel",
    "Income",
    "Other",
  ];

  const [submitting, setSubmitting] = useState(false);

  if (!transaction) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const formData = new FormData(e.target);
    const description = formData.get("description")?.trim();
    const amount = parseFloat(formData.get("amount"));

    // Basic validation
    if (!description) {
      toast.error("Description is required");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const updatedData = {
      description,
      amount,
      category: formData.get("category"),
      type: formData.get("type"),
      date: formData.get("date"),
    };

    try {
      setSubmitting(true);
      const response = await api.put(
        `/transactions/${transaction._id}`,
        updatedData
      );
      toast.success("Transaction updated successfully");
      onSave(response.data.transaction);
    } catch (error) {
      console.error("Failed to update transaction:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update transaction";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Edit Transaction
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              name="description"
              defaultValue={transaction.description || ""}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              defaultValue={transaction.amount}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              defaultValue={transaction.category}
              className="input"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              defaultValue={transaction.type}
              className="input"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              defaultValue={
                transaction.date
                  ? new Date(transaction.date).toISOString().split("T")[0]
                  : ""
              }
              className="input"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;
