import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from './App';
import { anonymousAuth, renderWithProviders } from './test/render';
import { server, TEST_API } from './test/server';

const emptyList = () => http.get(`${TEST_API}/me/links`, () => HttpResponse.json({ items: [], nextCursor: null }));

describe('rotas', () => {
  it('anônimo em / vê "Entrar", que inicia o login rumo a /links', async () => {
    const { user, auth } = renderWithProviders(<AppRoutes />, { route: '/', auth: anonymousAuth() });
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/links' } });
  });

  it('logado em / vai direto para /links, com o e-mail no topo', async () => {
    server.use(emptyList());
    renderWithProviders(<AppRoutes />, { route: '/' });
    expect(await screen.findByRole('heading', { name: 'Meus links' })).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  it('anônimo em /links é mandado ao login', async () => {
    const { auth } = renderWithProviders(<AppRoutes />, { route: '/links', auth: anonymousAuth() });
    await waitFor(() => expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/links' } }));
  });

  it('"Sair" encerra a sessão no IdP', async () => {
    server.use(emptyList());
    const { user, auth } = renderWithProviders(<AppRoutes />, { route: '/links' });
    await user.click(await screen.findByRole('button', { name: 'Sair' }));
    expect(auth.signoutRedirect).toHaveBeenCalledTimes(1);
  });

  it('rota desconhecida mostra 404', () => {
    renderWithProviders(<AppRoutes />, { route: '/nao/existe', auth: anonymousAuth() });
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });
});
