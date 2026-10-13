import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router';

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const redirected = useRef(false);
  const mustLogin = !auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !auth.error;

  const returnTo = location.pathname + location.search;

  useEffect(() => {
    if (!mustLogin || redirected.current) return;
    redirected.current = true; // o StrictMode roda efeitos 2x em dev; um redirect basta
    void auth.signinRedirect({ state: { returnTo } });
  }, [mustLogin, auth, returnTo]);

  // Com usuário ainda logado (ex.: a renovação silenciosa falhou por um instante), o app segue usável:
  // se o token vencer de fato, o 401 da api leva ao login.
  if (auth.isAuthenticated) return children;
  if (auth.error) {
    return (
      <div role="alert" className="error">
        <p>Falha no login: {auth.error.message}</p>
        <button type="button" onClick={() => void auth.signinRedirect({ state: { returnTo } })}>
          Entrar de novo
        </button>
      </div>
    );
  }
  return <p className="muted">Redirecionando para o login…</p>;
}
