import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { connectSocket, disconnectSocket } from "../utils/socket";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await api.get("/auth/me");
        setUser(response);
        connectSocket(token);
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        disconnectSocket();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    connectSocket(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    disconnectSocket();
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
