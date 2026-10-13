import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { AuthContext, type AuthContextProps } from 'react-oidc-context';
import { vi } from 'vitest';
import { createQueryClient } from '../api/queryClient';

export const TEST_TOKEN = 'token-de-teste';

// Só os campos que o app usa; o resto do AuthContextProps não é tocado nos testes.
export function fakeAuth(overrides: Partial<AuthContextProps> = {}): AuthContextProps {
  const base = {
    isLoading: false,
    isAuthenticated: true,
    activeNavigator: undefined,
    error: undefined,
    user: {
      access_token: TEST_TOKEN,
      profile: { sub: 'user-1', email: 'ana@example.com' },
      state: undefined,
    },
    signinRedirect: vi.fn(() => Promise.resolve()),
    signoutRedirect: vi.fn(() => Promise.resolve()),
    removeUser: vi.fn(() => Promise.resolve()),
  };
  return { ...base, ...overrides } as unknown as AuthContextProps;
}

export function anonymousAuth(overrides: Partial<AuthContextProps> = {}): AuthContextProps {
  return fakeAuth({ isAuthenticated: false, user: null, ...overrides });
}

interface Options {
  route?: string;
  auth?: AuthContextProps;
}

export function createWrapper({ route = '/', auth = fakeAuth() }: Options = {}) {
  const queryClient = createQueryClient(); // um por teste: nada de cache vazando entre testes
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={auth}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    );
  }
  return Wrapper;
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const auth = options.auth ?? fakeAuth();
  const user = userEvent.setup(); // também instala um clipboard falso em navigator.clipboard
  return { user, auth, ...render(ui, { wrapper: createWrapper({ ...options, auth }) }) };
}
