import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AuthAPI, TOKEN_KEY, USER_KEY, getStoredUser, getToken, type StoredUser } from "./api";

type AuthContextValue = {
  user: StoredUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persist(payload: any) {
  const token: string | undefined =
    payload?.token ?? payload?.accessToken ?? payload?.jwt;
  const user: StoredUser = {
    id: payload?.user?.id ?? payload?.id ?? payload?.userId,
    name: payload?.user?.name ?? payload?.name,
    email: payload?.user?.email ?? payload?.email,
  };
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { token: token ?? null, user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getToken());
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await AuthAPI.login({ email, password });
    const { token, user } = persist(res);
    setToken(token);
    setUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await AuthAPI.register({ name, email, password });
    const { token, user } = persist(res);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
