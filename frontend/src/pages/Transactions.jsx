import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api, { bulkDeleteTransactions } from "../utils/api";
import TransactionCard from "./Transaction/TransactionCard";
import TransactionTable from "./Transaction/TransactionTable";
import TransactionFilters from "./Transaction/TransactionFilters";
import TransactionForm from "./Transaction/TransactionForm";
import TransactionDetailsModal from "./Transaction/TransactionDetailsModal";
import EditTransactionModal from "./Transaction/EditTransactionModal";
import DeleteConfirmModal from "./Transaction/DeleteConfirmModal";
import BulkDeleteModal from "./Transaction/BulkDeleteModal";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Plus,
  Grid3x3,
  List,
  Trash2,
  CheckSquare,
  Square,
  Filter,
} from "lucide-react";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("card"); // Default to card for mobile
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [detailsTransaction, setDetailsTransaction] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: "",
    category: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection state
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowForm(true);
      const params = new URLSearchParams(searchParams);
      params.delete("add");
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Force card view on mobile, allow table on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("card");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/transactions?${params}`);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error("Failed to load transactions");
      console.error("Fetch transactions error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = async (transaction) => {
    try {
      const response = await api.get(`/transactions/${transaction._id}`);
      setDetailsTransaction(response.data.transaction);
    } catch (err) {
      toast.error("Failed to load transaction details");
    }
  };

  const handleEdit = (transaction) => setEditingTransaction(transaction);
  const handleDelete = (transaction) => setDeletingTransaction(transaction);

  const confirmDelete = async () => {
    try {
      await api.delete(`/transactions/${deletingTransaction._id}`);
      toast.success("Transaction deleted successfully");
      setTransactions((prev) =>
        prev.filter((t) => t._id !== deletingTransaction._id)
      );
      setDeletingTransaction(null);
      fetchTransactions();
    } catch (err) {
      toast.error("Failed to delete transaction");
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      type: "",
      category: "",
      startDate: "",
      endDate: "",
      search: "",
    });
  };

  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode);
    setSelectedTransactions([]);
  };

  const toggleTransactionSelection = (transaction) => {
    setSelectedTransactions((prev) => {
      const isSelected = prev.some((t) => t._id === transaction._id);
      return isSelected
        ? prev.filter((t) => t._id !== transaction._id)
        : [...prev, transaction];
    });
  };

  const selectAllTransactions = () => {
    setSelectedTransactions(
      selectedTransactions.length === transactions.length ? [] : [...transactions]
    );
  };

  const handleBulkDelete = () => {
    if (selectedTransactions.length > 0) {
      setShowBulkDeleteModal(true);
    }
  };

  const confirmBulkDelete = async (deleteData) => {
    try {
      const result = await bulkDeleteTransactions(deleteData);

      if (deleteData.deleteType === "selected") {
        setTransactions((prev) =>
          prev.filter((t) => !selectedTransactions.some((st) => st._id === t._id))
        );
      } else {
        await fetchTransactions();
      }

      setSelectedTransactions([]);
      setBulkSelectMode(false);
      setShowBulkDeleteModal(false);
      toast.success(`Successfully deleted ${result.deletedCount} transaction(s)`);
    } catch (err) {
      toast.error("Failed to delete transactions");
    }
  };

  const handleTransactionSubmit = async (transactionData) => {
    try {
      const response = await api.post("/transactions", transactionData);
      toast.success("Transaction added successfully");
      setTransactions((prev) => [response.data.transaction, ...prev]);
      setShowForm(false);
      fetchTransactions();
    } catch (err) {
      toast.error("Failed to create transaction");
    }
  };

  const handleTransactionUpdate = async (updatedTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t._id === updatedTransaction._id ? updatedTransaction : t))
    );
    setEditingTransaction(null);
  };

  if (loading) return <LoadingSpinner />;

  const hasActiveFilters = filters.type || filters.category || filters.startDate || filters.endDate || filters.search;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="py-4">
            {/* Top Row */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Transactions
                </h1>
                {pagination.total > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {pagination.total} total
                  </p>
                )}
              </div>

              {/* Primary Action */}
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2">
              {/* Left Actions */}
              <div className="flex items-center gap-2 flex-1">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                    showFilters || hasActiveFilters
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </button>

                {/* Bulk Select */}
                {!bulkSelectMode ? (
                  <button
                    onClick={toggleBulkSelectMode}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Select</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={selectAllTransactions}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium"
                    >
                      {selectedTransactions.length === transactions.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {selectedTransactions.length === transactions.length
                          ? "Deselect"
                          : "All"}
                      </span>
                    </button>

                    <button
                      onClick={handleBulkDelete}
                      disabled={selectedTransactions.length === 0}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        Delete ({selectedTransactions.length})
                      </span>
                      <span className="sm:hidden">{selectedTransactions.length}</span>
                    </button>

                    <button
                      onClick={toggleBulkSelectMode}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>

              {/* View Toggle - Hidden on Mobile, shown on tablet+ */}
              <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "card"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Card View"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "table"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Summary Bar */}
      {bulkSelectMode && selectedTransactions.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-900 font-medium">
                {selectedTransactions.length} selected
              </span>
              <span className="text-blue-700">
                Total: ₹
                {selectedTransactions
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <TransactionFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={clearFilters}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <List className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Get started by adding your first transaction"}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Transaction
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Always use card view on mobile, switch on desktop */}
            {viewMode === "card" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction._id}
                    transaction={transaction}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isSelected={selectedTransactions.some(
                      (t) => t._id === transaction._id
                    )}
                    onToggleSelect={() => toggleTransactionSelection(transaction)}
                    bulkSelectMode={bulkSelectMode}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <TransactionTable
                  transactions={transactions}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  selectedTransactions={selectedTransactions}
                  onToggleSelect={toggleTransactionSelection}
                  bulkSelectMode={bulkSelectMode}
                />
              </div>
            )}

            {/* Minimal Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    const current = pagination.currentPage;
                    
                    // Show first, last, current, and adjacent pages
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= current - 1 && pageNum <= current + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                            pageNum === current
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === current - 2 ||
                      pageNum === current + 2
                    ) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Mobile: Simple page indicator */}
                <div className="sm:hidden px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg">
                  {pagination.currentPage} / {pagination.totalPages}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <TransactionForm
          onSubmit={handleTransactionSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {detailsTransaction && (
        <TransactionDetailsModal
          transaction={detailsTransaction}
          onClose={() => setDetailsTransaction(null)}
          onEdit={() => {
            setEditingTransaction(detailsTransaction);
            setDetailsTransaction(null);
          }}
          onDelete={() => {
            setDeletingTransaction(detailsTransaction);
            setDetailsTransaction(null);
          }}
        />
      )}

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={handleTransactionUpdate}
          onCancel={() => setEditingTransaction(null)}
        />
      )}

      {deletingTransaction && (
        <DeleteConfirmModal
          transaction={deletingTransaction}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingTransaction(null)}
        />
      )}

      {showBulkDeleteModal && (
        <BulkDeleteModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={confirmBulkDelete}
          selectedTransactions={selectedTransactions}
          totalTransactions={transactions.length}
        />
      )}
    </div>
  );
};

export default Transactions;
