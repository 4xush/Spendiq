import { useState, useEffect } from "react";
import { User, Save, Settings } from "lucide-react";
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
      await loadUser(); // Refresh user data
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">
            {user.name?.charAt(0)?.toUpperCase()}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Form */}
      <div className="card">
        <div className="flex items-center mb-6">
          <User className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Personal Information
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              disabled
              className="input bg-gray-50 cursor-not-allowed"
              value={formData.email}
              placeholder="Email cannot be changed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email address cannot be changed for security reasons
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Preferences
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Currency
                </label>
                <select
                  id="currency"
                  name="preferences.currency"
                  className="input"
                  value={formData.preferences.currency}
                  onChange={handleChange}
                >
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                  <option value="CAD">Canadian Dollar (CAD)</option>
                  <option value="AUD">Australian Dollar (AUD)</option>
                  <option value="JPY">Japanese Yen (JPY)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="timezone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="preferences.timezone"
                  className="input"
                  value={formData.preferences.timezone}
                  onChange={handleChange}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Kolkata">India</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Account Stats */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Member Since</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Account Status</p>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <Settings className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Security Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                To change your password or email address, please contact
                support. We take security seriously and require additional
                verification for sensitive changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
