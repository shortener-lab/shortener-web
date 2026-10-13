import { useAuth } from 'react-oidc-context';
import { Link, Navigate } from 'react-router';
import { returnToFrom } from './oidc';

export function CallbackPage() {
  const auth = useAuth();

  if (auth.error) {
    return (
      <main className="container">
        <p role="alert" className="error">Falha no login: {auth.error.message}</p>
        <Link to="/">Voltar ao início</Link>
      </main>
    );
  }
  if (auth.isLoading) {
    return (
      <main className="container">
        <p className="muted">Concluindo login…</p>
      </main>
    );
  }
  if (auth.isAuthenticated) return <Navigate to={returnToFrom(auth.user?.state)} replace />;
  return <Navigate to="/" replace />; // abriram /callback na mão, sem login em andamento
}
