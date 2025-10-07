import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
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
  FaPlus,
  FaTable,
  FaTh,
  FaTrash,
  FaCheckSquare,
  FaSquare,
} from "react-icons/fa";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // 'card' or 'table'
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

  // Bulk selection state
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  // Check for 'add' parameter in URL to auto-open form
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowForm(true);
      // Remove the parameter from URL after opening form
      const params = new URLSearchParams(searchParams);
      params.delete("add");
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
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
      console.error("Failed to fetch transaction details:", err);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleDelete = (transaction) => {
    setDeletingTransaction(transaction);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/transactions/${deletingTransaction._id}`);
      toast.success("Transaction deleted successfully");
      setTransactions((prev) =>
        prev.filter((t) => t._id !== deletingTransaction._id)
      );
      setDeletingTransaction(null);
      fetchTransactions(); // Refresh to update pagination
    } catch (err) {
      toast.error("Failed to delete transaction");
      console.error("Delete transaction error:", err);
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

  // Bulk selection functions
  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode);
    setSelectedTransactions([]);
  };

  const toggleTransactionSelection = (transaction) => {
    setSelectedTransactions((prev) => {
      const isSelected = prev.some((t) => t._id === transaction._id);
      if (isSelected) {
        return prev.filter((t) => t._id !== transaction._id);
      } else {
        return [...prev, transaction];
      }
    });
  };

  const selectAllTransactions = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions([...transactions]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedTransactions.length > 0) {
      setShowBulkDeleteModal(true);
    }
  };

  const confirmBulkDelete = async (deleteData) => {
    try {
      const result = await bulkDeleteTransactions(deleteData);

      // Remove deleted transactions from the current list
      if (deleteData.deleteType === "selected") {
        setTransactions((prev) =>
          prev.filter(
            (t) => !selectedTransactions.some((st) => st._id === t._id)
          )
        );
      } else {
        // For date range or last days, refresh the entire list
        await fetchTransactions();
      }

      setSelectedTransactions([]);
      setBulkSelectMode(false);
      setShowBulkDeleteModal(false);

      // Show success message
      toast.success(
        `Successfully deleted ${result.deletedCount} transaction(s)`
      );
    } catch (err) {
      toast.error("Failed to delete transactions");
      console.error("Bulk delete error:", err);
    }
  };

  const handleTransactionSubmit = async (transactionData) => {
    try {
      const response = await api.post("/transactions", transactionData);
      toast.success("Transaction added successfully");
      setTransactions((prev) => [response.data.transaction, ...prev]);
      setShowForm(false);
      fetchTransactions(); // Refresh to get updated pagination
    } catch (err) {
      toast.error("Failed to create transaction");
      console.error("Create transaction error:", err);
    }
  };

  const handleTransactionUpdate = async (updatedTransaction) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t._id === updatedTransaction._id ? updatedTransaction : t
      )
    );
    setEditingTransaction(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>

        <div className="flex flex-wrap gap-2">
          {/* Bulk Select Toggle */}
          <button
            onClick={toggleBulkSelectMode}
            className={`px-4 py-2 rounded-md flex items-center transition-colors ${
              bulkSelectMode
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaCheckSquare className="mr-2" />
            {bulkSelectMode ? "Exit Select" : "Bulk Select"}
          </button>

          {/* Bulk Actions */}
          {bulkSelectMode && (
            <>
              <button
                onClick={selectAllTransactions}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
              >
                {selectedTransactions.length === transactions.length ? (
                  <FaCheckSquare className="mr-2" />
                ) : (
                  <FaSquare className="mr-2" />
                )}
                {selectedTransactions.length === transactions.length
                  ? "Deselect All"
                  : "Select All"}
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={selectedTransactions.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <FaTrash className="mr-2" />
                Delete ({selectedTransactions.length})
              </button>
            </>
          )}

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1 rounded-md flex items-center ${
                viewMode === "card"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <FaTh className="mr-1" />
              Card
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-md flex items-center ${
                viewMode === "table"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <FaTable className="mr-1" />
              Table
            </button>
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <FaPlus className="mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Selection Summary */}
      {bulkSelectMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            <span className="font-medium">{selectedTransactions.length}</span>{" "}
            of <span className="font-medium">{transactions.length}</span>{" "}
            transactions selected
            {selectedTransactions.length > 0 && (
              <span className="ml-4 text-sm">
                Total amount: ₹
                {selectedTransactions
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </span>
            )}
          </p>
        </div>
      )}

      <TransactionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={clearFilters}
      />

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No transactions found</p>
        </div>
      ) : (
        <>
          {viewMode === "card" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <TransactionTable
              transactions={transactions}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDelete}
              selectedTransactions={selectedTransactions}
              onToggleSelect={toggleTransactionSelection}
              bulkSelectMode={bulkSelectMode}
            />
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

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
