import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { myLink, stats } from '../test/fixtures';
import { createWrapper, fakeAuth, TEST_TOKEN } from '../test/render';
import { server, TEST_API } from '../test/server';
import { completeSignin } from '../auth/oidc';
import { useCreateLink, useMyLinks, useStats } from './hooks';

afterEach(() => vi.useRealTimers());

describe('useMyLinks', () => {
  it('pagina com o cursor e para quando nextCursor é null', async () => {
    server.use(
      http.get(`${TEST_API}/me/links`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        return HttpResponse.json(
          cursor === 'c2' ? { items: [myLink('bbb2222')], nextCursor: null } : { items: [myLink('aaa1111')], nextCursor: 'c2' },
        );
      }),
    );
    const { result } = renderHook(() => useMyLinks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('manda o access token do usuário logado', async () => {
    let auth: string | null = null;
    server.use(
      http.get(`${TEST_API}/me/links`, ({ request }) => {
        auth = request.headers.get('Authorization');
        return HttpResponse.json({ items: [], nextCursor: null });
      }),
    );
    const { result } = renderHook(() => useMyLinks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(auth).toBe(`Bearer ${TEST_TOKEN}`);
  });
});

describe('useCreateLink', () => {
  it('cria e invalida a lista', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${TEST_API}/me/links`, () => {
        listCalls += 1;
        return HttpResponse.json({ items: [], nextCursor: null });
      }),
      http.post(`${TEST_API}/links`, () => {
        const { totalClicks: _omit, ...link } = myLink('new1234');
        return HttpResponse.json(link, { status: 201 });
      }),
    );
    const { result } = renderHook(() => ({ list: useMyLinks(), create: useCreateLink() }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    await act(async () => {
      await result.current.create.mutateAsync('https://example.com/new');
    });
    await waitFor(() => expect(listCalls).toBe(2));
  });
});

describe('401', () => {
  it('dispara novo login voltando para a tela atual', async () => {
    server.use(http.get(`${TEST_API}/links/abc1234/stats`, () => new HttpResponse(null, { status: 401 })));
    const auth = fakeAuth();
    renderHook(() => useStats('abc1234'), { wrapper: createWrapper({ route: '/links/abc1234', auth }) });
    await waitFor(() =>
      expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/links/abc1234' } }),
    );
  });

  it('401 logo depois de um login não redireciona de novo (evita loop com o IdP)', async () => {
    server.use(http.get(`${TEST_API}/links/abc1234/stats`, () => new HttpResponse(null, { status: 401 })));
    completeSignin(); // acabamos de voltar do IdP, e a api ainda recusa o token novo
    const auth = fakeAuth();
    const { result } = renderHook(() => useStats('abc1234'), { wrapper: createWrapper({ route: '/links/abc1234', auth }) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });

  it('erro que não é 401 não chama o login', async () => {
    server.use(http.get(`${TEST_API}/links/abc1234/stats`, () => HttpResponse.json({ error: 'not_found' }, { status: 404 })));
    const auth = fakeAuth();
    const { result } = renderHook(() => useStats('abc1234'), { wrapper: createWrapper({ auth }) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });

  it('useStats busca de novo quando o servidor diz que o cache expira (+ até 2 s de folga)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let calls = 0;
    server.use(
      http.get(`${TEST_API}/links/abc1234/stats`, () => {
        calls += 1;
        return HttpResponse.json({ ...stats({ totalClicks: calls }), computedAt: new Date().toISOString(), refreshInSeconds: 5 });
      }),
    );
    const { result } = renderHook(() => useStats('abc1234'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data?.totalClicks).toBe(1));
    await act(() => vi.advanceTimersByTimeAsync(4_000));
    expect(calls).toBe(1); // ainda dentro dos 5 s do cache
    await act(() => vi.advanceTimersByTimeAsync(3_100));
    await waitFor(() => expect(result.current.data?.totalClicks).toBe(2));
  });

  it('useStats sem refreshInSeconds (api antiga) não fica buscando sozinho', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let calls = 0;
    server.use(
      http.get(`${TEST_API}/links/abc1234/stats`, () => {
        calls += 1;
        return HttpResponse.json(stats());
      }),
    );
    const { result } = renderHook(() => useStats('abc1234'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(() => vi.advanceTimersByTimeAsync(120_000));
    expect(calls).toBe(1);
  });

  it('useStats devolve as estatísticas', async () => {
    server.use(http.get(`${TEST_API}/links/abc1234/stats`, () => HttpResponse.json(stats({ totalClicks: 4 }))));
    const { result } = renderHook(() => useStats('abc1234'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data?.totalClicks).toBe(4));
  });
});
