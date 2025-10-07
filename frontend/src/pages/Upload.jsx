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

function Upload() {
  const [activeTab, setActiveTab] = useState("receipt");
  const [bankStatementType, setBankStatementType] = useState("pdf"); // pdf or image
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
    const maxPolls = 60; // Maximum 2 minutes of polling (60 * 2 seconds)

    const pollInterval = setInterval(async () => {
      pollCount++;

      // Stop polling after maximum attempts
      if (pollCount > maxPolls) {
        console.log("⏰ Polling timeout reached, stopping polling");
        clearInterval(pollInterval);

        // Mark long-running items as timed out
        setUploadResults((prev) =>
          prev.map((result) =>
            result.status === "processing"
              ? {
                  ...result,
                  status: "failed",
                  error: {
                    message:
                      "Processing timed out. Please try uploading again.",
                  },
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

            // Show notification and confirmation modal for completed receipts
            if (receipt.status === "completed" && receipt.extractedData) {
              toast.success(
                `Receipt "${item.filename}" processed successfully!`
              );
              // Auto-show confirmation modal
              showTransactionConfirmation(
                receipt.extractedData,
                result.receiptId,
                "receipt"
              );
            } else if (receipt.status === "failed") {
              const errorMessage =
                receipt.error?.message ||
                `Failed to process "${item.filename}"`;
              toast.error(errorMessage);
            }
          }
        } catch (error) {
          console.error("Error polling receipt status:", error);
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [uploadResults]);

  const validateFile = (file, type) => {
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 5MB.");
      return false;
    }

    // Check minimum file size (100 bytes)
    if (file.size < 100) {
      toast.error("File appears to be corrupted or empty.");
      return false;
    }

    if (type === "receipt") {
      // Check image file types
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedImageTypes.includes(file.type)) {
        toast.error(
          "Invalid image format. Please upload JPEG, PNG, GIF, or WebP files."
        );
        return false;
      }

      // Check file extension matches type
      const extension = file.name.split(".").pop()?.toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
      if (!validExtensions.includes(extension)) {
        toast.error(
          "Invalid file extension. Please ensure your image has a proper extension."
        );
        return false;
      }
    } else if (type === "pdf") {
      // Check PDF file type
      if (file.type !== "application/pdf") {
        toast.error("Invalid file format. Please upload PDF files only.");
        return false;
      }
    } else if (type === "image") {
      // Check image file types for bank statements
      const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedImageTypes.includes(file.type)) {
        toast.error(
          "Invalid image format. Please upload PNG, JPG, or JPEG files only."
        );
        return false;
      }

      // Check file extension matches type
      const extension = file.name.split(".").pop()?.toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png"];
      if (!validExtensions.includes(extension)) {
        toast.error(
          "Invalid file extension. Please ensure your image has a proper extension."
        );
        return false;
      }
    }

    return true;
  };

  // Function to show transaction confirmation modal
  const showTransactionConfirmation = (extractedData, resultId, sourceType) => {
    const transactionData = {
      description: extractedData.merchant || extractedData.description || "",
      amount: extractedData.amount || "",
      date: extractedData.date || new Date().toISOString().split("T")[0],
      category: extractedData.category || "Uncategorized",
      type: "expense",
      items: extractedData.items || [],
      resultId: resultId,
      sourceType: sourceType,
    };

    setPendingTransaction(transactionData);
    setEditingTransaction({ ...transactionData });
    setShowConfirmModal(true);
  };

  // Function to handle form field changes
  const handleEditChange = (field, value) => {
    setEditingTransaction((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Function to create transaction
  const handleCreateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      setCreatingTransaction(true);

      const transactionPayload = {
        description: editingTransaction.description,
        amount: parseFloat(editingTransaction.amount),
        date: editingTransaction.date,
        category: editingTransaction.category,
        type: editingTransaction.type,
        source: editingTransaction.sourceType,
      };

      const response = await api.post("/transactions", transactionPayload);

      // Update the upload result to handle multiple transactions
      setUploadResults((prev) =>
        prev.map((result) => {
          // Check for both ID types depending on source
          const isMatchingResult =
            result.id === editingTransaction.resultId ||
            result.receiptId === editingTransaction.resultId;

          if (isMatchingResult) {
            // Handle multiple transactions from PDF/Image
            if (
              Array.isArray(result.extractedData) &&
              result.extractedData.length > 1
            ) {
              // Remove the first transaction (the one we just created) and keep others
              const remainingTransactions = result.extractedData.slice(1);

              return {
                ...result,
                extractedData: remainingTransactions,
                transactionsCreated: (result.transactionsCreated || 0) + 1,
                createdTransactions: [
                  ...(result.createdTransactions || []),
                  response.data.transaction,
                ],
                // Keep needsConfirmation true if there are more transactions
                needsConfirmation: remainingTransactions.length > 0,
                status: "completed",
              };
            } else {
              // Single transaction or last transaction
              return {
                ...result,
                transaction: response.data.transaction,
                transactionsCreated: (result.transactionsCreated || 0) + 1,
                createdTransactions: [
                  ...(result.createdTransactions || []),
                  response.data.transaction,
                ],
                needsConfirmation: false, // All done
                status: "completed",
              };
            }
          }
          return result;
        })
      );

      toast.success("Transaction created successfully!");
      setShowConfirmModal(false);
      setPendingTransaction(null);
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Failed to create transaction. Please try again.");
    } finally {
      setCreatingTransaction(false);
    }
  };

  // Function to close confirmation modal
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setPendingTransaction(null);
    setEditingTransaction(null);
  };

  // Quick action handlers
  const handleQuickAdd = async (transactionData, resultId, sourceType) => {
    try {
      setCreatingTransaction(true);

      // Prepare transaction data for API
      const apiData = {
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
      };

      const response = await api.post("/transactions", apiData);

      // Update upload results to mark transaction as created
      setUploadResults((prev) =>
        prev.map((result) => {
          if (result.id === resultId) {
            const isArray = Array.isArray(result.extractedData);

            if (isArray && result.extractedData.length > 1) {
              // Remove the first transaction from the array
              const remainingTransactions = result.extractedData.slice(1);

              return {
                ...result,
                extractedData: remainingTransactions,
                createdTransactions: [
                  ...(result.createdTransactions || []),
                  response.data.transaction,
                ],
                needsConfirmation: remainingTransactions.length > 0,
                status: "completed",
              };
            } else {
              // Single transaction completed
              return {
                ...result,
                transaction: response.data.transaction,
                createdTransactions: [
                  ...(result.createdTransactions || []),
                  response.data.transaction,
                ],
                needsConfirmation: false,
                status: "completed",
              };
            }
          }
          return result;
        })
      );

      toast.success("Transaction added successfully!");
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction. Please try again.");
    } finally {
      setCreatingTransaction(false);
    }
  };

  const handleQuickSkip = (resultId, sourceType) => {
    // Update upload results to skip current transaction
    setUploadResults((prev) =>
      prev.map((result) => {
        if (result.id === resultId) {
          const isArray = Array.isArray(result.extractedData);

          if (isArray && result.extractedData.length > 1) {
            // Remove the first transaction from the array
            const remainingTransactions = result.extractedData.slice(1);

            return {
              ...result,
              extractedData: remainingTransactions,
              needsConfirmation: remainingTransactions.length > 0,
              status:
                remainingTransactions.length > 0 ? "completed" : "completed",
            };
          } else {
            // Mark as completed without creating transaction
            return {
              ...result,
              needsConfirmation: false,
              status: "completed",
              message: "Transaction skipped by user",
            };
          }
        }
        return result;
      })
    );

    toast.success("Transaction skipped!");
  };

  // Confirm all remaining transactions
  const handleConfirmAll = async (resultId, sourceType) => {
    try {
      setCreatingTransaction(true);

      // Find the result with pending transactions
      const result = uploadResults.find((r) => r.id === resultId);
      if (
        !result ||
        !Array.isArray(result.extractedData) ||
        result.extractedData.length === 0
      ) {
        toast.error("No transactions to confirm");
        return;
      }

      const transactionsToAdd = result.extractedData;
      const createdTransactions = [];

      // Process each transaction
      for (const transactionData of transactionsToAdd) {
        try {
          const apiData = {
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
          };

          const response = await api.post("/transactions", apiData);
          createdTransactions.push(response.data.transaction);
        } catch (error) {
          console.error("Error creating transaction:", error);
          // Continue with other transactions even if one fails
        }
      }

      // Update upload results to mark all transactions as completed
      setUploadResults((prev) =>
        prev.map((r) => {
          if (r.id === resultId) {
            return {
              ...r,
              extractedData: [], // Clear all pending transactions
              createdTransactions: [
                ...(r.createdTransactions || []),
                ...createdTransactions,
              ],
              needsConfirmation: false,
              status: "completed",
            };
          }
          return r;
        })
      );

      toast.success(
        `Successfully added ${createdTransactions.length} transactions!`
      );
    } catch (error) {
      console.error("Error confirming all transactions:", error);
      toast.error("Failed to add all transactions. Please try again.");
    } finally {
      setCreatingTransaction(false);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    // For bank statements, use the selected format type
    const actualType = type === "statement" ? bankStatementType : type;

    // Validate file before uploading
    if (!validateFile(file, actualType)) {
      return;
    }

    const formData = new FormData();
    formData.append(actualType, file);

    try {
      setUploading(true);
      let endpoint;
      if (actualType === "receipt") {
        endpoint = "/files/receipt";
      } else if (actualType === "pdf") {
        endpoint = "/files/pdf";
      } else if (actualType === "image") {
        endpoint = "/files/image";
      }

      const response = await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (actualType === "pdf" || actualType === "image") {
        // PDF and Image processing are synchronous - handle response immediately
        console.log(
          `📄 ${actualType.toUpperCase()} Response received:`,
          response.data
        );

        const { transactionsCreated, message, extractedData } = response.data;
        console.log("📊 Transactions data:", extractedData);

        if (extractedData && extractedData.length > 0) {
          // Show success message
          toast.success(
            `🎉 ${actualType.toUpperCase()} processed successfully! Found ${
              extractedData.length
            } transaction(s). Please review and confirm each one.`
          );

          // Add processing result
          const resultId = Date.now();
          setUploadResults((prev) => [
            ...prev,
            {
              id: resultId,
              filename: file.name,
              type: actualType,
              status: "completed",
              timestamp: new Date(),
              extractedData: extractedData,
              message,
              needsConfirmation: true,
            },
          ]);

          // Auto-show confirmation modal for first transaction
          if (extractedData[0]) {
            // showTransactionConfirmation(extractedData[0], resultId, actualType);
          }
        } else {
          // No transactions found
          toast.warning(
            `⚠️ ${actualType.toUpperCase()} processed but no transactions were found. Please check if the file contains a valid bank statement.`
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
        // Receipt processing is asynchronous - show processing status
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

      // Show specific error message for PDF/Image processing failures
      if (actualType === "pdf" || actualType === "image") {
        // Handle AI service specific errors
        if (errorMessage.includes("temporarily unavailable")) {
          toast.error(
            `🤖 AI Service Temporarily Unavailable: The AI service is currently overloaded. Please try again in a few minutes.`,
            { duration: 6000 }
          );
        } else if (errorMessage.includes("rate limit")) {
          toast.error(
            `⏰ Rate Limit Exceeded: Please wait a moment before trying again.`,
            { duration: 5000 }
          );
        } else if (errorMessage.includes("quota exceeded")) {
          toast.error(
            `📊 Service Quota Exceeded: Please contact support for assistance.`,
            { duration: 6000 }
          );
        } else if (error.response?.status === 500) {
          toast.error(
            `❌ Failed to process ${actualType.toUpperCase()}. ${errorMessage}`,
            { duration: 5000 }
          );
        } else {
          toast.error(
            `❌ ${actualType.toUpperCase()} Processing Error: ${errorMessage}`,
            { duration: 4000 }
          );
        }

        // Add failed result for PDF/Image
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

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "processing":
        return "Processing...";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload & Process</h1>
        <p className="text-gray-600">
          Upload receipts and bank statements to automatically extract
          transactions
        </p>
      </div>

      {/* Tabs */}
      <UploadTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Upload Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {activeTab === "receipt" && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Receipt
              </h2>
              <FileUploadZone
                type="receipt"
                accept="image/*"
                title="Receipt Scanner"
                description="Upload photos of your receipts to automatically extract transaction data"
                icon={Image}
                onFileUpload={handleFileUpload}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              />

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  How it works:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Take a clear photo of your receipt</li>
                  <li>• Our AI will extract merchant, amount, and date</li>
                  <li>• Review and confirm the extracted data</li>
                  <li>• Transaction is automatically added to your records</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "statement" && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Import Bank Statement
              </h2>

              {/* Format Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Choose Statement Format:
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setBankStatementType("pdf")}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      bankStatementType === "pdf"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <FileText className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-medium text-gray-900">
                        PDF Statement
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Official bank statements in PDF format
                    </p>
                  </button>

                  <button
                    onClick={() => setBankStatementType("image")}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      bankStatementType === "image"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Image className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="font-medium text-gray-900">
                        Image/Screenshot
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Screenshots or photos of statements
                    </p>
                  </button>
                </div>
              </div>

              {/* Upload Zone */}
              <FileUploadZone
                type="statement"
                accept={
                  bankStatementType === "pdf" ? ".pdf" : ".png,.jpg,.jpeg"
                }
                title={
                  bankStatementType === "pdf"
                    ? "PDF Statement Import"
                    : "Image Statement Import"
                }
                description={
                  bankStatementType === "pdf"
                    ? "Upload your bank statement PDF to import multiple transactions at once"
                    : "Upload screenshots or photos of your bank statements to extract transactions"
                }
                icon={bankStatementType === "pdf" ? FileText : Image}
                onFileUpload={handleFileUpload}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              />

              {/* Format-specific information */}
              {bankStatementType === "pdf" ? (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    PDF Requirements:
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Official bank or credit card statements</li>
                    <li>• PDF must contain selectable text</li>
                    <li>• Transaction history with dates and amounts</li>
                    <li>• Maximum file size: 5MB</li>
                  </ul>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Image Requirements:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Screenshots from banking apps</li>
                      <li>• Photos of printed statements</li>
                      <li>• PNG, JPG, or JPEG formats</li>
                      <li>• Clear, high-resolution images</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      📸 Tips for Better Results:
                    </h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Ensure text is clear and readable</li>
                      <li>
                        • Include transaction dates, descriptions, and amounts
                      </li>
                      <li>• Good lighting improves accuracy</li>
                      <li>• Avoid blurry or low-resolution images</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Processing Status & Recent Uploads */}
        <div className="space-y-6">
          <ProcessingStatus uploading={uploading} />

          <UploadResults
            uploadResults={uploadResults}
            showTransactionConfirmation={showTransactionConfirmation}
            navigate={navigate}
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

      {/* Transaction Confirmation Modal */}
      <TransactionConfirmModal
        showConfirmModal={showConfirmModal}
        editingTransaction={editingTransaction}
        creatingTransaction={creatingTransaction}
        onClose={closeConfirmModal}
        onEditChange={handleEditChange}
        onCreateTransaction={handleCreateTransaction}
      />
    </div>
  );
}

export default Upload;
