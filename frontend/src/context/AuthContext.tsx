// frontend/src/context/AuthContext.tsx
/**
 * Contexto de autenticación para StudyForge.
 * Provee estado del usuario, login, logout y funciones relacionadas.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  setToken,
  clearToken,
  getToken,
} from "../services/api";
import type { UserDetailResponse, UserLogin, UserCreate } from "../types/api.types";

// ==================== TYPES ====================

interface AuthContextType {
  user: UserDetailResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: UserLogin, remember?: boolean) => Promise<void>;
  signup: (data: UserCreate, remember?: boolean) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ==================== CONTEXT ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== PROVIDER ====================

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar usuario al montar el componente si hay token
  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
        clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials: UserLogin, remember: boolean = true) => {
    setIsLoading(true);
    try {
      const tokenResponse = await apiLogin(credentials);
      setToken(tokenResponse.access_token, remember);

      // Cargar información del usuario
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: UserCreate, remember: boolean = true) => {
    setIsLoading(true);
    try {
      // Registrar usuario
      await apiRegister(data);

      // Auto-login después del registro
      await login(
        { email: data.email, password: data.password },
        remember
      );
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }

    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Error refreshing user:", error);
      clearToken();
      setUser(null);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==================== HOOK ====================

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
