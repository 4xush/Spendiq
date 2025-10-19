import { createContext, useContext, useReducer, useEffect } from "react";
import api from "../utils/api";
import cachedApi, { clearCache } from "../utils/cachedApi";

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: true,
  error: null,
  authType: localStorage.getItem("authType") || "local", // "local" or "google"
};

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN_START":
    case "REGISTER_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
    case "OAUTH_LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        authType: action.payload.authType || "local",
        loading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
    case "REGISTER_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        authType: "local",
        loading: false,
        error: null,
      };
    case "LOAD_USER_SUCCESS":
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };
    case "LOAD_USER_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload, // This will be null for "no token" case, or actual error message for real failures
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadUser = async (options = {}) => {
    const { forceRefresh = false } = options;
    try {
      const data = await cachedApi.get("/auth/profile", {
        cacheDuration: 30000, // Cache for 30 seconds on client side
        forceRefresh,
      });
      dispatch({ type: "LOAD_USER_SUCCESS", payload: data.user });
      return data.user;
    } catch (error) {
      dispatch({
        type: "LOAD_USER_FAILURE",
        payload: error.response?.data?.error || "Failed to load user",
      });
      return null;
    }
  };

  // Load user on app start if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      if (state.token) {
        await loadUser();
      } else {
        // Don't dispatch error for missing token - just set loading to false
        dispatch({ type: "LOAD_USER_FAILURE", payload: null });
      }
    };

    initializeAuth();
  }, []);

  // Set token in localStorage and API headers
  useEffect(() => {
    if (state.token) {
      localStorage.setItem("token", state.token);
      localStorage.setItem("authType", state.authType);
      api.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("authType");
      delete api.defaults.headers.common["Authorization"];
    }
  }, [state.token, state.authType]);

  const login = async (email, password) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await api.post("/auth/login", { email, password });
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Login failed";
      dispatch({ type: "LOGIN_FAILURE", payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    dispatch({ type: "REGISTER_START" });
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      dispatch({
        type: "REGISTER_SUCCESS",
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Registration failed";
      dispatch({ type: "REGISTER_FAILURE", payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Clear cached API data on logout
      clearCache();

      // Call the backend logout endpoint if we have a token
      if (state.token) {
        await api.post("/auth/logout");
      }

      // Always dispatch logout action, even if backend call fails
      dispatch({ type: "LOGOUT" });

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      // Still logout locally even if the server request fails
      dispatch({ type: "LOGOUT" });
      return { success: true };
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Process OAuth login (used by OAuthCallback component)
  const processOAuthLogin = async (token) => {
    dispatch({ type: "LOGIN_START" });
    try {
      // Clear any existing cache before processing new login
      clearCache();

      // Set the token
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Get user data with the token (bypass cache for fresh login)
      const response = await api.get("/auth/profile");

      dispatch({
        type: "OAUTH_LOGIN_SUCCESS",
        payload: {
          user: response.data.user,
          token,
          authType: "google",
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Google authentication failed";
      dispatch({ type: "LOGIN_FAILURE", payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Initiate Google OAuth login process
  const initiateGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    authType: state.authType,
    login,
    register,
    logout,
    clearError,
    loadUser,
    processOAuthLogin,
    initiateGoogleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
