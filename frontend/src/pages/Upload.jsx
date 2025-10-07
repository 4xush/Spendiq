import { useState, useEffect } from "react";
import { FileText, Image, CheckCircle, AlertCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

// Import sub-components
import UploadTabs from "../components/Upload/UploadTabs";
import FileUploadZone from "../components/Upload/FileUploadZone";
import ProcessingStatus from "../components/Upload/ProcessingStatus";
import UploadResults from "../components/Upload/UploadResults";
import TransactionConfirmModal from "../components/Upload/TransactionConfirmModal";
import TipsSection from "../components/Upload/TipsSection";
import FeaturesInfo from "../components/Upload/FeaturesInfo";

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_FILE_SIZE = 100; // bytes
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLLS = 60; // 2 minutes

const FILE_CONFIG = {
  receipt: {
    types: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    extensions: ["jpg", "jpeg", "png", "gif", "webp"],
    error: "Invalid format. Upload JPEG, PNG, GIF, or WebP files.",
  },
  pdf: {
    types: ["application/pdf"],
    extensions: ["pdf"],
    error: "Invalid format. Upload PDF files only.",
  },
  image: {
    types: ["image/jpeg", "image/jpg", "image/png"],
    extensions: ["jpg", "jpeg", "png"],
    error: "Invalid format. Upload PNG, JPG, or JPEG files.",
  },
};

function Upload() {
  const [activeTab, setActiveTab] = useState("receipt");
  const [bankStatementType, setBankStatementType] = useState("pdf");
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [creatingTransaction, setCreatingTransaction] = useState(false);
  const navigate = useNavigate();

  // Poll for receipt status updates
  useEffect(() => {
    const processingItems = uploadResults.filter(
      (item) => item.status === "processing" && item.receiptId
    );

    if (processingItems.length === 0) return;

    let pollCount = 0;

    const pollInterval = setInterval(async () => {
      pollCount++;

      if (pollCount > MAX_POLLS) {
        clearInterval(pollInterval);
        setUploadResults((prev) =>
          prev.map((result) =>
            result.status === "processing"
              ? {
                  ...result,
                  status: "failed",
                  error: { message: "Processing timed out. Please try again." },
                }
              : result
          )
        );
        return;
      }

      for (const item of processingItems) {
        try {
          const response = await api.get(`/files/receipt/${item.receiptId}`);
          const { receipt } = response.data;

          if (receipt.status !== "processing") {
            setUploadResults((prev) =>
              prev.map((result) =>
                result.receiptId === item.receiptId
                  ? {
                      ...result,
                      status: receipt.status,
                      extractedData: receipt.extractedData,
                      transaction: receipt.transaction,
                      error: receipt.error,
                    }
                  : result
              )
            );

            if (receipt.status === "completed" && receipt.extractedData) {
              toast.success(
                `Receipt "${item.filename}" processed successfully!`
              );
              showTransactionConfirmation(
                receipt.extractedData,
                item.receiptId,
                "receipt"
              );
            } else if (receipt.status === "failed") {
              toast.error(
                receipt.error?.message || `Failed to process "${item.filename}"`
              );
            }
          }
        } catch (error) {
          console.error("Error polling receipt status:", error);
        }
      }
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [uploadResults]);

  // Validation
  const validateFile = (file, type) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 5MB.");
      return false;
    }

    if (file.size < MIN_FILE_SIZE) {
      toast.error("File appears to be corrupted or empty.");
      return false;
    }

    const config = FILE_CONFIG[type];
    if (!config) return false;

    if (!config.types.includes(file.type)) {
      toast.error(config.error);
      return false;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!config.extensions.includes(extension)) {
      toast.error("Invalid file extension.");
      return false;
    }

    return true;
  };

  // Transaction handlers
  const showTransactionConfirmation = (extractedData, resultId, sourceType) => {
    const transactionData = {
      description: extractedData.merchant || extractedData.description || "",
      amount: extractedData.amount || "",
      date: extractedData.date || new Date().toISOString().split("T")[0],
      category: extractedData.category || "Uncategorized",
      type: "expense",
      items: extractedData.items || [],
      resultId,
      sourceType,
    };

    setPendingTransaction(transactionData);
    setEditingTransaction({ ...transactionData });
    setShowConfirmModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditingTransaction((prev) => ({ ...prev, [field]: value }));
  };

  const updateUploadResult = (resultId, updateFn) => {
    setUploadResults((prev) =>
      prev.map((result) => {
        const isMatch = result.id === resultId || result.receiptId === resultId;
        return isMatch ? updateFn(result) : result;
      })
    );
  };

  const handleCreateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      setCreatingTransaction(true);

      const response = await api.post("/transactions", {
        description: editingTransaction.description,
        amount: parseFloat(editingTransaction.amount),
        date: editingTransaction.date,
        category: editingTransaction.category,
        type: editingTransaction.type,
        source: editingTransaction.sourceType,
      });

      updateUploadResult(editingTransaction.resultId, (result) => {
        const hasMultiple =
          Array.isArray(result.extractedData) &&
          result.extractedData.length > 1;
        const remaining = hasMultiple ? result.extractedData.slice(1) : [];

        return {
          ...result,
          extractedData: remaining,
          transactionsCreated: (result.transactionsCreated || 0) + 1,
          createdTransactions: [
            ...(result.createdTransactions || []),
            response.data.transaction,
          ],
          needsConfirmation: remaining.length > 0,
          transaction: hasMultiple
            ? result.transaction
            : response.data.transaction,
          status: "completed",
        };
      });

      toast.success("Transaction created successfully!");
      setShowConfirmModal(false);
      setPendingTransaction(null);
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Failed to create transaction.");
    } finally {
      setCreatingTransaction(false);
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setPendingTransaction(null);
    setEditingTransaction(null);
  };

  const handleQuickAdd = async (transactionData, resultId, sourceType) => {
    try {
      setCreatingTransaction(true);

      const response = await api.post("/transactions", {
        description:
          transactionData.merchant ||
          transactionData.description ||
          "Transaction",
        amount: parseFloat(transactionData.amount) || 0,
        date: transactionData.date || new Date().toISOString().split("T")[0],
        category: transactionData.category || "Uncategorized",
        type: "expense",
        source: sourceType,
        metadata: {
          merchant: transactionData.merchant,
          items: transactionData.items || [],
          confidence: transactionData.confidence || 0.8,
        },
      });

      updateUploadResult(resultId, (result) => {
        const isArray = Array.isArray(result.extractedData);
        const hasMultiple = isArray && result.extractedData.length > 1;
        const remaining = hasMultiple ? result.extractedData.slice(1) : [];

        return {
          ...result,
          extractedData: remaining,
          createdTransactions: [
            ...(result.createdTransactions || []),
            response.data.transaction,
          ],
          needsConfirmation: remaining.length > 0,
          transaction: hasMultiple
            ? result.transaction
            : response.data.transaction,
          status: "completed",
        };
      });

      toast.success("Transaction added successfully!");
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction.");
    } finally {
      setCreatingTransaction(false);
    }
  };

  const handleQuickSkip = (resultId) => {
    updateUploadResult(resultId, (result) => {
      const isArray = Array.isArray(result.extractedData);
      const hasMultiple = isArray && result.extractedData.length > 1;
      const remaining = hasMultiple ? result.extractedData.slice(1) : [];

      return {
        ...result,
        extractedData: remaining,
        needsConfirmation: remaining.length > 0,
        status: "completed",
        message: remaining.length > 0 ? result.message : "Transaction skipped",
      };
    });

    toast.success("Transaction skipped!");
  };

  const handleConfirmAll = async (resultId, sourceType) => {
    try {
      setCreatingTransaction(true);

      const result = uploadResults.find((r) => r.id === resultId);
      if (!result || !Array.isArray(result.extractedData)) {
        toast.error("No transactions to confirm");
        return;
      }

      const transactions = result.extractedData;
      const createdTransactions = [];

      // Create all transactions
      for (const transactionData of transactions) {
        try {
          const response = await api.post("/transactions", {
            description:
              transactionData.merchant ||
              transactionData.description ||
              "Transaction",
            amount: parseFloat(transactionData.amount) || 0,
            date:
              transactionData.date || new Date().toISOString().split("T")[0],
            category: transactionData.category || "Uncategorized",
            type: "expense",
            source: sourceType,
            metadata: {
              merchant: transactionData.merchant,
              items: transactionData.items || [],
              confidence: transactionData.confidence || 0.8,
            },
          });

          createdTransactions.push(response.data.transaction);
        } catch (error) {
          console.error("Error creating transaction:", error);
          // Continue with other transactions even if one fails
        }
      }

      // Update the result
      updateUploadResult(resultId, (result) => ({
        ...result,
        extractedData: [],
        createdTransactions,
        needsConfirmation: false,
        status: "completed",
        transactionsCreated: createdTransactions.length,
      }));

      toast.success(
        `Successfully created ${createdTransactions.length} transaction(s)!`
      );
    } catch (error) {
      console.error("Error confirming all transactions:", error);
      toast.error("Failed to create some transactions.");
    } finally {
      setCreatingTransaction(false);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    const actualType = type === "statement" ? bankStatementType : type;

    if (!validateFile(file, actualType)) return;

    const formData = new FormData();
    formData.append(actualType, file);

    try {
      setUploading(true);
      const endpoint = `/files/${actualType}`;
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (actualType === "pdf" || actualType === "image") {
        const { extractedData, message } = response.data;

        if (extractedData?.length > 0) {
          toast.success(
            `${actualType.toUpperCase()} processed! Found ${
              extractedData.length
            } transaction(s).`
          );

          const resultId = Date.now();
          setUploadResults((prev) => [
            ...prev,
            {
              id: resultId,
              filename: file.name,
              type: actualType,
              status: "completed",
              timestamp: new Date(),
              extractedData,
              message,
              needsConfirmation: true,
            },
          ]);
        } else {
          toast.warning(
            `${actualType.toUpperCase()} processed but no transactions found.`
          );
          setUploadResults((prev) => [
            ...prev,
            {
              id: Date.now(),
              filename: file.name,
              type: actualType,
              status: "completed",
              timestamp: new Date(),
              transactionsCreated: 0,
              message: `No transactions found in ${actualType.toUpperCase()}`,
            },
          ]);
        }
      } else {
        toast.success("Receipt uploaded successfully!");
        setUploadResults((prev) => [
          ...prev,
          {
            id: response.data.receiptId || Date.now(),
            receiptId: response.data.receiptId,
            filename: file.name,
            type: actualType,
            status: "processing",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error.response?.data?.error || `Failed to upload ${type}`;

      if (actualType === "pdf" || actualType === "image") {
        if (errorMessage.includes("temporarily unavailable")) {
          toast.error("AI Service temporarily unavailable. Try again later.", {
            duration: 6000,
          });
        } else if (errorMessage.includes("rate limit")) {
          toast.error("Rate limit exceeded. Please wait.", { duration: 5000 });
        } else {
          toast.error(
            `${actualType.toUpperCase()} processing error: ${errorMessage}`,
            { duration: 4000 }
          );
        }

        setUploadResults((prev) => [
          ...prev,
          {
            id: Date.now(),
            filename: file.name,
            type: actualType,
            status: "failed",
            timestamp: new Date(),
            error: errorMessage,
          },
        ]);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const getStatusIcon = (status) => {
    const icons = {
      processing: <Clock className="h-5 w-5 text-yellow-500" />,
      completed: <CheckCircle className="h-5 w-5 text-green-500" />,
      failed: <AlertCircle className="h-5 w-5 text-red-500" />,
    };
    return icons[status] || null;
  };

  const getStatusText = (status) => {
    const texts = {
      processing: "Processing...",
      completed: "Completed",
      failed: "Failed",
    };
    return texts[status] || "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-4">
        {/* Header - Compact Version with Larger Text */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Upload & Process
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Upload receipts and bank statements to extract transactions
          </p>
        </div>

        {/* Tabs */}
        <UploadTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Upload Area */}
          <div className="space-y-6">
            {activeTab === "receipt" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Upload Receipt
                </h2>
                <FileUploadZone
                  type="receipt"
                  accept="image/*"
                  title="Receipt Scanner"
                  description="Upload photos to automatically extract transaction data"
                  icon={Image}
                  onFileUpload={handleFileUpload}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                />

                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-medium text-blue-900 text-sm mb-2">
                    How it works:
                  </h4>
                  <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                    <li>• Take a clear photo of your receipt</li>
                    <li>• AI extracts merchant, amount, and date</li>
                    <li>• Review and confirm the data</li>
                    <li>• Transaction added automatically</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "statement" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Import Bank Statement
                </h2>

                {/* Format Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Choose Format:
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setBankStatementType("pdf")}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        bankStatementType === "pdf"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <FileText className="h-5 w-5 text-red-500 mr-2" />
                        <span className="font-medium text-gray-900">PDF</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Official statements
                      </p>
                    </button>

                    <button
                      onClick={() => setBankStatementType("image")}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        bankStatementType === "image"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <Image className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="font-medium text-gray-900">Image</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Screenshots/photos
                      </p>
                    </button>
                  </div>
                </div>

                <FileUploadZone
                  type="statement"
                  accept={
                    bankStatementType === "pdf" ? ".pdf" : ".png,.jpg,.jpeg"
                  }
                  title={`${bankStatementType.toUpperCase()} Import`}
                  description={`Upload ${bankStatementType} statements to extract transactions`}
                  icon={bankStatementType === "pdf" ? FileText : Image}
                  onFileUpload={handleFileUpload}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                />

                <div
                  className={`mt-4 p-4 rounded-xl ${
                    bankStatementType === "pdf" ? "bg-green-50" : "bg-blue-50"
                  }`}
                >
                  <h4
                    className={`font-medium text-sm mb-2 ${
                      bankStatementType === "pdf"
                        ? "text-green-900"
                        : "text-blue-900"
                    }`}
                  >
                    Requirements:
                  </h4>
                  <ul
                    className={`text-xs sm:text-sm space-y-1 ${
                      bankStatementType === "pdf"
                        ? "text-green-800"
                        : "text-blue-800"
                    }`}
                  >
                    {bankStatementType === "pdf" ? (
                      <>
                        <li>• Official bank/credit card statements</li>
                        <li>• PDF with selectable text</li>
                        <li>• Maximum 5MB file size</li>
                      </>
                    ) : (
                      <>
                        <li>• Clear, high-resolution images</li>
                        <li>• PNG, JPG, or JPEG formats</li>
                        <li>• Readable text and amounts</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="space-y-6">
            <ProcessingStatus uploading={uploading} />

            {/* <UploadResults
              uploadResults={uploadResults}
              showTransactionConfirmation={showTransactionConfirmation}
              navigate={navigate}
              getStatusIcon={getStatusIcon}
              getStatusText={getStatusText}
              onQuickAdd={handleQuickAdd}
              onQuickSkip={handleQuickSkip}
            /> */}
            <UploadResults
              uploadResults={uploadResults}
              showTransactionConfirmation={showTransactionConfirmation}
              navigate={navigate}
              getStatusIcon={getStatusIcon}
              getStatusText={getStatusText}
              onQuickAdd={handleQuickAdd}
              onQuickSkip={handleQuickSkip}
              onConfirmAll={handleConfirmAll}
              creatingTransaction={creatingTransaction}
            />

            <TipsSection />
          </div>
        </div>

        {/* Features Info */}
        <FeaturesInfo />

        {/* Transaction Modal */}
        <TransactionConfirmModal
          showConfirmModal={showConfirmModal}
          editingTransaction={editingTransaction}
          creatingTransaction={creatingTransaction}
          onClose={closeConfirmModal}
          onEditChange={handleEditChange}
          onCreateTransaction={handleCreateTransaction}
        />
      </div>
    </div>
  );
}

export default Upload;
