import { createContext, useContext, useState, ReactNode } from "react";
import { apiClient } from "../api/client";
import { UserOut } from "../api/types";

type Role = "user" | "admin" | null;

interface AuthContextValue {
  token: string | null;
  role: Role;
  user: UserOut | null;
  loginUser: (phone: string, password: string) => Promise<void>;
  loginAdmin: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [role, setRole] = useState<Role>((localStorage.getItem("role") as Role) || null);
  const [user, setUser] = useState<UserOut | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  function persist(newToken: string, newRole: Role, newUser: UserOut | null) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole || "");
    if (newUser) localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setRole(newRole);
    setUser(newUser);
  }

  async function loginUser(phone: string, password: string) {
    const res = await apiClient.post("/auth/login", { phone, password });
    persist(res.data.access_token, "user", null);
    const me = await apiClient.get("/auth/me");
    persist(res.data.access_token, "user", me.data);
  }

  async function loginAdmin(phone: string, password: string) {
    const res = await apiClient.post("/auth/admin/login", { phone, password });
    persist(res.data.access_token, "admin", null);
    const me = await apiClient.get("/auth/me");
    persist(res.data.access_token, "admin", me.data);
  }

  async function refreshMe() {
    const me = await apiClient.get("/auth/me");
    setUser(me.data);
    localStorage.setItem("user", JSON.stringify(me.data));
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setToken(null);
    setRole(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, role, user, loginUser, loginAdmin, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
