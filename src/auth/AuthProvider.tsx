import { useState, type ReactNode } from 'react';
import { AuthProvider } from 'react-oidc-context';
import { getConfig } from '../config';
import { buildOidcSettings, clearAuthParamsFromUrl } from './oidc';

export function AppAuthProvider({ children }: { children: ReactNode }) {
  // O AuthProvider cria o UserManager uma vez; calculamos as settings uma vez também.
  const [settings] = useState(() => buildOidcSettings(getConfig(), window.location.origin));
  return (
    <AuthProvider {...settings} onSigninCallback={clearAuthParamsFromUrl}>
      {children}
    </AuthProvider>
  );
}
