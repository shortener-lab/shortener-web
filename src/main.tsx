import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import './index.css';
import { AppRoutes } from './App';
import { createQueryClient } from './api/queryClient';
import { AppAuthProvider } from './auth/AuthProvider';
import { getConfig } from './config';

const root = createRoot(document.getElementById('root')!);

try {
  getConfig(); // falha cedo e de forma visível se o /runtime/config.js estiver errado
  const queryClient = createQueryClient();
  root.render(
    <StrictMode>
      <AppAuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </QueryClientProvider>
      </AppAuthProvider>
    </StrictMode>,
  );
} catch (err) {
  root.render(
    <main className="container">
      <h1>Erro de configuração</h1>
      <pre role="alert">{err instanceof Error ? err.message : String(err)}</pre>
    </main>,
  );
}
