import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server, TEST_API } from '../test/server';
import { ApiError, createApiClient, describeError, parseRetryAfter } from './client';

const api = createApiClient(TEST_API, () => 'tok-123');

const link = {
  code: 'abc1234',
  shortUrl: 'http://localhost:3000/abc1234',
  url: 'https://example.com/',
  createdAt: '2026-10-12T12:00:00.000Z',
};

describe('createLink', () => {
  it('manda Bearer e JSON e devolve o link', async () => {
    let seen: { auth: string | null; body: unknown } | undefined;
    server.use(
      http.post(`${TEST_API}/links`, async ({ request }) => {
        seen = { auth: request.headers.get('Authorization'), body: await request.json() };
        return HttpResponse.json(link, { status: 201 });
      }),
    );
    await expect(api.createLink('https://example.com/')).resolves.toEqual(link);
    expect(seen).toEqual({ auth: 'Bearer tok-123', body: { url: 'https://example.com/' } });
  });

  it('sem token não manda Authorization', async () => {
    let auth: string | null = 'não lido';
    server.use(
      http.post(`${TEST_API}/links`, ({ request }) => {
        auth = request.headers.get('Authorization');
        return HttpResponse.json(link, { status: 201 });
      }),
    );
    await createApiClient(TEST_API, () => undefined).createLink('https://example.com/');
    expect(auth).toBeNull();
  });

  it('400 vira ApiError com o código do corpo', async () => {
    server.use(http.post(`${TEST_API}/links`, () => HttpResponse.json({ error: 'invalid_url' }, { status: 400 })));
    await expect(api.createLink('x')).rejects.toMatchObject({ name: 'ApiError', status: 400, code: 'invalid_url' });
  });

  it('401 sem corpo vira ApiError 401', async () => {
    server.use(http.post(`${TEST_API}/links`, () => new HttpResponse(null, { status: 401 })));
    await expect(api.createLink('https://example.com/')).rejects.toMatchObject({ status: 401, code: 'http_401' });
  });

  it('429 lê o Retry-After', async () => {
    server.use(
      http.post(`${TEST_API}/links`, () =>
        HttpResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': '30' } }),
      ),
    );
    await expect(api.createLink('https://example.com/')).rejects.toMatchObject({ status: 429, retryAfter: 30 });
  });
});

describe('listMyLinks', () => {
  it('manda limit e cursor e valida a página', async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get(`${TEST_API}/me/links`, ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ items: [{ ...link, totalClicks: 2 }], nextCursor: null });
      }),
    );
    const page = await api.listMyLinks({ cursor: 'c2', limit: 5 });
    expect(params?.get('limit')).toBe('5');
    expect(params?.get('cursor')).toBe('c2');
    expect(page).toEqual({ items: [{ ...link, totalClicks: 2 }], nextCursor: null });
  });

  it('resposta malformada vira invalid_response', async () => {
    server.use(http.get(`${TEST_API}/me/links`, () => HttpResponse.json({ items: 'não é lista' })));
    await expect(api.listMyLinks()).rejects.toMatchObject({ status: 200, code: 'invalid_response' });
  });
});

describe('getStats', () => {
  it('devolve as estatísticas validadas', async () => {
    const stats = {
      code: 'abc1234',
      url: 'https://example.com/',
      totalClicks: 3,
      daily: [{ day: '2026-10-12', clicks: 3 }],
      browsers: [{ browser: 'Chrome', clicks: 3 }],
    };
    server.use(http.get(`${TEST_API}/links/abc1234/stats`, () => HttpResponse.json(stats)));
    await expect(api.getStats('abc1234')).resolves.toEqual(stats);
  });

  it('404 vira ApiError not_found', async () => {
    server.use(http.get(`${TEST_API}/links/nope123/stats`, () => HttpResponse.json({ error: 'not_found' }, { status: 404 })));
    await expect(api.getStats('nope123')).rejects.toMatchObject({ status: 404, code: 'not_found' });
  });
});

describe('parseRetryAfter', () => {
  const now = Date.parse('2026-10-12T12:00:00Z');
  it('aceita segundos', () => expect(parseRetryAfter('42', now)).toBe(42));
  it('aceita data HTTP', () => expect(parseRetryAfter(new Date(now + 10_000).toUTCString(), now)).toBe(10));
  it('ignora lixo e ausência', () => {
    expect(parseRetryAfter('amanhã', now)).toBeUndefined();
    expect(parseRetryAfter(null, now)).toBeUndefined();
  });
});

describe('describeError', () => {
  it('429 diz quanto esperar', () => {
    expect(describeError(new ApiError(429, 'rate_limited', 30))).toBe('Muitas requisições. Tente de novo em 30 s.');
  });
  it('erro desconhecido tem mensagem genérica', () => {
    expect(describeError(new TypeError('Failed to fetch'))).toBe('Algo deu errado. Tente de novo em instantes.');
  });
});
