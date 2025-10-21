import { useEffect, useState, useRef } from "react";
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

  // Add a counter to prevent infinite loops
  const [attemptCount, setAttemptCount] = useState(0);

  // Store whether we've already started processing
  const processingRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing
    if (processingRef.current) {
             return;
    }

    // Safety check for too many attempts
    if (attemptCount > 2) {
      console.error(
        "Too many OAuth processing attempts, forcing redirect to login"
      );
      toast.error("Authentication process failed after multiple attempts");
      navigate("/login", { replace: true });
      return;
    }

    const handleOAuthResponse = async () => {
      // Set processing flag to prevent duplicate calls
      processingRef.current = true;
      setAttemptCount((prev) => prev + 1);
       
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

        // Store token directly in localStorage as additional backup
        try {
          localStorage.setItem("token", token);
                   } catch (e) {
          console.warn("Failed to save token to localStorage:", e);
        }

                 const result = await processOAuthLogin(token);
         
        if (result && result.success) {
           
          // Successfully authenticated, quietly redirect to dashboard without toast
          navigate("/", { replace: true });

          // Add a backup direct redirect after a short delay
          setTimeout(() => {
            if (document.location.pathname.includes("/oauth/callback")) {
                             window.location.href = "/";
            }
          }, 1500);
        } else {
          // Only show error toast if there's an issue
                     toast.error(
            result?.error || "Authentication failed. Please try again."
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
        // Reset processing flag after a delay to handle potential React re-renders
        setTimeout(() => {
          processingRef.current = false;
        }, 2000);
      }
    };

    handleOAuthResponse();
  }, [token, error, navigate, processOAuthLogin, attemptCount]);

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
