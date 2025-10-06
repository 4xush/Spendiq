import { useState, useEffect } from "react";
import { Plus, Calendar } from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

// Import modular components
import TransactionForm from "./Transaction/TransactionForm";
import TransactionFilters from "./Transaction/TransactionFilters";
import TransactionTable from "./Transaction/TransactionTable";
import TransactionCard from "./Transaction/TransactionCard";
import TransactionDetailsModal from "./Transaction/TransactionDetailsModal";
import EditTransactionModal from "./Transaction/EditTransactionModal";
import DeleteConfirmModal from "./Transaction/DeleteConfirmModal";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showAddForm) setShowAddForm(false);
        if (showEditForm) {
          setShowEditForm(false);
          setEditingTransaction(null);
        }
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          setDeletingTransaction(null);
        }
        if (showDetailsModal) {
          setShowDetailsModal(false);
          setSelectedTransaction(null);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showAddForm, showEditForm, showDeleteConfirm, showDetailsModal]);

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
    if (!editingTransaction || isSubmitting) return;

    try {
      setIsSubmitting(true);
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
      const errorMessage =
        error.response?.data?.message || "Failed to update transaction";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

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

    const transactionData = {
      description,
      amount,
      category: formData.get("category"),
      type: formData.get("type"),
      date: formData.get("date"),
    };

    try {
      setIsSubmitting(true);
      const response = await api.post("/transactions", transactionData);
      toast.success("Transaction added successfully");

      // Add to state
      setTransactions((prev) => [response.data.transaction, ...prev]);

      // Close modal
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add transaction:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to add transaction";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Transactions List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {/* Desktop Table */}
            <TransactionTable
              transactions={transactions}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onRowClick={handleViewTransaction}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction._id}
                  transaction={transaction}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  onClick={handleViewTransaction}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                />
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

      {/* Modals */}
      <TransactionForm
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddTransaction}
        isSubmitting={isSubmitting}
      />

      <EditTransactionModal
        show={showEditForm}
        transaction={editingTransaction}
        onClose={() => {
          setShowEditForm(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleUpdateTransaction}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmModal
        show={showDeleteConfirm}
        transaction={deletingTransaction}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingTransaction(null);
        }}
        onConfirm={confirmDeleteTransaction}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      <TransactionDetailsModal
        show={showDetailsModal}
        transaction={selectedTransaction}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTransaction(null);
        }}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    </div>
  );
}

export default Transactions;
