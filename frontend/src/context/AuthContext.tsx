import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api } from "@/src/lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  plan: string;
  created_at: string;
};

type SignupPayload = {
  name: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await api.getToken();

      if (!token) {
        setUser(null);
        return;
      }

      const u = await api.me();
      setUser(u);
    } catch (error) {
      console.error("Refresh failed:", error);
      setUser(null);
      await api.clearToken();
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await refresh();
      setLoading(false);
    };

    init();
  }, [refresh]);

  const login = async (
    email: string,
    password: string
  ): Promise<void> => {
    const res = await api.login({
      email,
      password,
    });

    await api.setToken(res.token);
    setUser(res.user);
  };

  const signup = async (
    payload: SignupPayload
  ): Promise<void> => {
    const res = await api.signup(payload);

    await api.setToken(res.token);
    setUser(res.user);
  };

  const logout = async (): Promise<void> => {
    await api.clearToken();
    setUser(null);
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return ctx;
}