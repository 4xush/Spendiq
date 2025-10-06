import { useState } from "react";
import {
  Upload as UploadIcon,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";

function Upload() {
  const [activeTab, setActiveTab] = useState("receipt");
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file);

    try {
      setUploading(true);
      const endpoint = type === "receipt" ? "/files/receipt" : "/files/pdf";
      const response = await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        `${type === "receipt" ? "Receipt" : "PDF"} uploaded successfully!`
      );

      // Add to results
      setUploadResults((prev) => [
        ...prev,
        {
          id: response.data.receiptId || Date.now(),
          filename: file.name,
          type,
          status: "processing",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload ${type}`);
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
            onClick={() => setActiveTab("pdf")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pdf"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            PDF Import
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

          {activeTab === "pdf" && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Import Bank Statement
              </h2>
              <FileUploadZone
                type="pdf"
                accept=".pdf"
                title="PDF Statement Import"
                description="Upload your bank statement PDF to import multiple transactions at once"
                icon={FileText}
              />

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">
                  Supported formats:
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Bank statements in PDF format</li>
                  <li>• Credit card statements</li>
                  <li>• Transaction history exports</li>
                  <li>• Tabular data with dates, descriptions, and amounts</li>
                </ul>
              </div>
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
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
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
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">For PDFs:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use official bank or credit card statements</li>
                  <li>• Ensure the PDF contains selectable text</li>
                  <li>• One statement file at a time works best</li>
                  <li>• Check that all transactions are visible</li>
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
    </div>
  );
}

export default Upload;
