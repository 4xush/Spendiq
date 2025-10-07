import {
  Upload as UploadIcon,
  CheckCircle,
  Image,
  FileText,
} from "lucide-react";

const FeaturesInfo = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
        <UploadIcon className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="font-medium text-gray-900 mb-1">Smart Upload</h3>
      <p className="text-sm text-gray-600">Drag & drop or click to upload</p>
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
);

export default FeaturesInfo;
