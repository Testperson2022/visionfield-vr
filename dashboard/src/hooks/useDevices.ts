import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data } = await api.get("/api/devices");
      return data.data;
    },
  });
}

export function useRegisterDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (device: { model: string; serial: string; firmware: string }) => {
      const { data } = await api.post("/api/devices", device);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}
