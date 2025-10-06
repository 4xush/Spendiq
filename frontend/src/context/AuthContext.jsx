import { createContext, useContext, useReducer, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: true,
  error: null,
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
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
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
        error: action.payload,
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

  // Load user on app start if token exists
  useEffect(() => {
    if (state.token) {
      loadUser();
    } else {
      dispatch({ type: "LOAD_USER_FAILURE", payload: "No token found" });
    }
  }, []);

  // Set token in localStorage and API headers
  useEffect(() => {
    if (state.token) {
      localStorage.setItem("token", state.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
    } else {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
    }
  }, [state.token]);

  const loadUser = async () => {
    try {
      const response = await api.get("/auth/profile");
      dispatch({ type: "LOAD_USER_SUCCESS", payload: response.data.user });
    } catch (error) {
      dispatch({
        type: "LOAD_USER_FAILURE",
        payload: error.response?.data?.error || "Failed to load user",
      });
    }
  };

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

  const logout = () => {
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    clearError,
    loadUser,
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
