import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router';

export function Landing() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <main className="container">
        <p className="muted">Carregando…</p>
      </main>
    );
  }
  if (auth.isAuthenticated) return <Navigate to="/links" replace />;

  return (
    <main className="container landing">
      <h1>Encurtador de links</h1>
      <p>Encurte URLs e acompanhe os cliques de cada link.</p>
      <button type="button" onClick={() => void auth.signinRedirect({ state: { returnTo: '/links' } })}>
        Entrar
      </button>
    </main>
  );
}
