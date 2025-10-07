import LoadingSpinner from "../LoadingSpinner";

const ProcessingStatus = ({ uploading }) => {
  if (!uploading) return null;

  return (
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
  );
};

export default ProcessingStatus;
