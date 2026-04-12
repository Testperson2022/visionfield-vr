import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";

export function usePatients(page: number = 1) {
  return useQuery({
    queryKey: ["patients", page],
    queryFn: async () => {
      const { data } = await api.get(`/api/patients?page=${page}`);
      return data.data;
    },
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/patients/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patient: {
      cpr: string;
      firstName: string;
      lastName: string;
      birthYear: number;
    }) => {
      const { data } = await api.post("/api/patients", patient);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useSearchPatient() {
  return useMutation({
    mutationFn: async (cpr: string) => {
      const { data } = await api.post("/api/patients/search", { cpr });
      return data.data;
    },
  });
}
