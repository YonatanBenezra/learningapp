import { apiClient } from "@/lib/api-client";
import type { ExerciseTools, ToolLadders } from "@/types/tools";

export const toolsApi = {
  forExercise: (slug: string) =>
    apiClient<ExerciseTools>(`/exercises/${slug}/tools`),
  ladders: () => apiClient<ToolLadders>("/tools"),
  unlock: (toolId: string) =>
    apiClient<ToolLadders>(`/tools/${toolId}/unlock`, { method: "POST" }),
};
