import { Link } from 'react-router';

export function NotFound() {
  return (
    <main className="container">
      <h1>Página não encontrada</h1>
      <p className="muted">Esse endereço não existe no painel.</p>
      <Link to="/">Voltar ao início</Link>
    </main>
  );
}
