/**
 * Auth Store — Zustand state management for JWT authentication.
 */
import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: {
    userId: string;
    clinicId: string;
    role: string;
    email: string;
  } | null;
  setAuth: (token: string, user: AuthState["user"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("vf_token"),
  user: JSON.parse(localStorage.getItem("vf_user") || "null"),

  setAuth: (token, user) => {
    localStorage.setItem("vf_token", token);
    localStorage.setItem("vf_user", JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem("vf_token");
    localStorage.removeItem("vf_user");
    set({ token: null, user: null });
  },
}));
