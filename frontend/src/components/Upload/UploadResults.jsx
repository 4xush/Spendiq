import {
  Image,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Edit3,
  TrendingUp,
} from "lucide-react";

// Reusable Components
const ActionButton = ({ onClick, icon: Icon, variant = "blue", children, disabled }) => {
  const variants = {
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    green: "bg-green-100 text-green-700 hover:bg-green-200",
    greenSolid: "bg-green-500 text-white hover:bg-green-600",
    graySolid: "bg-gray-500 text-white hover:bg-gray-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-sm ${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
      {children}
    </button>
  );
};

const NavigationButtons = ({ navigate }) => (
  <div className="flex flex-wrap gap-2">
    <ActionButton onClick={() => navigate("/transactions")} icon={Eye} variant="green">
      View Transactions
    </ActionButton>
    <ActionButton onClick={() => navigate("/analytics")} icon={TrendingUp} variant="blue">
      Analytics
    </ActionButton>
  </div>
);

const ProgressBar = ({ current, total }) => {
  const percentage = (current / total) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-blue-600 font-medium">
        {current}/{total}
      </div>
      <div className="w-16 bg-blue-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const DataField = ({ label, value }) => (
  <div>
    <span className="font-medium text-gray-700 text-xs sm:text-sm">{label}:</span>
    <span className="ml-2 text-gray-600 text-xs sm:text-sm">{value || "N/A"}</span>
  </div>
);

