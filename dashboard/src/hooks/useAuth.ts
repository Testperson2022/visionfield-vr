import { useMutation } from "@tanstack/react-query";
import api from "../utils/api";
import { useAuthStore } from "../store/authStore";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api.post("/auth/login", credentials);
      return data.data as { token: string; user: any };
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
    },
  });
}
