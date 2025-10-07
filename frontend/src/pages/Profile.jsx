import { useState, useEffect } from "react";
import {
  User,
  Save,
  Settings,
  Shield,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";

function Profile() {
  const { user, loadUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    preferences: {
      currency: "INR",
      timezone: "UTC",
    },
  });

  // Helper function to safely parse dates from MongoDB
  const parseMongoDate = (dateString) => {
    if (!dateString) return null;

    try {
      // Handle MongoDB ISO date format: 2025-10-07T23:11:11.300+00:00
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date received:", dateString);
        return null;
      }

      return date;
    } catch (error) {
      console.error("Error parsing date:", error, dateString);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        preferences: {
          currency: user.preferences?.currency || "INR",
          timezone: user.preferences?.timezone || "UTC",
        },
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("preferences.")) {
      const prefKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put("/auth/profile", {
        name: formData.name,
        preferences: formData.preferences,
      });

      toast.success("Profile updated successfully!");
      await loadUser();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const memberSince = (() => {
    const date = parseMongoDate(user?.createdAt);
    if (!date) return "Unknown";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-md">
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {user.name}
              </h1>
              <p className="text-sm text-gray-500 mb-3">{user.email}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Active
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  Since {memberSince}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form - 2 columns */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Personal Information
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      disabled
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      value={formData.email}
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Email cannot be changed for security reasons
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Preferences
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="currency"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Currency
                    </label>
                    <select
                      id="currency"
                      name="preferences.currency"
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer"
                      value={formData.preferences.currency}
                      onChange={handleChange}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: "right 0.75rem center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "1.25em 1.25em",
                        paddingRight: "2.5rem",
                      }}
                    >
                      <option value="INR">🇮🇳 Indian Rupee</option>
                      <option value="USD">🇺🇸 US Dollar</option>
                      <option value="EUR">🇪🇺 Euro</option>
                      <option value="GBP">🇬🇧 British Pound</option>
                      <option value="CAD">🇨🇦 Canadian Dollar</option>
                      <option value="AUD">🇦🇺 Australian Dollar</option>
                      <option value="JPY">🇯🇵 Japanese Yen</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="timezone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      name="preferences.timezone"
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer"
                      value={formData.preferences.timezone}
                      onChange={handleChange}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: "right 0.75rem center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "1.25em 1.25em",
                        paddingRight: "2.5rem",
                      }}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">
                        Eastern Time (US)
                      </option>
                      <option value="America/Chicago">Central Time (US)</option>
                      <option value="America/Denver">Mountain Time (US)</option>
                      <option value="America/Los_Angeles">
                        Pacific Time (US)
                      </option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Kolkata">India (IST)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium text-sm shadow-sm hover:shadow-md active:scale-95"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Security Notice */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-900 mb-2">
                    Security Notice
                  </h3>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    To change your password or email address, please contact
                    support. We require additional verification for sensitive
                    changes.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Account Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600">Member Since</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {(() => {
                      const date = parseMongoDate(user?.createdAt);
                      if (!date) return "Unknown";

                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      });
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600">Account Type</span>
                  <span className="text-sm font-semibold text-gray-900">
                    Free
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
