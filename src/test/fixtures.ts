import type { LinkStats, MyLink } from '../api/client';

export function myLink(code: string, overrides: Partial<MyLink> = {}): MyLink {
  return {
    code,
    shortUrl: `http://localhost:3000/${code}`,
    url: `https://example.com/${code}`,
    createdAt: '2026-10-12T12:00:00.000Z',
    totalClicks: 0,
    ...overrides,
  };
}

export function stats(overrides: Partial<LinkStats> = {}): LinkStats {
  return {
    code: 'abc1234',
    url: 'https://example.com/abc1234',
    totalClicks: 0,
    daily: [],
    browsers: [],
    ...overrides,
  };
}
