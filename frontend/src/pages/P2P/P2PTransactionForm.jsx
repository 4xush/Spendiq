import { useState } from "react";
import { X, User, Phone, Calendar, FileText } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const P2PTransactionForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: "lent",
    amount: "",
    personName: "",
    personContact: "",
    description: "",
    dueDate: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const p2pTypes = [
    {
      value: "lent",
      label: "💸 Lent Money",
      desc: "You gave money to someone",
    },
    {
      value: "borrowed",
      label: "💰 Borrowed Money",
      desc: "You received money from someone",
    },
    {
      value: "gift_given",
      label: "🎁 Gift Given",
      desc: "You gave money as a gift",
    },
    {
      value: "gift_received",
      label: "🎉 Gift Received",
      desc: "You received money as a gift",
    },
    {
      value: "payment",
      label: "💳 Payment Made",
      desc: "You paid someone for services/goods",
    },
    {
      value: "reimbursement",
      label: "💸 Reimbursement",
      desc: "Someone owes you money back",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post("/transactions/p2p", formData);

      toast.success("P2P transaction created successfully!");
      onSuccess?.(response.data.transaction);
      onClose();

      // Reset form
      setFormData({
        type: "lent",
        amount: "",
        personName: "",
        personContact: "",
        description: "",
        dueDate: "",
        notes: "",
      });
    } catch (error) {
      console.error("Failed to create P2P transaction:", error);
      toast.error(
        error.response?.data?.error || "Failed to create transaction"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedType = p2pTypes.find((type) => type.value === formData.type);

  return (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[9999]"
      style={{ margin: 0 }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Add P2P Transaction
            </h2>
            <p className="text-sm text-gray-600">
              Track money between you and others
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6">
            <div className="space-y-6">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Transaction Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {p2pTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.type === type.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-500">{type.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amount and Person Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      required
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Person Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="personName"
                      value={formData.personName}
                      onChange={handleChange}
                      placeholder="Enter person's name"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Contact and Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="personContact"
                      value={formData.personContact}
                      onChange={handleChange}
                      placeholder="Phone or email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {(formData.type === "lent" || formData.type === "borrowed") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What was this transaction for?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional notes or details..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Transaction Summary */}
              {selectedType && formData.amount && formData.personName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Transaction Summary
                  </h4>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">
                      {selectedType.label.replace(/[^a-zA-Z\s]/g, "")}
                    </span>
                    <br />
                    <span className="font-semibold">₹{formData.amount}</span>{" "}
                    {formData.type.includes("given") ||
                    formData.type === "lent" ||
                    formData.type === "payment"
                      ? "to"
                      : "from"}{" "}
                    <span className="font-medium">{formData.personName}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting || !formData.amount || !formData.personName
              }
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create Transaction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default P2PTransactionForm;
