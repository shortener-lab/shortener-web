import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { anonymousAuth, fakeAuth, renderWithProviders } from '../test/render';
import { RequireAuth } from './RequireAuth';

const ui = (
  <Routes>
    <Route path="/links" element={<RequireAuth><p>área protegida</p></RequireAuth>} />
  </Routes>
);

describe('RequireAuth', () => {
  it('logado: mostra o conteúdo', () => {
    renderWithProviders(ui, { route: '/links' });
    expect(screen.getByText('área protegida')).toBeInTheDocument();
  });

  it('anônimo: manda para o login guardando o caminho de volta', async () => {
    const { auth } = renderWithProviders(ui, { route: '/links?x=1', auth: anonymousAuth() });
    expect(screen.getByText('Redirecionando para o login…')).toBeInTheDocument();
    await waitFor(() => expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/links?x=1' } }));
    expect(auth.signinRedirect).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('área protegida')).not.toBeInTheDocument();
  });

  it('carregando: ainda não redireciona', () => {
    const { auth } = renderWithProviders(ui, { route: '/links', auth: anonymousAuth({ isLoading: true }) });
    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });

  it('erro de login: mostra o erro e não entra em loop', () => {
    const error = Object.assign(new Error('invalid_grant'), { source: 'signinCallback' as const });
    const { auth } = renderWithProviders(ui, { route: '/links', auth: anonymousAuth({ error }) });
    expect(screen.getByRole('alert')).toHaveTextContent('invalid_grant');
    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });

  it('com usuário logado nunca chama o login', () => {
    const { auth } = renderWithProviders(ui, { route: '/links', auth: fakeAuth() });
    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });
});
