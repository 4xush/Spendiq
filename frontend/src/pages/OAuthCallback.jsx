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
        if (error) {
          toast.error("Google authentication failed. Please try again.");
          navigate("/login", { replace: true });
          return;
        }

        if (!token) {
          toast.error("No authentication token received.");
          navigate("/login", { replace: true });
          return;
        }

        const result = await processOAuthLogin(token);

        if (result.success) {
          // Successfully authenticated, quietly redirect to dashboard without toast
          navigate("/", { replace: true });
        } else {
          // Only show error toast if there's an issue
          toast.error(
            result.error || "Authentication failed. Please try again."
          );
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("OAuth callback error:", err);
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
