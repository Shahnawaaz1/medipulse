"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { IUser, UserRole } from "@/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: IUser | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  switchRole: (newRole: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Default guest/admin user fallback for immediate seamless usage
        setUser({
          name: "Dr. Alexander Wright",
          email: "admin@hospital.com",
          role: "super_admin",
          department: "Administration",
          status: "active",
          avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80",
        });
      }
    } catch {
      setUser({
        name: "Dr. Alexander Wright",
        email: "admin@hospital.com",
        role: "super_admin",
        department: "Administration",
        status: "active",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const switchRole = async (newRole: UserRole) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleQuickSwitch: newRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("Failed to switch role:", e);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: (user?.role as UserRole) || "super_admin",
        loading,
        login,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
