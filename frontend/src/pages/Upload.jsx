import { useState, useEffect } from "react";
import {
  Upload as UploadIcon,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  ArrowRight,
  TrendingUp,
  X,
  Edit3,
  Save,
  Calendar,
  DollarSign,
  Tag,
  FileTextIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";

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
            showTransactionConfirmation(extractedData[0], resultId, actualType);
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

  const FileUploadZone = ({ type, accept, title, description, icon: Icon }) => (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
      onDrop={(e) => handleDrop(e, type)}
      onDragOver={handleDragOver}
    >
      <Icon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>

      <label className="btn-primary cursor-pointer inline-block">
        Choose File
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files[0]) {
              handleFileUpload(e.target.files[0], type);
            }
          }}
        />
      </label>

      <p className="text-sm text-gray-500 mt-2">
        or drag and drop your file here
      </p>
    </div>
  );

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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("receipt")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "receipt"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Receipt Upload
          </button>
          <button
            onClick={() => setActiveTab("statement")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "statement"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Bank Statement Import
          </button>
        </nav>
      </div>

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
          {uploading && (
            <div className="card">
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="large" className="mr-4" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Processing your file...
                  </p>
                  <p className="text-gray-600">This may take a few moments</p>
                </div>
              </div>
            </div>
          )}

          {uploadResults.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Uploads
              </h3>
              <div className="space-y-3">
                {uploadResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {result.type === "receipt" ? (
                          <Image className="h-8 w-8 text-gray-400 mr-3" />
                        ) : (
                          <FileText className="h-8 w-8 text-gray-400 mr-3" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {result.filename}
                          </p>
                          <p className="text-sm text-gray-500">
                            {result.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(result.status)}
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {getStatusText(result.status)}
                        </span>
                      </div>
                    </div>

                    {/* Show extracted data for completed receipts only (not PDF/Image with confirmation needed) */}
                    {result.status === "completed" &&
                      result.extractedData &&
                      result.type === "receipt" && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-800 mb-2">
                            📄 Extracted Data:
                          </h4>

                          {Array.isArray(result.extractedData) ? (
                            // Multiple transactions (should not happen for receipts, but handle just in case)
                            <div className="space-y-3">
                              <p className="text-sm text-green-700 mb-3">
                                Found {result.extractedData.length}{" "}
                                transaction(s). Review and confirm each one:
                              </p>
                              {result.extractedData.map((data, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-green-50 rounded-lg border border-green-200"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        Description:
                                      </span>
                                      <span className="ml-2 text-gray-600">
                                        {data.merchant ||
                                          data.description ||
                                          "N/A"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        Amount:
                                      </span>
                                      <span className="ml-2 text-gray-600">
                                        ${data.amount || "N/A"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        Date:
                                      </span>
                                      <span className="ml-2 text-gray-600">
                                        {data.date || "N/A"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        Category:
                                      </span>
                                      <span className="ml-2 text-gray-600">
                                        {data.category || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      showTransactionConfirmation(
                                        data,
                                        result.id,
                                        result.type
                                      )
                                    }
                                    className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                                  >
                                    <Edit3 className="h-4 w-4 mr-1" />
                                    Review & Confirm Transaction {idx + 1}
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Single transaction (Receipt processing)
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Merchant:
                                  </span>
                                  <span className="ml-2 text-gray-600">
                                    {result.extractedData.merchant || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Amount:
                                  </span>
                                  <span className="ml-2 text-gray-600">
                                    ${result.extractedData.amount || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Date:
                                  </span>
                                  <span className="ml-2 text-gray-600">
                                    {result.extractedData.date || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Category:
                                  </span>
                                  <span className="ml-2 text-gray-600">
                                    {result.extractedData.category || "N/A"}
                                  </span>
                                </div>
                              </div>

                              {result.extractedData.items &&
                                result.extractedData.items.length > 0 && (
                                  <div className="mt-3">
                                    <span className="font-medium text-gray-700">
                                      Items:
                                    </span>
                                    <div className="ml-2 text-sm text-gray-600">
                                      {result.extractedData.items
                                        .slice(0, 3)
                                        .map((item, idx) => (
                                          <div key={idx}>
                                            • {item.name} (${item.price})
                                          </div>
                                        ))}
                                      {result.extractedData.items.length >
                                        3 && (
                                        <div>
                                          ... and{" "}
                                          {result.extractedData.items.length -
                                            3}{" "}
                                          more items
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                              <div className="mt-3 flex space-x-2">
                                {result.transaction ? (
                                  <button
                                    onClick={() => navigate("/transactions")}
                                    className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Transaction
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      showTransactionConfirmation(
                                        result.extractedData,
                                        result.receiptId || result.id,
                                        "receipt"
                                      )
                                    }
                                    className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                                  >
                                    <Edit3 className="h-4 w-4 mr-1" />
                                    Review & Confirm Transaction
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                    {/* Show PDF/Image processing results with confirmation */}
                    {(result.type === "pdf" || result.type === "image") &&
                      result.status === "completed" &&
                      result.needsConfirmation &&
                      result.extractedData && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-800 mb-2">
                            📊 {result.type.toUpperCase()} Processing Results:
                          </h4>
                          <div className="text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-700">
                                Transactions Found:
                              </span>
                              <span className="ml-2 text-blue-600 font-semibold">
                                {Array.isArray(result.extractedData)
                                  ? result.extractedData.length
                                  : 1}
                              </span>
                            </div>

                            {/* Show created transactions count */}
                            {result.createdTransactions &&
                              result.createdTransactions.length > 0 && (
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-green-700">
                                    Transactions Created:
                                  </span>
                                  <span className="ml-2 text-green-600 font-semibold">
                                    {result.createdTransactions.length}
                                  </span>
                                </div>
                              )}

                            {result.message && (
                              <div className="text-gray-600 text-xs mb-3">
                                {result.message}
                              </div>
                            )}

                            {/* Preview of first transaction */}
                            {result.extractedData && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <h5 className="font-medium text-blue-900 mb-2">
                                  Preview (First Transaction):
                                </h5>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium text-blue-700">
                                      Description:
                                    </span>
                                    <p className="text-blue-800">
                                      {Array.isArray(result.extractedData)
                                        ? result.extractedData[0]
                                            ?.description ||
                                          result.extractedData[0]?.merchant ||
                                          "N/A"
                                        : result.extractedData.description ||
                                          result.extractedData.merchant ||
                                          "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-700">
                                      Amount:
                                    </span>
                                    <p className="text-blue-800">
                                      $
                                      {Array.isArray(result.extractedData)
                                        ? result.extractedData[0]?.amount ||
                                          "0.00"
                                        : result.extractedData.amount || "0.00"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() =>
                                showTransactionConfirmation(
                                  Array.isArray(result.extractedData)
                                    ? result.extractedData[0]
                                    : result.extractedData,
                                  result.id,
                                  result.type
                                )
                              }
                              className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Review & Confirm
                              {Array.isArray(result.extractedData) &&
                              result.extractedData.length > 1
                                ? ` (${
                                    result.createdTransactions?.length || 0
                                  } of ${
                                    (result.createdTransactions?.length || 0) +
                                    result.extractedData.length
                                  } done)`
                                : " Transaction"}
                            </button>

                            {Array.isArray(result.extractedData) &&
                              result.extractedData.length > 1 && (
                                <span className="text-xs text-gray-500 py-1 px-2 bg-gray-100 rounded">
                                  {result.extractedData.length - 1} more to
                                  review
                                </span>
                              )}
                          </div>
                        </div>
                      )}

                    {/* Show completed PDF/Image processing results */}
                    {(result.type === "pdf" || result.type === "image") &&
                      result.status === "completed" &&
                      !result.needsConfirmation &&
                      result.createdTransactions &&
                      result.createdTransactions.length > 0 && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-800 mb-2">
                            ✅ {result.type.toUpperCase()} Processing Complete:
                          </h4>
                          <div className="text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-700">
                                Transactions Created:
                              </span>
                              <span className="ml-2 text-green-600 font-semibold">
                                {result.createdTransactions.length}
                              </span>
                            </div>
                            <div className="text-gray-600 text-xs mb-3">
                              All transactions have been successfully created!
                            </div>
                          </div>

                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => navigate("/transactions")}
                              className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View All Transactions
                            </button>
                            <button
                              onClick={() => navigate("/analytics")}
                              className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                            >
                              <TrendingUp className="h-4 w-4 mr-1" />
                              View Analytics
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Show PDF processing results after confirmation (legacy single transaction) */}
                    {result.type === "pdf" &&
                      result.status === "completed" &&
                      !result.needsConfirmation &&
                      result.transaction &&
                      !result.createdTransactions && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-800 mb-2">
                            ✅ PDF Transaction Created:
                          </h4>
                          <div className="text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-700">
                                Transaction:
                              </span>
                              <span className="ml-2 text-green-600 font-semibold">
                                Successfully Created
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => navigate("/transactions")}
                              className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Transaction
                            </button>
                            <button
                              onClick={() => navigate("/analytics")}
                              className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                            >
                              <TrendingUp className="h-4 w-4 mr-1" />
                              View Analytics
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Show Image processing results after confirmation */}
                    {result.type === "image" &&
                      result.status === "completed" &&
                      !result.needsConfirmation &&
                      result.transaction && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-800 mb-2">
                            ✅ Image Transaction Created:
                          </h4>
                          <div className="text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-700">
                                Transaction:
                              </span>
                              <span className="ml-2 text-green-600 font-semibold">
                                Successfully Created
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => navigate("/transactions")}
                              className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Transaction
                            </button>
                            <button
                              onClick={() => navigate("/analytics")}
                              className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                            >
                              <TrendingUp className="h-4 w-4 mr-1" />
                              View Analytics
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Show legacy PDF processing results (for backwards compatibility) */}
                    {result.type === "pdf" &&
                      result.status === "completed" &&
                      !result.needsConfirmation &&
                      !result.transaction &&
                      result.transactionsCreated > 0 && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-800 mb-2">
                            📊 PDF Processing Results:
                          </h4>
                          <div className="text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-700">
                                Transactions Created:
                              </span>
                              <span className="ml-2 text-blue-600 font-semibold">
                                {result.transactionsCreated || 0}
                              </span>
                            </div>
                            {result.message && (
                              <div className="text-gray-600 text-xs">
                                {result.message}
                              </div>
                            )}
                          </div>

                          {result.transactionsCreated > 0 && (
                            <div className="mt-3 flex space-x-2">
                              <button
                                onClick={() => navigate("/transactions")}
                                className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Transactions
                              </button>
                              <button
                                onClick={() => navigate("/analytics")}
                                className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                              >
                                <TrendingUp className="h-4 w-4 mr-1" />
                                View Analytics
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Show error for failed receipts */}
                    {result.status === "failed" && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-800 text-sm font-medium mb-1">
                          ❌{" "}
                          {result.type === "pdf"
                            ? "PDF Processing Failed"
                            : "Receipt Processing Failed"}
                        </p>
                        <p className="text-red-700 text-sm">
                          {result.error ||
                            "Processing failed. Please try uploading again."}
                        </p>
                        {result.type === "pdf" && (
                          <div className="mt-2 text-xs text-red-600">
                            💡 Tips: Ensure your PDF contains selectable text or
                            clear scanned images. Password-protected PDFs are
                            not supported.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tips for Better Results
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  For Receipts:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ensure the receipt is well-lit and clear</li>
                  <li>• Capture the entire receipt including totals</li>
                  <li>• Avoid shadows and reflections</li>
                  <li>• Keep the receipt flat and straight</li>
                  <li>• Use JPEG, PNG, GIF, or WebP formats</li>
                  <li>• Maximum file size: 5MB</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">For PDFs:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use official bank or credit card statements</li>
                  <li>• Ensure the PDF contains selectable text</li>
                  <li>• One statement file at a time works best</li>
                  <li>• Check that all transactions are visible</li>
                  <li>• Maximum file size: 5MB</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Troubleshooting:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• If processing fails, try a higher quality image</li>
                  <li>• Avoid blurry or corrupted images</li>
                  <li>• Check that text is clearly visible in the image</li>
                  <li>
                    • Try uploading from a different device if issues persist
                  </li>
                  <li>
                    • If you see "AI service temporarily unavailable", wait a
                    few minutes and try again
                  </li>
                  <li>
                    • For rate limit errors, wait 30-60 seconds before retrying
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <UploadIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Smart Upload</h3>
          <p className="text-sm text-gray-600">
            Drag & drop or click to upload
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">AI Processing</h3>
          <p className="text-sm text-gray-600">Automatic data extraction</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Image className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">OCR Technology</h3>
          <p className="text-sm text-gray-600">Text recognition from images</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">PDF Parsing</h3>
          <p className="text-sm text-gray-600">Extract from bank statements</p>
        </div>
      </div>

      {/* Transaction Confirmation Modal */}
      {showConfirmModal && editingTransaction && (
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
                    Review and edit the extracted information before creating
                    the transaction
                  </p>
                </div>
              </div>
              <button
                onClick={closeConfirmModal}
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
                    onChange={(e) =>
                      handleEditChange("description", e.target.value)
                    }
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
                    onChange={(e) => handleEditChange("amount", e.target.value)}
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
                    onChange={(e) => handleEditChange("date", e.target.value)}
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
                    onChange={(e) =>
                      handleEditChange("category", e.target.value)
                    }
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
                    onChange={(e) => handleEditChange("type", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              {/* Items (if available) */}
              {editingTransaction.items &&
                editingTransaction.items.length > 0 && (
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
                    <span className="text-blue-700 font-medium">
                      Description:
                    </span>
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
                onClick={closeConfirmModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTransaction}
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
      )}
    </div>
  );
}

export default Upload;
