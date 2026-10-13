import { Route, Routes } from 'react-router';
import { CallbackPage } from './auth/CallbackPage';
import { RequireAuth } from './auth/RequireAuth';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { LinkDetailPage } from './pages/LinkDetailPage';
import { LinksPage } from './pages/LinksPage';
import { NotFound } from './pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/links" element={<LinksPage />} />
        <Route path="/links/:code" element={<LinkDetailPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
