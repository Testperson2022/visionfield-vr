import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";

export function useAuditLogs(page: number = 1) {
  return useQuery({
    queryKey: ["audit-logs", page],
    queryFn: async () => {
      const { data } = await api.get(`/api/audit-logs?page=${page}&pageSize=50`);
      return data.data;
    },
  });
}