// Main Component
const UploadResults = ({
  uploadResults,
  showTransactionConfirmation,
  navigate,
  getStatusIcon,
  getStatusText,
  onQuickAdd,
  onQuickSkip,
  onConfirmAll,
  creatingTransaction,
}) => {
  if (uploadResults.length === 0) return null;

  // Helper to get current transaction data
  const getCurrentTransaction = (result) => {
    return Array.isArray(result.extractedData)
      ? result.extractedData[0]
      : result.extractedData;
  };

  const getRemainingCount = (result) => {
    return Array.isArray(result.extractedData)
      ? result.extractedData.length - (result.createdTransactions?.length || 0)
      : 0;
  };

  // Render extracted receipt data
  const renderReceiptData = (result) => {
    if (
      result.status !== "completed" ||
      !result.extractedData ||
      result.type !== "receipt" ||
      Array.isArray(result.extractedData)
    ) {
      return null;
    }

    const data = result.extractedData;

    return (
      <div className="mt-4 p-3 sm:p-4 bg-white rounded-xl border border-green-200">
        <h4 className="font-medium text-green-800 text-sm mb-3">📄 Receipt Data</h4>

        <div className="grid sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
          <DataField label="Merchant" value={data.merchant} />
          <DataField label="Amount" value={`$${data.amount}`} />
          <DataField label="Date" value={data.date} />
          <DataField label="Category" value={data.category} />
        </div>

        {data.items?.length > 0 && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700 text-xs">Items:</span>
            <div className="mt-1 text-xs text-gray-600 space-y-0.5">
              {data.items.slice(0, 3).map((item, idx) => (
                <div key={idx}>• {item.name} (${item.price})</div>
              ))}
              {data.items.length > 3 && (
                <div className="text-gray-500">... and {data.items.length - 3} more</div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {result.transaction ? (
            <ActionButton onClick={() => navigate("/transactions")} icon={Eye} variant="green">
              View Transaction
            </ActionButton>
          ) : (
            <>
              <ActionButton
                onClick={() =>
                  showTransactionConfirmation(data, result.receiptId || result.id, "receipt")
                }
                icon={Edit3}
                variant="blue"
              >
                Review & Edit
              </ActionButton>

              <div className="grid sm:grid-cols-2 gap-2">
                <ActionButton
                  onClick={() => onQuickAdd?.(data, result.receiptId || result.id, "receipt")}
                  icon={CheckCircle}
                  variant="greenSolid"
                  disabled={creatingTransaction}
                >
                  {creatingTransaction ? "Adding..." : "✓ Accept"}
                </ActionButton>

                <ActionButton
                  onClick={() => onQuickSkip?.(result.receiptId || result.id, "receipt")}
                  icon={AlertCircle}
                  variant="graySolid"
                  disabled={creatingTransaction}
                >
                  ✗ Reject
                </ActionButton>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render pending confirmation (PDF/Image with transactions to review)
  const renderPendingConfirmation = (result) => {
    if (
      !(result.type === "pdf" || result.type === "image") ||
      result.status !== "completed" ||
      !result.needsConfirmation ||
      !result.extractedData
    ) {
      return null;
    }

    const current = getCurrentTransaction(result);
    const isMultiple = Array.isArray(result.extractedData) && result.extractedData.length > 1;
    const totalCount = isMultiple ? result.extractedData.length : 1;
    const createdCount = result.createdTransactions?.length || 0;
    const remaining = getRemainingCount(result);

    return (
      <div className="mt-4 p-3 sm:p-4 bg-white rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-blue-800 text-sm">
            📊 {result.type.toUpperCase()} Results
          </h4>
          {isMultiple && <ProgressBar current={createdCount} total={totalCount + createdCount} />}
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="font-medium text-gray-700">Found:</span>
            <span className="font-semibold text-blue-600">{totalCount}</span>
          </div>

          {createdCount > 0 && (
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="font-medium text-green-700">Created:</span>
              <span className="font-semibold text-green-600">{createdCount}</span>
            </div>
          )}
        </div>

        {current && (
          <div className="p-3 bg-blue-50 rounded-lg mb-3">
            <h5 className="font-medium text-blue-900 text-xs mb-2">Preview (First):</h5>
            <div className="grid sm:grid-cols-2 gap-2">
              <DataField
                label="Description"
                value={current.description || current.merchant}
              />
              <DataField label="Amount" value={`$${current.amount || "0.00"}`} />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <ActionButton
              onClick={() => showTransactionConfirmation(current, result.id, result.type)}
              icon={Edit3}
              variant="blue"
            >
              Review {isMultiple && `(${createdCount}/${createdCount + totalCount})`}
            </ActionButton>

            {isMultiple && (
              <span className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium flex items-center">
                {remaining} more
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <ActionButton
              onClick={() => onQuickAdd?.(current, result.id, result.type)}
              icon={CheckCircle}
              variant="greenSolid"
              disabled={creatingTransaction}
            >
              {creatingTransaction ? "Adding..." : "✓ Quick Add"}
              {remaining > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-600 rounded-full text-xs">
                  {remaining}
                </span>
              )}
            </ActionButton>

            <ActionButton
              onClick={() => onQuickSkip?.(result.id, result.type)}
              icon={AlertCircle}
              variant="graySolid"
              disabled={creatingTransaction}
            >
              ⏭ Skip
            </ActionButton>
          </div>

          {isMultiple && (
            <ActionButton
              onClick={() => onConfirmAll?.(result.id, result.type)}
              icon={CheckCircle}
              variant="blue"
              disabled={creatingTransaction}
            >
              {creatingTransaction ? "Adding All..." : `✓ Confirm All (${totalCount})`}
            </ActionButton>
          )}
        </div>
      </div>
    );
  };

  // Render completed status (all transactions created)
  const renderCompleted = (result) => {
    const hasCreated = result.createdTransactions?.length > 0;
    const hasSingleTransaction = result.transaction && !result.createdTransactions;
    
    if (
      result.status !== "completed" ||
      result.needsConfirmation ||
      (!hasCreated && !hasSingleTransaction)
    ) {
      return null;
    }

    const count = result.createdTransactions?.length || (hasSingleTransaction ? 1 : result.transactionsCreated || 0);
    
    if (count === 0) return null;

    return (
      <div className="mt-4 p-3 sm:p-4 bg-white rounded-xl border border-green-200">
        <h4 className="font-medium text-green-800 text-sm mb-2">
          ✅ {result.type?.toUpperCase() || "Processing"} Complete
        </h4>
        <div className="flex justify-between items-center text-xs sm:text-sm mb-3">
          <span className="font-medium text-gray-700">Transactions Created:</span>
          <span className="font-semibold text-green-600">{count}</span>
        </div>
        <NavigationButtons navigate={navigate} />
      </div>
    );
  };

  // Render failed status
  const renderError = (result) => {
    if (result.status !== "failed") return null;

    const typeLabels = {
      pdf: "PDF Processing Failed",
      image: "Image Processing Failed",
      receipt: "Receipt Processing Failed",
    };

    const tips = {
      pdf: "PDF contains selectable text or clear scanned images. Password-protected PDFs are not supported",
      image: "image is clear and readable with good lighting",
    };

    return (
      <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-800 text-sm font-medium mb-1">
          ❌ {typeLabels[result.type] || "Processing Failed"}
        </p>
        <p className="text-red-700 text-xs sm:text-sm">
          {result.error || "Processing failed. Please try again."}
        </p>
        {tips[result.type] && (
          <div className="mt-2 text-xs text-red-600">💡 Tip: Ensure your {tips[result.type]}.</div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h3>
      <div className="space-y-3">
        {uploadResults.map((result) => (
          <div
            key={result.id}
            className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                {result.type === "receipt" ? (
                  <Image className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 flex-shrink-0" />
                ) : (
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    {result.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {result.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusIcon(result.status)}
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  {getStatusText(result.status)}
                </span>
              </div>
            </div>

            {/* Dynamic Content */}
            {renderReceiptData(result)}
            {renderPendingConfirmation(result)}
            {renderCompleted(result)}
            {renderError(result)}

            {/* Skipped message */}
            {result.status === "completed" &&
              result.type === "receipt" &&
              !result.extractedData &&
              result.message && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-300">
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadResults;
