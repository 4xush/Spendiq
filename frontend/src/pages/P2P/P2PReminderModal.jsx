import { useState } from "react";
import { Bell, Clock, X } from "lucide-react";

const P2PReminderModal = ({ isOpen, onClose, transaction, onSetReminder }) => {
  const [reminderTime, setReminderTime] = useState("60"); // minutes
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");

  if (!isOpen || !transaction) return null;

  const handleSetReminder = () => {
    const minutes = isCustomTime
      ? parseInt(customMinutes) || 60
      : parseInt(reminderTime);
    onSetReminder(transaction, minutes);
    onClose();
    setReminderTime("60");
    setIsCustomTime(false);
    setCustomMinutes("");
  };

  const quickOptions = [
    { value: "5", label: "5 min", icon: "⚡" },
    { value: "30", label: "30 min", icon: "⏰" },
    { value: "60", label: "1 hour", icon: "🕐" },
    { value: "1440", label: "1 day", icon: "📅" },
  ];

  const actionText =
    transaction.personToPerson?.type === "lent" ? "collect from" : "pay back";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Set Reminder
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Transaction Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {transaction.personToPerson?.type === "lent" ? "💸" : "💰"}
            </span>
            <div>
              <h4 className="font-medium text-gray-900">
                {transaction.personToPerson?.personName}
              </h4>
              <p className="text-sm text-gray-600">
                {actionText} ₹{transaction.amount?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Reminder Time Options */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Remind me in:
          </label>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {quickOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setReminderTime(option.value);
                  setIsCustomTime(false);
                }}
                className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  reminderTime === option.value && !isCustomTime
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Custom Time */}
          <button
            onClick={() => setIsCustomTime(true)}
            className={`w-full p-3 rounded-xl border-2 transition-all text-sm font-medium ${
              isCustomTime
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Custom time</span>
            </div>
          </button>

          {isCustomTime && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="30"
                  min="1"
                  max="10080"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <span className="text-sm text-gray-600">minutes</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum: 7 days (10,080 minutes)
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSetReminder}
            disabled={isCustomTime && !customMinutes}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Set Reminder
          </button>
        </div>

        {/* Permission Notice */}
        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
          <p className="text-xs text-amber-700">
            <span className="font-medium">Note:</span> Browser notifications
            will be requested when you set your first reminder.
          </p>
        </div>
      </div>
    </div>
  );
};

export default P2PReminderModal;
