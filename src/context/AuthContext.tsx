"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { IUser, StandardRole, UserRole } from "@/types";
import { useRouter } from "next/navigation";
import {
  normalizeRole,
  hasPermission as checkPerm,
  canAccessRoute as checkRoute,
  Permission,
  getDefaultDashboard,
} from "@/lib/permissions";

interface AuthContextType {
  user: IUser | null;
  role: StandardRole;
  loading: boolean;
  login: (
    identifier: string,
    pass: string
  ) => Promise<{ success: boolean; error?: string; defaultDashboard?: string }>;
  registerPatient: (
    data: any
  ) => Promise<{ success: boolean; error?: string; defaultDashboard?: string }>;
  switchRole: (newRole: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (path: string) => boolean;
  isStaff: boolean;
  isPatient: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
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
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (
    identifier: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; defaultDashboard?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return {
          success: true,
          defaultDashboard: data.defaultDashboard || getDefaultDashboard(data.user.role),
        };
      }
      return { success: false, error: data.error || "Authentication failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error during authentication" };
    }
  };

  const registerPatient = async (
    patientData: any
  ): Promise<{ success: boolean; error?: string; defaultDashboard?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return {
          success: true,
          defaultDashboard: data.defaultDashboard || "/patient/dashboard",
        };
      }
      return { success: false, error: data.error || "Registration failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error during registration" };
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
        const dashboard = data.defaultDashboard || getDefaultDashboard(data.user.role);
        router.push(dashboard);
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

  const currentRole: StandardRole = user ? normalizeRole(user.role) : "PATIENT";

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return checkPerm(user.role, permission);
  };

  const canAccess = (path: string): boolean => {
    if (!user) return false;
    return checkRoute(user.role, path);
  };

  const isStaff = user ? currentRole !== "PATIENT" : false;
  const isPatient = user ? currentRole === "PATIENT" : false;
  const isAdmin = user ? currentRole === "SUPER_ADMIN" || currentRole === "ADMIN" : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        loading,
        login,
        registerPatient,
        switchRole,
        logout,
        hasPermission,
        canAccess,
        isStaff,
        isPatient,
        isAdmin,
        refreshUser: fetchCurrentUser,
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
