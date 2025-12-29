import { useMutation, useQuery } from "@tanstack/react-query";
import { analyzeImage, checkHealth } from "./client";

export function useAnalyzeImage() {
  return useMutation({
    mutationFn: analyzeImage,
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
    retry: false,
  });
}
