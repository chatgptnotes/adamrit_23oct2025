import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateCode, getPreviewStatus, getUsage, getHealth, getHistory } from '@/lib/code-assistant/client';
import type { GenerationResponse } from '@/lib/code-assistant/types';

export function useGenerateCode() {
  const qc = useQueryClient();
  return useMutation<GenerationResponse, Error, { prompt: string; attached_files: string[]; parent_generation_id?: string }>({
    mutationFn: generateCode,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['code-assistant', 'usage'] });
      qc.invalidateQueries({ queryKey: ['code-assistant', 'history'] });
    },
  });
}

export function usePreviewStatus(generationId: string | null) {
  return useQuery({
    queryKey: ['code-assistant', 'preview-status', generationId],
    queryFn: () => getPreviewStatus(generationId!),
    enabled: !!generationId,
    refetchInterval: (q) => {
      const data: any = q.state.data;
      if (!data) return 3000;
      if (data.status === 'ready' || data.ok === false) return false;
      return 3000;
    },
  });
}

export function useCodeAssistantUsage() {
  return useQuery({
    queryKey: ['code-assistant', 'usage'],
    queryFn: getUsage,
    refetchInterval: 30_000,
  });
}

export function useCodeAssistantHealth() {
  return useQuery({
    queryKey: ['code-assistant', 'health'],
    queryFn: getHealth,
    refetchInterval: 60_000,
    retry: false,
  });
}

export function useCodeAssistantHistory() {
  return useQuery({
    queryKey: ['code-assistant', 'history'],
    queryFn: getHistory,
  });
}
