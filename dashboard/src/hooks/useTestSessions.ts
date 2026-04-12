import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";

export function usePatientSessions(patientId: string, page: number = 1) {
  return useQuery({
    queryKey: ["sessions", patientId, page],
    queryFn: async () => {
      const { data } = await api.get(`/api/test-sessions/patient/${patientId}?page=${page}`);
      return data.data;
    },
    enabled: !!patientId,
  });
}

export function useTestSession(sessionId: string) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const { data } = await api.get(`/api/test-sessions/${sessionId}`);
      return data.data;
    },
    enabled: !!sessionId,
  });
}
