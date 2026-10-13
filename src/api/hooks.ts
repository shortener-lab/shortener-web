import { useEffect, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router';
import { getConfig } from '../config';
import { ApiError, createApiClient, type ApiClient } from './client';

export const PAGE_SIZE = 20;

export const linkKeys = {
  mine: ['links', 'mine'] as const,
  stats: (code: string) => ['links', code, 'stats'] as const,
};

function useApiClient(): ApiClient {
  const auth = useAuth();
  const token = auth.user?.access_token; // muda quando o oidc-client-ts renova o token
  return useMemo(() => createApiClient(getConfig().apiBaseUrl, () => token), [token]);
}

function useLoginOnUnauthorized(error: unknown): void {
  const auth = useAuth();
  const location = useLocation();
  const unauthorized = error instanceof ApiError && error.status === 401;

  useEffect(() => {
    if (unauthorized && !auth.activeNavigator) {
      void auth.signinRedirect({ state: { returnTo: location.pathname + location.search } });
    }
  }, [unauthorized, auth, location.pathname, location.search]);
}

export function useMyLinks() {
  const api = useApiClient();
  const query = useInfiniteQuery({
    queryKey: linkKeys.mine,
    queryFn: ({ pageParam }) => api.listMyLinks({ cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined, // undefined = acabou
  });
  useLoginOnUnauthorized(query.error);
  return query;
}

export function useCreateLink() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (url: string) => api.createLink(url),
    // Retornar a promise mantém a mutation "pending" até a lista ser buscada de novo.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: linkKeys.mine }),
  });
  useLoginOnUnauthorized(mutation.error);
  return mutation;
}

export function useStats(code: string) {
  const api = useApiClient();
  const query = useQuery({
    queryKey: linkKeys.stats(code),
    queryFn: () => api.getStats(code),
  });
  useLoginOnUnauthorized(query.error);
  return query;
}
