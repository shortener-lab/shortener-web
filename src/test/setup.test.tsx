import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server, TEST_API } from './server';

describe('ambiente de testes', () => {
  it('tem DOM e os matchers do jest-dom', () => {
    render(<p>olá</p>);
    expect(screen.getByText('olá')).toBeInTheDocument();
  });

  it('o MSW intercepta o fetch', async () => {
    server.use(http.get(`${TEST_API}/ping`, () => HttpResponse.json({ pong: true })));
    const res = await fetch(`${TEST_API}/ping`);
    expect(await res.json()).toEqual({ pong: true });
  });
});
