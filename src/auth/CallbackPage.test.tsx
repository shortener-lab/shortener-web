import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import type { User } from 'oidc-client-ts';
import { describe, expect, it } from 'vitest';
import { anonymousAuth, fakeAuth, renderWithProviders } from '../test/render';
import { CallbackPage } from './CallbackPage';

const ui = (
  <Routes>
    <Route path="/" element={<p>início</p>} />
    <Route path="/callback" element={<CallbackPage />} />
    <Route path="/links" element={<p>meus links</p>} />
    <Route path="/links/:code" element={<p>detalhe</p>} />
  </Routes>
);

const withState = (state: unknown) =>
  fakeAuth({ user: { access_token: 't', profile: { sub: 'u' }, state } as unknown as User });

describe('CallbackPage', () => {
  it('logado: volta para o returnTo do state', () => {
    renderWithProviders(ui, { route: '/callback', auth: withState({ returnTo: '/links/abc1234' }) });
    expect(screen.getByText('detalhe')).toBeInTheDocument();
  });

  it('returnTo externo é ignorado: vai para /links', () => {
    renderWithProviders(ui, { route: '/callback', auth: withState({ returnTo: 'https://evil.example' }) });
    expect(screen.getByText('meus links')).toBeInTheDocument();
  });

  it('enquanto troca o código, mostra "Concluindo login…"', () => {
    renderWithProviders(ui, { route: '/callback', auth: anonymousAuth({ isLoading: true }) });
    expect(screen.getByText('Concluindo login…')).toBeInTheDocument();
  });

  it('erro na troca do código: mostra o erro com link de volta', () => {
    const error = Object.assign(new Error('invalid_pkce'), { source: 'signinCallback' as const });
    renderWithProviders(ui, { route: '/callback', auth: anonymousAuth({ error }) });
    expect(screen.getByRole('alert')).toHaveTextContent('invalid_pkce');
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
  });

  it('acesso direto sem login: volta ao início', () => {
    renderWithProviders(ui, { route: '/callback', auth: anonymousAuth() });
    expect(screen.getByText('início')).toBeInTheDocument();
  });
});
