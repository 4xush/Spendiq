import { useState, useEffect } from "react";
import { Plus, Filter, Search, Edit, Trash2, Calendar } from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: "",
    category: "",
    search: "",
    startDate: "",
    endDate: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await api.get(`/transactions?${params}`);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle view transaction details
  const handleViewTransaction = async (transaction) => {
    try {
      const response = await api.get(`/transactions/${transaction._id}`);
      setSelectedTransaction(response.data.transaction);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to fetch transaction details:", error);
      toast.error("Failed to load transaction details");
    }
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowEditForm(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteConfirm(true);
  };

  // Confirm delete transaction
  const confirmDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      await api.delete(`/transactions/${deletingTransaction._id}`);
      toast.success("Transaction deleted successfully");

      // Remove from state
      setTransactions((prev) =>
        prev.filter((t) => t._id !== deletingTransaction._id)
      );

      // Close modal
      setShowDeleteConfirm(false);
      setDeletingTransaction(null);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  // Handle update transaction
  const handleUpdateTransaction = async (updatedData) => {
    if (!editingTransaction) return;

    try {
      const response = await api.put(
        `/transactions/${editingTransaction._id}`,
        updatedData
      );
      toast.success("Transaction updated successfully");

      // Update in state
      setTransactions((prev) =>
        prev.map((t) =>
          t._id === editingTransaction._id ? response.data.transaction : t
        )
      );

      // Close modal
      setShowEditForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error("Failed to update transaction:", error);
      toast.error("Failed to update transaction");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage your income and expenses</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="input pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="input"
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
        </div>

        {/* Quick Date Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => {
              const today = new Date();
              const lastMonth = new Date(
                today.getFullYear(),
                today.getMonth() - 1,
                today.getDate()
              );
              setFilters((prev) => ({
                ...prev,
                startDate: lastMonth.toISOString().split("T")[0],
                endDate: today.toISOString().split("T")[0],
                page: 1,
              }));
            }}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const firstDay = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
              );
              setFilters((prev) => ({
                ...prev,
                startDate: firstDay.toISOString().split("T")[0],
                endDate: today.toISOString().split("T")[0],
                page: 1,
              }));
            }}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
          >
            This Month
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const lastYear = new Date(
                today.getFullYear() - 1,
                today.getMonth(),
                today.getDate()
              );
              setFilters((prev) => ({
                ...prev,
                startDate: lastYear.toISOString().split("T")[0],
                endDate: today.toISOString().split("T")[0],
                page: 1,
              }));
            }}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
          >
            Last Year
          </button>
          <button
            onClick={() => {
              setFilters((prev) => ({
                ...prev,
                startDate: "",
                endDate: "",
                page: 1,
              }));
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            All Time
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {/* Desktop Table */}
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
                      onClick={() => handleViewTransaction(transaction)}
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
                              handleEditTransaction(transaction);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit transaction"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTransaction(transaction);
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

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleViewTransaction(transaction)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description || "No description"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.category}
                      </p>
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
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.date)}
                    </p>
                    <div className="flex items-center space-x-3">
                      <p
                        className={`font-medium ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTransaction(transaction);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit transaction"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTransaction(transaction);
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
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-700">
                  Showing{" "}
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
                  to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.itemsPerPage,
                    pagination.totalItems
                  )}{" "}
                  of {pagination.totalItems} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            {filters.startDate ||
            filters.endDate ||
            filters.type ||
            filters.category ||
            filters.search ? (
              <>
                <p className="text-gray-500 mb-4">
                  No transactions found for the current filters
                </p>
                <div className="space-y-2 mb-4">
                  {filters.startDate && (
                    <p className="text-sm text-gray-400">
                      Start Date: {filters.startDate}
                    </p>
                  )}
                  {filters.endDate && (
                    <p className="text-sm text-gray-400">
                      End Date: {filters.endDate}
                    </p>
                  )}
                  {filters.type && (
                    <p className="text-sm text-gray-400">
                      Type: {filters.type}
                    </p>
                  )}
                  {filters.category && (
                    <p className="text-sm text-gray-400">
                      Category: {filters.category}
                    </p>
                  )}
                  {filters.search && (
                    <p className="text-sm text-gray-400">
                      Search: "{filters.search}"
                    </p>
                  )}
                </div>
                <button
                  onClick={() =>
                    setFilters({
                      page: 1,
                      limit: 20,
                      type: "",
                      category: "",
                      search: "",
                      startDate: "",
                      endDate: "",
                    })
                  }
                  className="btn-secondary mr-3"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary"
                >
                  Add Transaction
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">No transactions found</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary"
                >
                  Add your first transaction
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Transaction
            </h3>
            <p className="text-gray-500 mb-4">
              Transaction form coming soon...
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Transaction
            </h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-900">
                {deletingTransaction.description || "No description"}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(deletingTransaction.amount)} •{" "}
                {deletingTransaction.category}
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(deletingTransaction.date)}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingTransaction(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTransaction}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditForm && editingTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Transaction
            </h3>
            <p className="text-gray-500 mb-4">
              Edit transaction form coming soon...
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-900">
                Current: {editingTransaction.description || "No description"}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(editingTransaction.amount)} •{" "}
                {editingTransaction.category}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingTransaction(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingTransaction(null);
                }}
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Transaction Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTransaction(null);
                }}
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
                    {selectedTransaction.description || "No description"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <p
                    className={`font-semibold ${
                      selectedTransaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedTransaction.type === "income" ? "+" : "-"}
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <p className="text-gray-900">
                    {selectedTransaction.category}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <p className="text-gray-900">
                    {formatDate(selectedTransaction.date)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedTransaction.type === "income"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedTransaction.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Source
                  </label>
                  <p className="text-gray-900 capitalize">
                    {selectedTransaction.source}
                  </p>
                </div>
              </div>

              {/* Merchant Info */}
              {selectedTransaction.metadata?.merchant && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Merchant
                  </label>
                  <p className="text-gray-900">
                    {selectedTransaction.metadata.merchant}
                  </p>
                </div>
              )}

              {/* Items from Receipt */}
              {selectedTransaction.metadata?.items &&
                selectedTransaction.metadata.items.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Items
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {selectedTransaction.metadata.items.map(
                          (item, index) => (
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
                          )
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-gray-900">Total</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(selectedTransaction.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Receipt Link */}
              {selectedTransaction.receiptUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Receipt
                  </label>
                  <a
                    href={`${import.meta.env.VITE_BACKEND_URL}${
                      selectedTransaction.receiptUrl
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
              {selectedTransaction.metadata?.confidence && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    AI Confidence
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            selectedTransaction.metadata.confidence * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {Math.round(
                        selectedTransaction.metadata.confidence * 100
                      )}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTransaction(null);
                  handleEditTransaction(selectedTransaction);
                }}
                className="btn-secondary flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTransaction(null);
                }}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
