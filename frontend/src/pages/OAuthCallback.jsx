import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const navigate = useNavigate();
  const { processOAuthLogin } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleOAuthResponse = async () => {
      try {
        console.log(
          "Starting OAuth process with token:",
          token ? `${token.substring(0, 10)}...` : "no token"
        );

        if (error) {
          console.log("OAuth error parameter detected:", error);
          toast.error("Google authentication failed. Please try again.");
          navigate("/login", { replace: true });
          return;
        }

        if (!token) {
          console.log("No token found in URL parameters");
          toast.error("No authentication token received.");
          navigate("/login", { replace: true });
          return;
        }

        console.log("Calling processOAuthLogin with token");
        const result = await processOAuthLogin(token);
        console.log("processOAuthLogin result:", result);

        if (result.success) {
          console.log("Login successful, navigating to dashboard...");

          // Successfully authenticated, quietly redirect to dashboard without toast
          navigate("/", { replace: true });

          // Add a backup direct redirect after a short delay
          setTimeout(() => {
            if (document.location.pathname.includes("/oauth/callback")) {
              console.log("Forcing redirect via window.location");
              window.location.href = "/";
            }
          }, 1500);
        } else {
          // Only show error toast if there's an issue
          console.log("Login failed with error:", result.error);
          toast.error(
            result.error || "Authentication failed. Please try again."
          );
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Full OAuth error object:", err);
        console.error("OAuth error message:", err.message);
        console.error("OAuth error response:", err.response?.data);
        toast.error("An unexpected error occurred during authentication.");
        navigate("/login", { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuthResponse();
  }, [token, error, navigate, processOAuthLogin]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        {isProcessing ? (
          <>
            <LoadingSpinner size="large" className="mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Completing Login</h2>
            <p className="text-gray-600">
              Please wait while we authenticate you...
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-2">Redirecting...</h2>
            <p className="text-gray-600">Taking you to your dashboard.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuthCallback;
