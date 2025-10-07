const FileUploadZone = ({
  type,
  accept,
  title,
  description,
  icon: Icon,
  onFileUpload,
  onDrop,
  onDragOver,
}) => (
  <div
    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
    onDrop={(e) => onDrop(e, type)}
    onDragOver={onDragOver}
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
            onFileUpload(e.target.files[0], type);
          }
        }}
      />
    </label>

    <p className="text-sm text-gray-500 mt-2">
      or drag and drop your file here
    </p>
  </div>
);

export default FileUploadZone;
