import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { stats } from '../test/fixtures';
import { renderWithProviders } from '../test/render';
import { server, TEST_API } from '../test/server';
import { LinkDetailPage } from './LinkDetailPage';

const ui = (
  <Routes>
    <Route path="/links/:code" element={<LinkDetailPage />} />
  </Routes>
);

describe('LinkDetailPage', () => {
  it('mostra total, 30 barras e a tabela de navegadores', async () => {
    const today = new Date().toISOString().slice(0, 10);
    server.use(
      http.get(`${TEST_API}/links/abc1234/stats`, () =>
        HttpResponse.json(
          stats({
            totalClicks: 5,
            daily: [{ day: today, clicks: 3 }],
            browsers: [
              { browser: 'Chrome', clicks: 4 },
              { browser: 'Firefox', clicks: 1 },
            ],
          }),
        ),
      ),
    );
    const { container } = renderWithProviders(ui, { route: '/links/abc1234' });

    expect(await screen.findByTestId('total-clicks')).toHaveTextContent('5');

    const bars = container.querySelectorAll('rect.bar');
    expect(bars).toHaveLength(30);
    expect(bars[29]).toHaveAttribute('data-clicks', '3');
    expect(bars[0]).toHaveAttribute('data-clicks', '0');

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows).toHaveLength(3); // cabeçalho + 2 navegadores
    expect(within(rows[1]).getAllByRole('cell').map((c) => c.textContent)).toEqual(['Chrome', '4']);
  });

  it('sem cliques mostra aviso no lugar da tabela', async () => {
    server.use(http.get(`${TEST_API}/links/abc1234/stats`, () => HttpResponse.json(stats())));
    renderWithProviders(ui, { route: '/links/abc1234' });
    expect(await screen.findByText('Nenhum clique ainda.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('404 mostra mensagem amigável com caminho de volta', async () => {
    server.use(
      http.get(`${TEST_API}/links/abc1234/stats`, () => HttpResponse.json({ error: 'not_found' }, { status: 404 })),
    );
    renderWithProviders(ui, { route: '/links/abc1234' });
    expect(await screen.findByRole('heading', { name: 'Link não encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para meus links' })).toHaveAttribute('href', '/links');
  });
});
