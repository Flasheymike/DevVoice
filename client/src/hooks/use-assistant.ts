import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type PlanRequest, type ExecuteRequest } from "@shared/schema";

export function usePlan() {
  return useMutation({
    mutationFn: async (data: PlanRequest) => {
      const res = await fetch(api.assistant.plan.path, {
        method: api.assistant.plan.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create plan");
      }
      
      return api.assistant.plan.responses[200].parse(await res.json());
    },
  });
}

export function useExecute() {
  return useMutation({
    mutationFn: async (data: ExecuteRequest) => {
      const res = await fetch(api.assistant.execute.path, {
        method: api.assistant.execute.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to execute plan");
      }
      
      return api.assistant.execute.responses[200].parse(await res.json());
    },
  });
}
