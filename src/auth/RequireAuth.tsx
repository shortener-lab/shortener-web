import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router';

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const redirected = useRef(false);
  const mustLogin = !auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !auth.error;

  useEffect(() => {
    if (!mustLogin || redirected.current) return;
    redirected.current = true; // o StrictMode roda efeitos 2x em dev; um redirect basta
    void auth.signinRedirect({ state: { returnTo: location.pathname + location.search } });
  }, [mustLogin, auth, location.pathname, location.search]);

  if (auth.error) return <p role="alert" className="error">Falha no login: {auth.error.message}</p>;
  if (!auth.isAuthenticated) return <p className="muted">Redirecionando para o login…</p>;
  return children;
}
