import { z } from 'zod';

const clicks = z.number().int().nonnegative();

const linkSchema = z.object({
  code: z.string().min(1),
  shortUrl: z.url(),
  url: z.url(),
  createdAt: z.iso.datetime({ offset: true }),
});

const myLinkSchema = linkSchema.extend({ totalClicks: clicks });

const myLinksPageSchema = z.object({
  items: z.array(myLinkSchema),
  nextCursor: z.string().min(1).nullable(),
});

const statsSchema = z.object({
  code: z.string().min(1),
  url: z.url(),
  totalClicks: clicks,
  daily: z.array(z.object({ day: z.iso.date(), clicks })),
  browsers: z.array(z.object({ browser: z.string(), clicks })),
});

const errorBodySchema = z.object({ error: z.string() });

export type Link = z.infer<typeof linkSchema>;
export type MyLink = z.infer<typeof myLinkSchema>;
export type MyLinksPage = z.infer<typeof myLinksPageSchema>;
export type LinkStats = z.infer<typeof statsSchema>;
export type DailyClicks = LinkStats['daily'][number];

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfter?: number;

  constructor(status: number, code: string, retryAfter?: number) {
    super(`A API respondeu ${status} (${code})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

// Retry-After: "120" (segundos) ou "Wed, 21 Oct 2026 07:28:00 GMT" (data HTTP).
export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, Math.ceil((date - now) / 1000));
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return `Muitas requisições. Tente de novo em ${error.retryAfter ?? 60} s.`;
    if (error.status === 400 && error.code === 'invalid_url') {
      return 'A API recusou a URL. Use um endereço http:// ou https:// válido.';
    }
    if (error.status === 401) return 'Sua sessão expirou. Redirecionando para o login…';
    if (error.status === 404) return 'Não encontrado.';
    if (error.code === 'invalid_response') return 'A API respondeu num formato inesperado.';
  }
  return 'Algo deu errado. Tente de novo em instantes.';
}

export type GetToken = () => string | undefined;

export interface ApiClient {
  createLink(url: string): Promise<Link>;
  listMyLinks(params?: { cursor?: string; limit?: number }): Promise<MyLinksPage>;
  getStats(code: string): Promise<LinkStats>;
}

export function createApiClient(baseUrl: string, getToken: GetToken): ApiClient {
  async function request<S extends z.ZodType>(
    path: string,
    schema: S,
    init: { method?: string; body?: unknown } = {},
  ): Promise<z.infer<S>> {
    const headers = new Headers({ Accept: 'application/json' });
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    let body: string | undefined;
    if (init.body !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(init.body);
    }

    const res = await fetch(`${baseUrl}${path}`, { method: init.method ?? 'GET', headers, body });
    const payload: unknown = await res.json().catch(() => undefined); // corpo vazio ou não-JSON

    if (!res.ok) {
      const errorBody = errorBodySchema.safeParse(payload);
      throw new ApiError(
        res.status,
        errorBody.success ? errorBody.data.error : `http_${res.status}`,
        res.status === 429 ? parseRetryAfter(res.headers.get('Retry-After')) : undefined,
      );
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) throw new ApiError(res.status, 'invalid_response');
    return parsed.data;
  }

  return {
    createLink: (url) => request('/links', linkSchema, { method: 'POST', body: { url } }),
    listMyLinks: ({ cursor, limit = 20 } = {}) => {
      const query = new URLSearchParams({ limit: String(limit) });
      if (cursor) query.set('cursor', cursor);
      return request(`/me/links?${query}`, myLinksPageSchema);
    },
    getStats: (code) => request(`/links/${encodeURIComponent(code)}/stats`, statsSchema),
  };
}
