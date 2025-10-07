const UploadTabs = ({ activeTab, setActiveTab }) => (
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
);

export default UploadTabs;
