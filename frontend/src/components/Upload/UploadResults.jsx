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

const UploadResults = ({
  uploadResults,
  showTransactionConfirmation,
  navigate,
  getStatusIcon,
  getStatusText,
}) => {
  if (uploadResults.length === 0) return null;

  return (
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
                  <p className="font-medium text-gray-900">{result.filename}</p>
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

            {/* Show extracted data for completed receipts only */}
            {result.status === "completed" &&
              result.extractedData &&
              result.type === "receipt" &&
              !Array.isArray(result.extractedData) && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">
                    📄 Extracted Data:
                  </h4>

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
                      <span className="font-medium text-gray-700">Amount:</span>
                      <span className="ml-2 text-gray-600">
                        ${result.extractedData.amount || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date:</span>
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
                          {result.extractedData.items.length > 3 && (
                            <div>
                              ... and {result.extractedData.items.length - 3}{" "}
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
                                ? result.extractedData[0]?.description ||
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
                                ? result.extractedData[0]?.amount || "0.00"
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
                        ? ` (${result.createdTransactions?.length || 0} of ${
                            (result.createdTransactions?.length || 0) +
                            result.extractedData.length
                          } done)`
                        : " Transaction"}
                    </button>

                    {Array.isArray(result.extractedData) &&
                      result.extractedData.length > 1 && (
                        <span className="text-xs text-gray-500 py-1 px-2 bg-gray-100 rounded">
                          {result.extractedData.length - 1} more to review
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

            {/* Show legacy PDF processing results (for backwards compatibility) */}
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
                    : result.type === "image"
                    ? "Image Processing Failed"
                    : "Receipt Processing Failed"}
                </p>
                <p className="text-red-700 text-sm">
                  {result.error ||
                    "Processing failed. Please try uploading again."}
                </p>
                {(result.type === "pdf" || result.type === "image") && (
                  <div className="mt-2 text-xs text-red-600">
                    💡 Tips: Ensure your{" "}
                    {result.type === "pdf"
                      ? "PDF contains selectable text or clear scanned images. Password-protected PDFs are not supported"
                      : "image is clear and readable with good lighting"}
                    .
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadResults;
