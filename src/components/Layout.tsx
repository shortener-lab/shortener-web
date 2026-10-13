import { useAuth } from 'react-oidc-context';
import { Link, Outlet } from 'react-router';
import { useLogout } from '../auth/useLogout';

export function Layout() {
  const auth = useAuth();
  const logout = useLogout();
  const who = auth.user?.profile.email ?? auth.user?.profile.sub;

  return (
    <>
      <header className="topbar">
        <Link to="/links" className="brand">shortener</Link>
        <span className="spacer" />
        {who && <span className="muted">{who}</span>}
        <button type="button" className="secondary" onClick={() => void logout()}>
          Sair
        </button>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
