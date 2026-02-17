
import { z } from "zod";
import {
  PlanRequestSchema,
  PlanResponseSchema,
  ExecuteRequestSchema,
  ExecuteResponseSchema
} from "./schema";

export const api = {
  assistant: {
    plan: {
      method: "POST" as const,
      path: "/api/plan" as const,
      input: PlanRequestSchema,
      responses: {
        200: PlanResponseSchema,
        400: z.object({ message: z.string() }),
      },
    },
    execute: {
      method: "POST" as const,
      path: "/api/execute" as const,
      input: ExecuteRequestSchema,
      responses: {
        200: ExecuteResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },
  },
};
