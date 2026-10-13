import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false; // repetir não resolve
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 15_000, // evita refetch a cada troca de página dentro do painel
      },
    },
  });
}
